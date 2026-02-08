package com.stelut.demostracion.user;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, UUID> {
	Optional<User> findByEmail(String email);

	boolean existsByEmail(String email);

	@Query("""
			select u from User u
			where lower(u.email) like lower(concat('%', :query, '%'))
			order by u.createdAt desc
			""")
	List<User> searchSuggestionsByEmail(@Param("query") String query, Pageable pageable);

	@Query("""
			select u from User u
			where lower(u.email) like lower(concat('%', :query, '%'))
			""")
	Page<User> searchResultsByEmail(@Param("query") String query, Pageable pageable);
}
