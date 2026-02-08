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
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "posts")
public class Post {

	@Id
	@Column(nullable = false, columnDefinition = "uuid")
	private UUID id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "author_id", nullable = false)
	private User author;

	@Column(name = "author_display_name", nullable = false, length = 120)
	private String authorDisplayName;

	@Column(nullable = false, columnDefinition = "text")
	private String content;

	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	protected Post() {
	}

	public Post(UUID id, User author, String authorDisplayName, String content) {
		this.id = id;
		this.author = author;
		this.authorDisplayName = authorDisplayName;
		this.content = content;
	}

	@PrePersist
	void prePersist() {
		if (this.id == null) {
			this.id = UUID.randomUUID();
		}
		Instant now = Instant.now();
		if (this.createdAt == null) {
			this.createdAt = now;
		}
		if (this.updatedAt == null) {
			this.updatedAt = now;
		}
	}

	@PreUpdate
	void preUpdate() {
		this.updatedAt = Instant.now();
	}

	public UUID getId() {
		return id;
	}

	public User getAuthor() {
		return author;
	}

	public String getAuthorDisplayName() {
		return authorDisplayName;
	}

	public String getContent() {
		return content;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}

	public void setAuthorDisplayName(String authorDisplayName) {
		this.authorDisplayName = authorDisplayName;
	}

	public void setContent(String content) {
		this.content = content;
	}
}
