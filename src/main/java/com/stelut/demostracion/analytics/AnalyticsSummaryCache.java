package com.stelut.demostracion.analytics;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicReference;

import com.stelut.demostracion.analytics.dto.AnalyticsSummaryResponse;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class AnalyticsSummaryCache {

	private static final Logger log = LoggerFactory.getLogger(AnalyticsSummaryCache.class);

	private record CacheEntry(AnalyticsSummaryResponse summary, Instant cachedAt) {
	}

	private final ConcurrentHashMap<String, Object> lifecycleState = new ConcurrentHashMap<>();
	private final AtomicReference<CacheEntry> summaryRef = new AtomicReference<>();

	@PostConstruct
	void init() {
		lifecycleState.put("status", "READY");
		lifecycleState.put("startedAt", Instant.now().toString());
		log.info("AnalyticsSummaryCache initialized");
	}

	@PreDestroy
	void cleanup() {
		CacheEntry entry = summaryRef.get();
		if (entry != null) {
			log.info("AnalyticsSummaryCache cleanup: last cache age={}s", Duration.between(entry.cachedAt(), Instant.now()).toSeconds());
		}
		summaryRef.set(null);
		lifecycleState.clear();
		log.info("AnalyticsSummaryCache cleared");
	}

	Optional<AnalyticsSummaryResponse> getIfFresh(Duration ttl) {
		CacheEntry entry = summaryRef.get();
		if (entry == null) {
			return Optional.empty();
		}
		if (ttl.isZero() || ttl.isNegative()) {
			return Optional.empty();
		}
		Duration age = Duration.between(entry.cachedAt(), Instant.now());
		if (age.compareTo(ttl) > 0) {
			return Optional.empty();
		}
		return Optional.of(entry.summary());
	}

	void put(AnalyticsSummaryResponse summary) {
		summaryRef.set(new CacheEntry(summary, Instant.now()));
	}
}
