package com.stelut.demostracion.social;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PostRepository extends JpaRepository<Post, UUID> {
	List<Post> findByAuthorIdOrderByCreatedAtDesc(UUID authorId);

	long countByAuthorId(UUID authorId);

	@Query("""
			select p from Post p
			where lower(p.content) like lower(concat('%', :query, '%'))
			   or lower(p.authorDisplayName) like lower(concat('%', :query, '%'))
			order by p.createdAt desc
			""")
	List<Post> searchSuggestions(@Param("query") String query, Pageable pageable);

	@Query("""
			select p from Post p
			where lower(p.content) like lower(concat('%', :query, '%'))
			   or lower(p.authorDisplayName) like lower(concat('%', :query, '%'))
			""")
	Page<Post> searchResults(@Param("query") String query, Pageable pageable);
}
