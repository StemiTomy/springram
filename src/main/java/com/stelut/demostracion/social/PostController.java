package com.stelut.demostracion.social;

import java.util.List;
import java.util.Set;
import java.util.UUID;

import com.stelut.demostracion.social.dto.CreateCommentRequest;
import com.stelut.demostracion.social.dto.CreatePostRequest;
import com.stelut.demostracion.social.dto.FeedResponse;
import com.stelut.demostracion.social.dto.PostCommentResponse;
import com.stelut.demostracion.social.dto.PostCommentsPageResponse;
import com.stelut.demostracion.social.dto.PostResponse;
import com.stelut.demostracion.social.dto.PostStatsResponse;
import com.stelut.demostracion.social.mapper.PostMapper;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/posts")
@Validated
public class PostController {

	private final SocialPostService socialPostService;
	private final PostMapper postMapper; // mapstruct se usa aqui

	public PostController(SocialPostService socialPostService, PostMapper postMapper) {
		this.socialPostService = socialPostService;
		this.postMapper = postMapper;
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public PostResponse createPost(
			@AuthenticationPrincipal Jwt jwt,
			@Valid @RequestBody CreatePostRequest request
	) {
		UUID userId = requireUserId(jwt);
		Post post = socialPostService.createPost(userId, request.authorDisplayName(), request.content());
		return toPostResponse(post, false);
	}

	@PostMapping("/{postId}/like")
	public PostStatsResponse likePost(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID postId) {
		UUID userId = requireUserId(jwt);
		socialPostService.likePost(postId, userId);
		return buildStats(postId);
	}

	@DeleteMapping("/{postId}/like")
	public PostStatsResponse unlikePost(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID postId) {
		UUID userId = requireUserId(jwt);
		socialPostService.unlikePost(postId, userId);
		return buildStats(postId);
	}

	@PostMapping("/{postId}/view")
	public PostStatsResponse viewPost(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID postId) {
		UUID userId = requireUserId(jwt);
		socialPostService.registerView(postId, userId);
		return buildStats(postId);
	}

	@PostMapping("/{postId}/comments")
	@ResponseStatus(HttpStatus.CREATED)
	public PostCommentResponse commentPost(
			@AuthenticationPrincipal Jwt jwt,
			@PathVariable UUID postId,
			@Valid @RequestBody CreateCommentRequest request
	) {
		UUID userId = requireUserId(jwt);
		SocialPostService.CommentSnapshot comment = socialPostService.addComment(postId, userId, request.content());
		return new PostCommentResponse(
				comment.id(),
				postId,
				comment.userId(),
				comment.userDisplayName(),
				comment.content(),
				comment.createdAt(),
				comment.updatedAt()
		);
	}

	@GetMapping("/{postId}")
	public PostResponse postDetail(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID postId) {
		UUID userId = requireUserId(jwt);
		Post post = socialPostService.getPost(postId);
		boolean likedByMe = socialPostService.findLikedPostIds(userId, Set.of(postId)).contains(postId);
		return toPostResponse(post, likedByMe);
	}

	@GetMapping("/{postId}/comments")
	public PostCommentsPageResponse listComments(
			@PathVariable UUID postId,
			@RequestParam(defaultValue = "0") @Min(0) int page,
			@RequestParam(defaultValue = "50") @Min(1) @Max(200) int size
	) {
		Page<SocialPostService.CommentSnapshot> commentsPage = socialPostService.listComments(postId, page, size);
		List<PostCommentResponse> items = commentsPage.getContent().stream()
				.map(comment -> new PostCommentResponse(
						comment.id(),
						comment.postId(),
						comment.userId(),
						comment.userDisplayName(),
						comment.content(),
						comment.createdAt(),
						comment.updatedAt()
				))
				.toList();
		return new PostCommentsPageResponse(
				items,
				commentsPage.getNumber(),
				commentsPage.getSize(),
				commentsPage.getTotalElements(),
				commentsPage.getTotalPages()
		);
	}

	@GetMapping("/feed")
	public FeedResponse feed(
			@AuthenticationPrincipal Jwt jwt,
			@RequestParam(defaultValue = "0") @Min(0) int page,
			@RequestParam(defaultValue = "20") @Min(1) @Max(100) int size
	) {
		UUID userId = requireUserId(jwt);
		Page<Post> feed = socialPostService.getFeed(page, size);
		Set<UUID> postIds = feed.getContent().stream().map(Post::getId).collect(java.util.stream.Collectors.toSet());
		Set<UUID> likedPostIds = socialPostService.findLikedPostIds(userId, postIds);

		List<PostResponse> items = feed.getContent().stream()
				.map(post -> toPostResponse(post, likedPostIds.contains(post.getId())))
				.toList();

		return new FeedResponse(
				items,
				feed.getNumber(),
				feed.getSize(),
				feed.getTotalElements(),
				feed.getTotalPages()
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

	private PostResponse toPostResponse(Post post, boolean likedByMe) {
		SocialPostService.PostCounters counters = socialPostService.getPostCounters(post.getId());
		return postMapper.toPostResponse(
				post,
				counters.likes(),
				counters.views(),
				counters.comments(),
				likedByMe
		);
	}

	private PostStatsResponse buildStats(UUID postId) {
		SocialPostService.PostCounters counters = socialPostService.getPostCounters(postId);
		return new PostStatsResponse(
				postId,
				counters.likes(),
				counters.views(),
				counters.comments()
		);
	}
}
