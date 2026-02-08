package com.stelut.demostracion.analytics.dto;

import java.time.Instant;
import java.util.UUID;

public record TopPostSummaryResponse(
		UUID postId,
		String authorDisplayName,
		String contentPreview,
		Instant createdAt,
		long likes,
		long views,
		long comments
) {
}
