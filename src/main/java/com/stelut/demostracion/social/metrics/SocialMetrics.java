package com.stelut.demostracion.social.metrics;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;

import org.springframework.stereotype.Component;

@Component
public class SocialMetrics {

	private final MeterRegistry registry;

	public SocialMetrics(MeterRegistry registry) {
		this.registry = registry;
	}

	public void redisCacheHit() {
		registry.counter("social.redis.cache", "result", "hit").increment();
	}

	public void redisCacheMiss() {
		registry.counter("social.redis.cache", "result", "miss").increment();
	}

	public void redisError() {
		registry.counter("social.redis.error").increment();
	}

	public void kafkaPublished(String type) {
		registry.counter("social.kafka.published", "type", type).increment();
	}

	public void kafkaFailed(String type) {
		registry.counter("social.kafka.failed", "type", type).increment();
	}

	public void kafkaConsumed(String type) {
		registry.counter("social.kafka.consumed", "type", type).increment();
	}

	public void kafkaDbError(String type) {
		registry.counter("social.kafka.db_error", "type", type).increment();
	}

	public void dbFallback(String operation) {
		registry.counter("social.db.fallback", "operation", operation).increment();
	}
}
