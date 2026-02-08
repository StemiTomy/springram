package com.stelut.demostracion.social.config;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.social")
public record SocialAsyncProperties(
		boolean asyncEnabled,
		boolean redisEnabled,
		String kafkaTopic,
		Duration kafkaSendTimeout,
		Duration redisStatsTtl,
		Duration redisLikesTtl,
		Duration redisPostsTtl
) {
}
