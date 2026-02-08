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
		name = "post_views",
		uniqueConstraints = @UniqueConstraint(name = "uk_post_views_post_user", columnNames = {"post_id", "user_id"})
)
public class PostView {

	@Id
	@Column(nullable = false, columnDefinition = "uuid")
	private UUID id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "post_id", nullable = false)
	private Post post;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "user_id", nullable = false)
	private User user;

	@Column(name = "first_viewed_at", nullable = false, updatable = false)
	private Instant firstViewedAt;

	@Column(name = "last_viewed_at", nullable = false)
	private Instant lastViewedAt;

	@Column(name = "view_count", nullable = false)
	private long viewCount;

	protected PostView() {
	}

	public PostView(UUID id, Post post, User user) {
		this.id = id;
		this.post = post;
		this.user = user;
	}

	@PrePersist
	void prePersist() {
		if (this.id == null) {
			this.id = UUID.randomUUID();
		}
		Instant now = Instant.now();
		if (this.firstViewedAt == null) {
			this.firstViewedAt = now;
		}
		if (this.lastViewedAt == null) {
			this.lastViewedAt = now;
		}
		if (this.viewCount == 0) {
			this.viewCount = 1;
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

	public Instant getFirstViewedAt() {
		return firstViewedAt;
	}

	public Instant getLastViewedAt() {
		return lastViewedAt;
	}

	public long getViewCount() {
		return viewCount;
	}

	public void registerView() {
		this.lastViewedAt = Instant.now();
		this.viewCount++;
	}
}
