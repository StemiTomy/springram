package com.stelut.demostracion.social;

import java.time.Instant;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import com.stelut.demostracion.social.config.SocialAsyncProperties;
import com.stelut.demostracion.social.event.SocialEvent;
import com.stelut.demostracion.social.metrics.SocialMetrics;
import com.stelut.demostracion.user.User;
import com.stelut.demostracion.user.UserRepository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
@Transactional
public class SocialPostService {

	public record CommentSnapshot(
			UUID id,
			UUID postId,
			UUID userId,
			String content,
			Instant createdAt,
			Instant updatedAt
	) {
	}

	public record PostCounters(long likes, long views, long comments) {
	}

	private final PostRepository postRepository;
	private final PostLikeRepository postLikeRepository;
	private final PostViewRepository postViewRepository;
	private final PostCommentRepository postCommentRepository;
	private final UserRepository userRepository;
	private final SocialStatsCacheService socialStatsCacheService;
	private final SocialEventPublisher socialEventPublisher;
	private final SocialAsyncProperties socialAsyncProperties;
	private final SocialMetrics metrics;

	public SocialPostService(
			PostRepository postRepository,
			PostLikeRepository postLikeRepository,
			PostViewRepository postViewRepository,
			PostCommentRepository postCommentRepository,
			UserRepository userRepository,
			SocialStatsCacheService socialStatsCacheService,
			SocialEventPublisher socialEventPublisher,
			SocialAsyncProperties socialAsyncProperties,
			SocialMetrics metrics
	) {
		this.postRepository = postRepository;
		this.postLikeRepository = postLikeRepository;
		this.postViewRepository = postViewRepository;
		this.postCommentRepository = postCommentRepository;
		this.userRepository = userRepository;
		this.socialStatsCacheService = socialStatsCacheService;
		this.socialEventPublisher = socialEventPublisher;
		this.socialAsyncProperties = socialAsyncProperties;
		this.metrics = metrics;
	}

