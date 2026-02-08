package com.stelut.demostracion.user;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "users")
public class User {

	@Id
	@Column(nullable = false, columnDefinition = "uuid")
	private UUID id;

	@Column(nullable = false, unique = true, length = 320)
	private String email;

	@Column(name = "password_hash", nullable = false)
	private String passwordHash;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private UserRole role;

	@Column(nullable = false)
	private boolean enabled = true;

	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	protected User() {
	}

	public User(UUID id, String email, String passwordHash, UserRole role, boolean enabled, Instant createdAt) {
		this.id = id;
		this.email = email;
		this.passwordHash = passwordHash;
		this.role = role;
		this.enabled = enabled;
		this.createdAt = createdAt;
	}

	@PrePersist
	void prePersist() {
		if (this.id == null) {
			this.id = UUID.randomUUID();
		}
		if (this.createdAt == null) {
			this.createdAt = Instant.now();
		}
	}

	public UUID getId() {
		return id;
	}

	public String getEmail() {
		return email;
	}

	public String getPasswordHash() {
		return passwordHash;
	}

	public UserRole getRole() {
		return role;
	}

	public boolean isEnabled() {
		return enabled;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public void setPasswordHash(String passwordHash) {
		this.passwordHash = passwordHash;
	}

	public void setRole(UserRole role) {
		this.role = role;
	}

	public void setEnabled(boolean enabled) {
		this.enabled = enabled;
	}
}
