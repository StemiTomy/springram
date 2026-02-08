package com.stelut.demostracion.social;

import java.util.List;
import java.util.UUID;

import com.stelut.demostracion.social.dto.SearchSuggestionItemResponse;
import com.stelut.demostracion.user.User;
import com.stelut.demostracion.user.UserRepository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@Transactional(readOnly = true)
public class SocialSearchService {

	private final PostRepository postRepository;
	private final PostLikeRepository postLikeRepository;
	private final PostCommentRepository postCommentRepository;
	private final PostViewRepository postViewRepository;
	private final UserRepository userRepository;

	public SocialSearchService(
			PostRepository postRepository,
			PostLikeRepository postLikeRepository,
			PostCommentRepository postCommentRepository,
			PostViewRepository postViewRepository,
			UserRepository userRepository
	) {
		this.postRepository = postRepository;
		this.postLikeRepository = postLikeRepository;
		this.postCommentRepository = postCommentRepository;
		this.postViewRepository = postViewRepository;
		this.userRepository = userRepository;
	}

	public List<SearchSuggestionItemResponse> searchPosts(String rawQuery, int limit) {
		String query = normalizeQuery(rawQuery);
		if (query.isEmpty()) {
			return List.of();
		}
		return postRepository.searchSuggestions(query, PageRequest.of(0, limit)).stream()
				.map(post -> new SearchSuggestionItemResponse(
						post.getId().toString(),
						"post",
						shorten(post.getContent(), 120),
						"by " + post.getAuthorDisplayName()
				))
				.toList();
	}

	public List<SearchSuggestionItemResponse> searchUsers(String rawQuery, int limit) {
		String query = normalizeQuery(rawQuery);
		if (query.isEmpty()) {
			return List.of();
		}
		return userRepository.searchSuggestionsByEmail(query, PageRequest.of(0, limit)).stream()
				.map(user -> new SearchSuggestionItemResponse(
						user.getId().toString(),
						"user",
						user.getEmail(),
						""
				))
				.toList();
	}

	public Page<Post> searchPostsPage(String rawQuery, int page, int size) {
		String query = normalizeQuery(rawQuery);
		if (query.isEmpty()) {
			return Page.empty();
		}
		PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
		return postRepository.searchResults(query, pageable);
	}

	public Page<User> searchUsersPage(String rawQuery, int page, int size) {
		String query = normalizeQuery(rawQuery);
		if (query.isEmpty()) {
			return Page.empty();
		}
		PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
		return userRepository.searchResultsByEmail(query, pageable);
	}

	public UserAggregates getUserAggregates(UUID userId) {
		long posts = postRepository.countByAuthorId(userId);
		long likes = postLikeRepository.countReceivedByAuthorId(userId);
		long comments = postCommentRepository.countReceivedByAuthorId(userId);
		long views = postViewRepository.sumViewsReceivedByAuthorId(userId);
		return new UserAggregates(posts, likes, comments, views);
	}

	private String normalizeQuery(String rawQuery) {
		if (!StringUtils.hasText(rawQuery)) {
			return "";
		}
		return rawQuery.trim();
	}

	private String shorten(String value, int maxLen) {
		if (value == null || value.length() <= maxLen) {
			return value;
		}
		return value.substring(0, maxLen - 1) + "…";
	}

	public record UserAggregates(long posts, long likes, long comments, long views) {
	}
}
