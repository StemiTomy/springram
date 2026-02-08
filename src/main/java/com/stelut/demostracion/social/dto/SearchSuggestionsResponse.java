package com.stelut.demostracion.social.dto;

import java.util.List;

public record SearchSuggestionsResponse(
		String query,
		String type,
		List<SearchSuggestionItemResponse> items
) {
}
