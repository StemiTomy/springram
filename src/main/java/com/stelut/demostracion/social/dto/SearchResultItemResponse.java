package com.stelut.demostracion.social.dto;

import java.time.Instant;

public record SearchResultItemResponse(
		String id,
		String kind,
		String primaryText,
		String secondaryText,
		Instant createdAt,
		long posts,
		long likes,
		long views,
		long comments,
		boolean likedByMe
) {
}