	public Post createPost(UUID authorId, String authorDisplayName, String content) {
		User author = userRepository.findById(authorId)
				.orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "author not found"));

		String resolvedDisplayName = StringUtils.hasText(authorDisplayName)
				? authorDisplayName.trim()
				: author.getEmail();

		Post post = new Post(UUID.randomUUID(), author, resolvedDisplayName, content);
		Post saved = postRepository.save(post);

		socialStatsCacheService.markPostExists(saved.getId());
		socialStatsCacheService.setStats(saved.getId(), 0, 0, 0);

		return saved;
	}

	public void likePost(UUID postId, UUID userId) {
		ensurePostKnown(postId);

		if (!socialAsyncProperties.asyncEnabled()) {
			persistLike(postId, userId, Instant.now(), true);
			metrics.dbFallback("like");
			return;
		}

		Boolean shouldPublish = socialStatsCacheService.registerLike(postId, userId);
		if (Boolean.FALSE.equals(shouldPublish)) {
			return;
		}

		boolean queued = socialEventPublisher.publish(SocialEvent.like(postId, userId));
		if (!queued) {
			persistLike(postId, userId, Instant.now(), false);
			metrics.dbFallback("like");
		}
	}

	public void unlikePost(UUID postId, UUID userId) {
		ensurePostKnown(postId);

		if (!socialAsyncProperties.asyncEnabled()) {
			persistUnlike(postId, userId, true);
			metrics.dbFallback("unlike");
			return;
		}

		Boolean shouldPublish = socialStatsCacheService.unregisterLike(postId, userId);
		if (Boolean.FALSE.equals(shouldPublish)) {
			return;
		}

		boolean queued = socialEventPublisher.publish(SocialEvent.unlike(postId, userId));
		if (!queued) {
			persistUnlike(postId, userId, false);
			metrics.dbFallback("unlike");
		}
	}

	public void registerView(UUID postId, UUID userId) {
		ensurePostKnown(postId);

		if (!socialAsyncProperties.asyncEnabled()) {
			persistView(postId, userId, Instant.now(), true);
			metrics.dbFallback("view");
			return;
		}

		socialStatsCacheService.registerView(postId);

		boolean queued = socialEventPublisher.publish(SocialEvent.view(postId, userId));
		if (!queued) {
			persistView(postId, userId, Instant.now(), false);
			metrics.dbFallback("view");
		}
	}

	public CommentSnapshot addComment(UUID postId, UUID userId, String content) {
		ensurePostKnown(postId);

		Instant now = Instant.now();
		UUID commentId = UUID.randomUUID();

		if (!socialAsyncProperties.asyncEnabled()) {
			persistComment(postId, userId, commentId, content, now, true);
			metrics.dbFallback("comment");
			return new CommentSnapshot(commentId, postId, userId, content, now, now);
		}

		socialStatsCacheService.registerComment(postId);

		boolean queued = socialEventPublisher.publish(SocialEvent.comment(postId, userId, commentId, content, now));
		if (!queued) {
			persistComment(postId, userId, commentId, content, now, false);
			metrics.dbFallback("comment");
		}

		return new CommentSnapshot(commentId, postId, userId, content, now, now);
	}

	@Transactional(readOnly = true)
	public Page<Post> getFeed(int page, int size) {
		PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
		return postRepository.findAll(pageable);
	}

	@Transactional(readOnly = true)
	public List<CommentSnapshot> listComments(UUID postId, int size) {
		if (!postRepository.existsById(postId)) {
			throw new ResponseStatusException(NOT_FOUND, "post not found");
		}
		return postCommentRepository.findByPostIdOrderByCreatedAtAsc(
				postId,
				PageRequest.of(0, size)
		).getContent().stream().map(comment -> new CommentSnapshot(
				comment.getId(),
				comment.getPost().getId(),
				comment.getUser().getId(),
				comment.getContent(),
				comment.getCreatedAt(),
				comment.getUpdatedAt()
		)).toList();
	}

	@Transactional(readOnly = true)
	public Set<UUID> findLikedPostIds(UUID userId, Collection<UUID> postIds) {
		if (postIds == null || postIds.isEmpty()) {
			return Set.of();
		}
		return new HashSet<>(postLikeRepository.findLikedPostIdsByUserAndPostIds(userId, postIds));
	}

	@Transactional(readOnly = true)
	public PostCounters getPostCounters(UUID postId) {
		Optional<SocialStatsCacheService.CachedStats> cached = socialStatsCacheService.getStats(postId);
		if (cached.isPresent()) {
			SocialStatsCacheService.CachedStats stats = cached.get();
			return new PostCounters(stats.likes(), stats.views(), stats.comments());
		}

		long likes = postLikeRepository.countByPostId(postId);
		long views = postViewRepository.sumViewCountByPostId(postId);
		long comments = postCommentRepository.countByPostId(postId);

		socialStatsCacheService.setStats(postId, likes, views, comments);
		return new PostCounters(likes, views, comments);
	}

	public long countLikes(UUID postId) {
		return getPostCounters(postId).likes();
	}

	public long countViews(UUID postId) {
		return getPostCounters(postId).views();
	}

	public long countComments(UUID postId) {
		return getPostCounters(postId).comments();
	}

	private void ensurePostKnown(UUID postId) {
		if (!socialStatsCacheService.isEnabled()) {
			return;
		}
		if (socialStatsCacheService.isPostKnown(postId)) {
			return;
		}
		if (!postRepository.existsById(postId)) {
			throw new ResponseStatusException(NOT_FOUND, "post not found");
		}
		socialStatsCacheService.markPostExists(postId);
	}

	private void persistLike(UUID postId, UUID userId, Instant at, boolean updateCache) {
		int inserted = postLikeRepository.insertIgnore(UUID.randomUUID(), postId, userId, at);
		if (inserted > 0 && updateCache) {
			socialStatsCacheService.registerLike(postId, userId);
		}
	}

	private void persistUnlike(UUID postId, UUID userId, boolean updateCache) {
		int deleted = postLikeRepository.deleteByPostIdAndUserId(postId, userId);
		if (deleted > 0 && updateCache) {
			socialStatsCacheService.unregisterLike(postId, userId);
		}
	}

	private void persistView(UUID postId, UUID userId, Instant at, boolean updateCache) {
		postViewRepository.upsertView(UUID.randomUUID(), postId, userId, at);
		if (updateCache) {
			socialStatsCacheService.registerView(postId);
		}
	}

	private void persistComment(UUID postId, UUID userId, UUID commentId, String content, Instant at, boolean updateCache) {
		int inserted = postCommentRepository.insertIgnore(commentId, postId, userId, content, at);
		if (inserted > 0 && updateCache) {
			socialStatsCacheService.registerComment(postId);
		}
	}
}
