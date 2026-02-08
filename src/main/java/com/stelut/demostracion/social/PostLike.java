package com.stelut.demostracion.social;

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
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
		name = "post_likes",
		uniqueConstraints = @UniqueConstraint(name = "uk_post_likes_post_user", columnNames = {"post_id", "user_id"})
)
public class PostLike {

	@Id
	@Column(nullable = false, columnDefinition = "uuid")
	private UUID id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "post_id", nullable = false)
	private Post post;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "user_id", nullable = false)
	private User user;

	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	protected PostLike() {
	}

	public PostLike(UUID id, Post post, User user) {
		this.id = id;
		this.post = post;
		this.user = user;
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

	public Post getPost() {
		return post;
	}

	public User getUser() {
		return user;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}
}
