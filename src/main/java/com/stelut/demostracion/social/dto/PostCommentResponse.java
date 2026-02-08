package com.stelut.demostracion.social.dto;

import java.time.Instant;
import java.util.UUID;

public record PostCommentResponse(
		UUID id,
		UUID postId,
		UUID userId,
		String userDisplayName,
		String content,
		Instant createdAt,
		Instant updatedAt
) {
}
