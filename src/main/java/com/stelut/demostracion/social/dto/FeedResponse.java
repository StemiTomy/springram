package com.stelut.demostracion.social.dto;

import java.util.List;

public record FeedResponse(
		List<PostResponse> items,
		int page,
		int size,
		long totalElements,
		int totalPages
) {
}
