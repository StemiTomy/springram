package com.stelut.demostracion.social.dto;

import java.util.List;

public record PostCommentsPageResponse(
		List<PostCommentResponse> items,
		int page,
		int size,
		long totalElements,
		int totalPages
) {
}
