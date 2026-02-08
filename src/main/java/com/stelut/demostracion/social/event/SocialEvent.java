package com.stelut.demostracion.social.event;

import java.time.Instant;
import java.util.UUID;

public record SocialEvent(
		UUID eventId,
		SocialEventType type,
		UUID postId,
		UUID userId,
		UUID commentId,
		String commentContent,
		Instant occurredAt
) {
	public static SocialEvent like(UUID postId, UUID userId) {
		return new SocialEvent(UUID.randomUUID(), SocialEventType.LIKE, postId, userId, null, null, Instant.now());
	}

	public static SocialEvent unlike(UUID postId, UUID userId) {
		return new SocialEvent(UUID.randomUUID(), SocialEventType.UNLIKE, postId, userId, null, null, Instant.now());
	}

	public static SocialEvent view(UUID postId, UUID userId) {
		return new SocialEvent(UUID.randomUUID(), SocialEventType.VIEW, postId, userId, null, null, Instant.now());
	}

	public static SocialEvent comment(UUID postId, UUID userId, UUID commentId, String content, Instant occurredAt) {
		return new SocialEvent(UUID.randomUUID(), SocialEventType.COMMENT, postId, userId, commentId, content, occurredAt);
	}
}
