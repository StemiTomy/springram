package com.stelut.demostracion.auth;

import java.time.Instant;
import java.util.Locale;
import java.util.UUID;

import com.stelut.demostracion.auth.dto.AuthResponse;
import com.stelut.demostracion.auth.dto.LoginRequest;
import com.stelut.demostracion.auth.dto.RefreshRequest;
import com.stelut.demostracion.auth.dto.RegisterRequest;
import com.stelut.demostracion.security.JwtService;
import com.stelut.demostracion.security.JwtService.IssuedRefreshToken;
import com.stelut.demostracion.security.JwtService.IssuedToken;
import com.stelut.demostracion.token.RefreshToken;
import com.stelut.demostracion.token.RefreshTokenRepository;
import com.stelut.demostracion.user.User;
import com.stelut.demostracion.user.UserRepository;
import com.stelut.demostracion.user.UserRole;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class AuthService {

	private final UserRepository userRepository;
	private final RefreshTokenRepository refreshTokenRepository;
	private final PasswordEncoder passwordEncoder;
	private final JwtService jwtService;
	private final JwtDecoder jwtDecoder;

	public AuthService(
			UserRepository userRepository,
			RefreshTokenRepository refreshTokenRepository,
			PasswordEncoder passwordEncoder,
			JwtService jwtService,
			JwtDecoder jwtDecoder
	) {
		this.userRepository = userRepository;
		this.refreshTokenRepository = refreshTokenRepository;
		this.passwordEncoder = passwordEncoder;
		this.jwtService = jwtService;
		this.jwtDecoder = jwtDecoder;
	}

	public AuthResponse register(RegisterRequest request) {
		String email = normalizeEmail(request.email());
		if (userRepository.existsByEmail(email)) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "email already registered");
		}

		User user = new User(
				UUID.randomUUID(),
				email,
				passwordEncoder.encode(request.password()),
				UserRole.USER,
				true,
				Instant.now()
		);

		userRepository.save(user);
		return issueTokens(user);
	}

	public AuthResponse login(LoginRequest request) {
		String email = normalizeEmail(request.email());
		User user = userRepository.findByEmail(email)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid credentials"));

		if (!user.isEnabled() || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid credentials");
		}

		return issueTokens(user);
	}

	public AuthResponse refresh(RefreshRequest request) {
		Jwt jwt = decodeRefreshToken(request.refreshToken());
		String tokenId = jwt.getId();
		if (tokenId == null) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid refresh token");
		}

		UUID refreshId = UUID.fromString(tokenId);
		RefreshToken stored = refreshTokenRepository.findById(refreshId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid refresh token"));

		Instant now = Instant.now();
		if (!stored.isActive(now)) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "refresh token expired or revoked");
		}

		User user = stored.getUser();
		if (!user.isEnabled()) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "user disabled");
		}

		stored.revoke(now);
		refreshTokenRepository.save(stored);

		return issueTokens(user);
	}

	private Jwt decodeRefreshToken(String refreshToken) {
		try {
			Jwt jwt = jwtDecoder.decode(refreshToken);
			String type = jwt.getClaimAsString("typ");
			if (!"refresh".equals(type)) {
				throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid refresh token");
			}
			return jwt;
		} catch (JwtException ex) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid refresh token");
		}
	}

	private AuthResponse issueTokens(User user) {
		IssuedToken access = jwtService.issueAccessToken(user);
		IssuedRefreshToken refresh = jwtService.issueRefreshToken(user);

		RefreshToken stored = new RefreshToken(refresh.id(), user, refresh.expiresAt());
		refreshTokenRepository.save(stored);

		return new AuthResponse(
				access.token(),
				refresh.token(),
				"Bearer",
				access.expiresAt().getEpochSecond(),
				refresh.expiresAt().getEpochSecond()
		);
	}

	private String normalizeEmail(String email) {
		return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
	}
}
