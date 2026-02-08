package com.stelut.demostracion.social;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import com.stelut.demostracion.social.config.SocialAsyncProperties;
import com.stelut.demostracion.social.metrics.SocialMetrics;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Service
public class SocialStatsCacheService {

	public record CachedStats(long likes, long views, long comments) {
	}

	private static final Logger log = LoggerFactory.getLogger(SocialStatsCacheService.class);
	private static final String FIELD_LIKES = "likes";
	private static final String FIELD_VIEWS = "views";
	private static final String FIELD_COMMENTS = "comments";
	private static final String POSTS_SET_KEY = "social:posts";

	private final StringRedisTemplate redis;
	private final SocialAsyncProperties properties;
	private final SocialMetrics metrics;

	public SocialStatsCacheService(StringRedisTemplate redis, SocialAsyncProperties properties, SocialMetrics metrics) {
		this.redis = redis;
		this.properties = properties;
		this.metrics = metrics;
	}

	public boolean isEnabled() {
		return properties.redisEnabled();
	}

	public void markPostExists(UUID postId) {
		if (!isEnabled()) {
			return;
		}
		try {
			redis.opsForSet().add(POSTS_SET_KEY, postId.toString());
			applyTtl(POSTS_SET_KEY, properties.redisPostsTtl());
		} catch (RuntimeException ex) {
			metrics.redisError();
			log.warn("redis markPostExists failed postId={}", postId, ex);
		}
	}

	public boolean isPostKnown(UUID postId) {
		if (!isEnabled()) {
			return false;
		}
		try {
			Boolean member = redis.opsForSet().isMember(POSTS_SET_KEY, postId.toString());
			if (Boolean.TRUE.equals(member)) {
				metrics.redisCacheHit();
			} else {
				metrics.redisCacheMiss();
			}
			return Boolean.TRUE.equals(member);
		} catch (RuntimeException ex) {
			metrics.redisError();
			log.warn("redis isPostKnown failed postId={}", postId, ex);
			return false;
		}
	}

	public Boolean registerLike(UUID postId, UUID userId) {
		if (!isEnabled()) {
			return null;
		}
		try {
			Long added = redis.opsForSet().add(likesUsersKey(postId), userId.toString());
			if (added != null && added > 0) {
				redis.opsForHash().increment(statsKey(postId), FIELD_LIKES, 1);
				applyTtl(statsKey(postId), properties.redisStatsTtl());
				applyTtl(likesUsersKey(postId), properties.redisLikesTtl());
				return true;
			}
			return false;
		} catch (RuntimeException ex) {
			metrics.redisError();
			log.warn("redis registerLike failed postId={} userId={}", postId, userId, ex);
			return null;
		}
	}

	public Boolean unregisterLike(UUID postId, UUID userId) {
		if (!isEnabled()) {
			return null;
		}
		try {
			Long removed = redis.opsForSet().remove(likesUsersKey(postId), userId.toString());
			if (removed != null && removed > 0) {
				Long newLikes = redis.opsForHash().increment(statsKey(postId), FIELD_LIKES, -1);
				if (newLikes != null && newLikes < 0) {
					redis.opsForHash().put(statsKey(postId), FIELD_LIKES, "0");
				}
				applyTtl(statsKey(postId), properties.redisStatsTtl());
				applyTtl(likesUsersKey(postId), properties.redisLikesTtl());
				return true;
			}
			return false;
		} catch (RuntimeException ex) {
			metrics.redisError();
			log.warn("redis unregisterLike failed postId={} userId={}", postId, userId, ex);
			return null;
		}
	}

	public void registerView(UUID postId) {
		if (!isEnabled()) {
			return;
		}
		try {
			redis.opsForHash().increment(statsKey(postId), FIELD_VIEWS, 1);
			applyTtl(statsKey(postId), properties.redisStatsTtl());
		} catch (RuntimeException ex) {
			metrics.redisError();
			log.warn("redis registerView failed postId={}", postId, ex);
		}
	}

	public void registerComment(UUID postId) {
		if (!isEnabled()) {
			return;
		}
		try {
			redis.opsForHash().increment(statsKey(postId), FIELD_COMMENTS, 1);
			applyTtl(statsKey(postId), properties.redisStatsTtl());
		} catch (RuntimeException ex) {
			metrics.redisError();
			log.warn("redis registerComment failed postId={}", postId, ex);
		}
	}

	public Optional<CachedStats> getStats(UUID postId) {
		if (!isEnabled()) {
			return Optional.empty();
		}
		try {
			Map<Object, Object> raw = redis.opsForHash().entries(statsKey(postId));
			if (raw == null || raw.isEmpty()) {
				metrics.redisCacheMiss();
				return Optional.empty();
			}
			metrics.redisCacheHit();
			return Optional.of(new CachedStats(
					parseLong(raw.get(FIELD_LIKES)),
					parseLong(raw.get(FIELD_VIEWS)),
					parseLong(raw.get(FIELD_COMMENTS))
			));
		} catch (RuntimeException ex) {
			metrics.redisError();
			log.warn("redis getStats failed postId={}", postId, ex);
			return Optional.empty();
		}
	}

	public void setStats(UUID postId, long likes, long views, long comments) {
		if (!isEnabled()) {
			return;
		}
		try {
			redis.opsForHash().put(statsKey(postId), FIELD_LIKES, Long.toString(likes));
			redis.opsForHash().put(statsKey(postId), FIELD_VIEWS, Long.toString(views));
			redis.opsForHash().put(statsKey(postId), FIELD_COMMENTS, Long.toString(comments));
			applyTtl(statsKey(postId), properties.redisStatsTtl());
		} catch (RuntimeException ex) {
			metrics.redisError();
			log.warn("redis setStats failed postId={}", postId, ex);
		}
	}

	private String statsKey(UUID postId) {
		return "social:post:" + postId + ":stats";
	}

	private String likesUsersKey(UUID postId) {
		return "social:post:" + postId + ":likes:users";
	}

	private void applyTtl(String key, java.time.Duration ttl) {
		if (ttl == null || ttl.isZero() || ttl.isNegative()) {
			return;
		}
		redis.expire(key, ttl);
	}

	private long parseLong(Object value) {
		if (value == null) {
			return 0L;
		}
		try {
			return Long.parseLong(value.toString());
		} catch (NumberFormatException ex) {
			return 0L;
		}
	}
}
