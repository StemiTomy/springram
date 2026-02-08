package com.stelut.demostracion.social.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record UserPublicProfileResponse(
		UUID id,
		String email,
		String role,
		String preferredLanguage,
		Instant createdAt,
		long posts,
		long likes,
		long comments,
		long views,
		List<PostResponse> recentPosts
) {
}
