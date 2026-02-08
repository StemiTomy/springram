package com.stelut.demostracion.social.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreatePostRequest(
		@NotBlank @Size(max = 4000) String content,
		@Size(max = 120) String authorDisplayName
) {
}
