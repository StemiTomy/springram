package com.stelut.demostracion.social;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PostCommentRepository extends JpaRepository<PostComment, UUID> {
	List<PostComment> findByPostIdOrderByCreatedAtAsc(UUID postId);

	Page<PostComment> findByPostIdOrderByCreatedAtAsc(UUID postId, Pageable pageable);

	long countByPostId(UUID postId);

	@Modifying
	@Query(
			value = """
					INSERT INTO post_comments (id, post_id, user_id, content, created_at, updated_at)
					VALUES (:id, :postId, :userId, :content, :at, :at)
					ON CONFLICT (id) DO NOTHING
					""",
			nativeQuery = true
	)
	int insertIgnore(
			@Param("id") UUID id,
			@Param("postId") UUID postId,
			@Param("userId") UUID userId,
			@Param("content") String content,
			@Param("at") Instant at
	);

	@Query("select coalesce(count(c), 0) from PostComment c where c.post.author.id = :authorId")
	long countReceivedByAuthorId(@Param("authorId") UUID authorId);
}
