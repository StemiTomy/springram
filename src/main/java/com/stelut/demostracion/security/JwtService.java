package com.stelut.demostracion.security;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.stelut.demostracion.config.JwtProperties;
import com.stelut.demostracion.user.User;

import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

	private final JwtEncoder encoder;
	private final JwtProperties properties;

	public JwtService(JwtEncoder encoder, JwtProperties properties) {
		this.encoder = encoder;
		this.properties = properties;
	}

	public IssuedToken issueAccessToken(User user) {
		Instant now = Instant.now();
		Instant expiresAt = now.plus(properties.accessTokenTtl());

		JwtClaimsSet claims = JwtClaimsSet.builder()
				.issuer(properties.issuer())
				.subject(user.getId().toString())
				.issuedAt(now)
				.expiresAt(expiresAt)
				.claim("email", user.getEmail())
				.claim("roles", List.of(user.getRole().name()))
				.build();

		String token = encoder.encode(JwtEncoderParameters.from(claims)).getTokenValue();
		return new IssuedToken(token, expiresAt);
	}

	public IssuedRefreshToken issueRefreshToken(User user) {
		Instant now = Instant.now();
		Instant expiresAt = now.plus(properties.refreshTokenTtl());
		UUID tokenId = UUID.randomUUID();

		JwtClaimsSet claims = JwtClaimsSet.builder()
				.issuer(properties.issuer())
				.subject(user.getId().toString())
				.id(tokenId.toString())
				.issuedAt(now)
				.expiresAt(expiresAt)
				.claim("typ", "refresh")
				.build();

		String token = encoder.encode(JwtEncoderParameters.from(claims)).getTokenValue();
		return new IssuedRefreshToken(token, tokenId, expiresAt);
	}

	public record IssuedToken(String token, Instant expiresAt) {
	}

	public record IssuedRefreshToken(String token, UUID id, Instant expiresAt) {
	}
}
