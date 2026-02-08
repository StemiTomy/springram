package com.stelut.demostracion.user;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Instant;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.dao.DataIntegrityViolationException;

@DataJpaTest
class UserRepositoryDataJpaTest {

	@Autowired
	private UserRepository userRepository;

	@Test
	void existsByEmailReturnsTrueWhenUserExists() {
		User user = new User(
				UUID.randomUUID(),
				"user@example.com",
				"hashed-password",
				UserRole.USER,
				true,
				Instant.now()
		);
		userRepository.saveAndFlush(user);

		assertThat(userRepository.existsByEmail("user@example.com")).isTrue();
	}

	@Test
	void uniqueEmailConstraintIsEnforced() {
		User first = new User(
				UUID.randomUUID(),
				"duplicate@example.com",
				"hashed-password-1",
				UserRole.USER,
				true,
				Instant.now()
		);
		User second = new User(
				UUID.randomUUID(),
				"duplicate@example.com",
				"hashed-password-2",
				UserRole.USER,
				true,
				Instant.now()
		);

		userRepository.saveAndFlush(first);

		assertThatThrownBy(() -> userRepository.saveAndFlush(second))
				.isInstanceOf(DataIntegrityViolationException.class);
	}
}
