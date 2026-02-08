package com.stelut.demostracion.social.dto;

import java.util.List;

public record SearchResultsPageResponse(
		String query,
		String type,
		List<SearchResultItemResponse> items,
		int page,
		int size,
		long totalElements,
		int totalPages
) {
}
