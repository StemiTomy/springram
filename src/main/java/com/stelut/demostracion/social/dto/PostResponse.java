package com.stelut.demostracion.social.dto;

import java.time.Instant;
import java.util.UUID;

public record PostResponse(
		UUID id,
		String authorDisplayName,
		String content,
		Instant createdAt,
		Instant updatedAt,
		long likes,
		long views,
		long comments,
		boolean likedByMe
) {
}
