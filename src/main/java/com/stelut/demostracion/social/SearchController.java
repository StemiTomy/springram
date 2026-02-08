package com.stelut.demostracion.social;

import java.util.List;
import java.util.Set;
import java.util.UUID;

import com.stelut.demostracion.social.dto.SearchResultItemResponse;
import com.stelut.demostracion.social.dto.SearchResultsPageResponse;
import com.stelut.demostracion.social.dto.SearchSuggestionItemResponse;
import com.stelut.demostracion.social.dto.SearchSuggestionsResponse;
import com.stelut.demostracion.user.User;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

import org.springframework.data.domain.Page;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@RestController
@RequestMapping("/api/v1/search")
@Validated
public class SearchController {

	private final SocialSearchService socialSearchService;
	private final SocialPostService socialPostService;

	public SearchController(SocialSearchService socialSearchService, SocialPostService socialPostService) {
		this.socialSearchService = socialSearchService;
		this.socialPostService = socialPostService;
	}

	@GetMapping("/suggestions")
	public SearchSuggestionsResponse suggestions(
			@RequestParam(name = "q", defaultValue = "") String query,
			@RequestParam(name = "type", defaultValue = "posts") String rawType,
			@RequestParam(name = "limit", defaultValue = "10") @Min(1) @Max(10) int limit
	) {
		String type = normalizeType(rawType);
		List<SearchSuggestionItemResponse> items = type.equals("users")
				? socialSearchService.searchUsers(query, limit)
				: socialSearchService.searchPosts(query, limit);

		return new SearchSuggestionsResponse(query, type, items);
	}

	@GetMapping("/results")
	public SearchResultsPageResponse results(
			@AuthenticationPrincipal Jwt jwt,
			@RequestParam(name = "q", defaultValue = "") String query,
			@RequestParam(name = "type", defaultValue = "posts") String rawType,
			@RequestParam(name = "page", defaultValue = "0") @Min(0) int page,
			@RequestParam(name = "size", defaultValue = "20") @Min(1) @Max(50) int size
	) {
		String type = normalizeType(rawType);
		UUID userId = requireUserId(jwt);

		if (type.equals("users")) {
			Page<User> users = socialSearchService.searchUsersPage(query, page, size);
			List<SearchResultItemResponse> items = users.getContent().stream().map(user -> {
				SocialSearchService.UserAggregates aggregates = socialSearchService.getUserAggregates(user.getId());
				return new SearchResultItemResponse(
						user.getId().toString(),
						"user",
						user.getEmail(),
						user.getRole().name(),
						user.getId().toString(),
						user.getCreatedAt(),
						aggregates.posts(),
						aggregates.likes(),
						aggregates.views(),
						aggregates.comments(),
						false
				);
			}).toList();

			return new SearchResultsPageResponse(
					query,
					type,
					items,
					users.getNumber(),
					users.getSize(),
					users.getTotalElements(),
					users.getTotalPages()
			);
		}

		Page<Post> posts = socialSearchService.searchPostsPage(query, page, size);
		Set<UUID> postIds = posts.getContent().stream().map(Post::getId).collect(java.util.stream.Collectors.toSet());
		Set<UUID> likedPostIds = socialPostService.findLikedPostIds(userId, postIds);

		List<SearchResultItemResponse> items = posts.getContent().stream().map(post -> {
			SocialPostService.PostCounters counters = socialPostService.getPostCounters(post.getId());
			return new SearchResultItemResponse(
					post.getId().toString(),
					"post",
					post.getContent(),
					post.getAuthorDisplayName(),
					post.getAuthor().getId().toString(),
					post.getCreatedAt(),
					0,
					counters.likes(),
					counters.views(),
					counters.comments(),
					likedPostIds.contains(post.getId())
			);
		}).toList();

		return new SearchResultsPageResponse(
				query,
				type,
				items,
				posts.getNumber(),
				posts.getSize(),
				posts.getTotalElements(),
				posts.getTotalPages()
		);
	}

	private String normalizeType(String rawType) {
		if (rawType == null) {
			return "posts";
		}
		return rawType.equalsIgnoreCase("users") ? "users" : "posts";
	}

	private UUID requireUserId(Jwt jwt) {
		if (jwt == null || jwt.getSubject() == null || jwt.getSubject().isBlank()) {
			throw new ResponseStatusException(UNAUTHORIZED, "invalid token");
		}
		try {
			return UUID.fromString(jwt.getSubject());
		} catch (IllegalArgumentException ex) {
			throw new ResponseStatusException(UNAUTHORIZED, "invalid token");
		}
	}
}
