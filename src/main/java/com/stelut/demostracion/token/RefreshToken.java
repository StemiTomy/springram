package com.stelut.demostracion.token;

import java.time.Instant;
import java.util.UUID;

import com.stelut.demostracion.user.User;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "refresh_tokens")
public class RefreshToken {

	@Id
	@Column(nullable = false, columnDefinition = "uuid")
	private UUID id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "user_id", nullable = false)
	private User user;

	@Column(name = "expires_at", nullable = false)
	private Instant expiresAt;

	@Column(name = "revoked_at")
	private Instant revokedAt;

	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	protected RefreshToken() {
	}

	public RefreshToken(UUID id, User user, Instant expiresAt) {
		this.id = id;
		this.user = user;
		this.expiresAt = expiresAt;
	}

	@PrePersist
	void prePersist() {
		if (this.createdAt == null) {
			this.createdAt = Instant.now();
		}
	}

	public UUID getId() {
		return id;
	}

	public User getUser() {
		return user;
	}

	public Instant getExpiresAt() {
		return expiresAt;
	}

	public Instant getRevokedAt() {
		return revokedAt;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public boolean isActive(Instant now) {
		return revokedAt == null && expiresAt.isAfter(now);
	}

	public void revoke(Instant when) {
		this.revokedAt = when;
	}
}
