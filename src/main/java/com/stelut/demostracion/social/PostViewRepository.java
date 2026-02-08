package com.stelut.demostracion.social;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PostViewRepository extends JpaRepository<PostView, UUID> {
	Optional<PostView> findByPostIdAndUserId(UUID postId, UUID userId);

	@Query("select coalesce(sum(v.viewCount), 0) from PostView v where v.post.id = :postId")
	long sumViewCountByPostId(@Param("postId") UUID postId);

	@Modifying
	@Query(
			value = """
					INSERT INTO post_views (id, post_id, user_id, first_viewed_at, last_viewed_at, view_count)
					VALUES (:id, :postId, :userId, :at, :at, 1)
					ON CONFLICT (post_id, user_id)
					DO UPDATE SET
						last_viewed_at = EXCLUDED.last_viewed_at,
						view_count = post_views.view_count + 1
					""",
			nativeQuery = true
	)
	int upsertView(
			@Param("id") UUID id,
			@Param("postId") UUID postId,
			@Param("userId") UUID userId,
			@Param("at") Instant at
	);

	@Query("select coalesce(sum(v.viewCount), 0) from PostView v where v.post.author.id = :authorId")
	long sumViewsReceivedByAuthorId(@Param("authorId") UUID authorId);
}
