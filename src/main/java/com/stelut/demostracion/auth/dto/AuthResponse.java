package com.stelut.demostracion.auth.dto;

public record AuthResponse(
		String accessToken,
		String refreshToken,
		String tokenType,
		long accessTokenExpiresAt,
		long refreshTokenExpiresAt
) {
}
