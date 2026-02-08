package com.stelut.demostracion.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record LanguagePreferenceRequest(
		@NotBlank
		@Pattern(regexp = "(?i)^(es|en)$", message = "language must be 'es' or 'en'")
		String language
) {
}
