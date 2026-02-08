package com.stelut.demostracion.social;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PostLikeRepository extends JpaRepository<PostLike, UUID> {
	boolean existsByPostIdAndUserId(UUID postId, UUID userId);

	long countByPostId(UUID postId);

	Optional<PostLike> findByPostIdAndUserId(UUID postId, UUID userId);

	@Query("select p.post.id from PostLike p where p.user.id = :userId and p.post.id in :postIds")
	List<UUID> findLikedPostIdsByUserAndPostIds(@Param("userId") UUID userId, @Param("postIds") Collection<UUID> postIds);

	@Modifying
	@Query(
			value = """
					INSERT INTO post_likes (id, post_id, user_id, created_at)
					VALUES (:id, :postId, :userId, :createdAt)
					ON CONFLICT (post_id, user_id) DO NOTHING
					""",
			nativeQuery = true
	)
	int insertIgnore(
			@Param("id") UUID id,
			@Param("postId") UUID postId,
			@Param("userId") UUID userId,
			@Param("createdAt") Instant createdAt
	);

	@Modifying
	@Query(
			value = """
					DELETE FROM post_likes
					WHERE post_id = :postId AND user_id = :userId
					""",
			nativeQuery = true
	)
	int deleteByPostIdAndUserId(@Param("postId") UUID postId, @Param("userId") UUID userId);

	@Query("select coalesce(count(l), 0) from PostLike l where l.post.author.id = :authorId")
	long countReceivedByAuthorId(@Param("authorId") UUID authorId);
}
