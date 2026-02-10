package com.stelut.demostracion.social;

import java.util.List;
import java.util.Set;
import java.util.UUID;

import com.stelut.demostracion.social.dto.PostResponse;
import com.stelut.demostracion.social.dto.UserPublicProfileResponse;
import com.stelut.demostracion.social.mapper.PostMapper;
import com.stelut.demostracion.user.User;
import com.stelut.demostracion.user.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

	private final UserRepository userRepository;
	private final SocialSearchService socialSearchService;
	private final SocialPostService socialPostService;
	private final PostMapper postMapper;

	public UserController(
			UserRepository userRepository,
			SocialSearchService socialSearchService,
			SocialPostService socialPostService,
			PostMapper postMapper
	) {
		this.userRepository = userRepository;
		this.socialSearchService = socialSearchService;
		this.socialPostService = socialPostService;
		this.postMapper = postMapper;
	}

	@GetMapping("/{userId}")
	public UserPublicProfileResponse userProfile(
			@AuthenticationPrincipal Jwt jwt,
			@PathVariable UUID userId,
			@RequestParam(defaultValue = "20") int recentPostsLimit
	) {
		UUID currentUserId = requireUserId(jwt);
		int resolvedLimit = Math.max(1, Math.min(recentPostsLimit, 50));

		User user = userRepository.findById(userId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "user not found"));

		SocialSearchService.UserAggregates aggregates = socialSearchService.getUserAggregates(userId);
		List<Post> recentPosts = socialPostService.findRecentPostsByAuthor(userId, resolvedLimit);
		Set<UUID> postIds = recentPosts.stream().map(Post::getId).collect(java.util.stream.Collectors.toSet());
		Set<UUID> likedPostIds = socialPostService.findLikedPostIds(currentUserId, postIds);

		List<PostResponse> recentPostResponses = recentPosts.stream()
				.map(post -> {
					SocialPostService.PostCounters counters = socialPostService.getPostCounters(post.getId());
					return postMapper.toPostResponse(
							post,
							counters.likes(),
							counters.views(),
							counters.comments(),
							likedPostIds.contains(post.getId())
					);
				})
				.toList();

		return new UserPublicProfileResponse(
				user.getId(),
				user.getEmail(),
				user.getRole().name(),
				user.getPreferredLanguage(),
				user.getCreatedAt(),
				aggregates.posts(),
				aggregates.likes(),
				aggregates.comments(),
				aggregates.views(),
				recentPostResponses
		);
	}

	private UUID requireUserId(Jwt jwt) {
		if (jwt == null || jwt.getSubject() == null || jwt.getSubject().isBlank()) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid token");
		}
		try {
			return UUID.fromString(jwt.getSubject());
		} catch (IllegalArgumentException ex) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid token");
		}
	}
}
