package com.stelut.demostracion.auth.dto;

import java.util.UUID;

public record UserResponse(
		UUID id,
		String email,
		String role,
		String preferredLanguage
) {
}
