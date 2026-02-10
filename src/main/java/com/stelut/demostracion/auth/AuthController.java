package com.stelut.demostracion.auth;

import java.util.UUID;

import com.stelut.demostracion.auth.dto.AuthResponse;
import com.stelut.demostracion.auth.dto.LanguagePreferenceRequest;
import com.stelut.demostracion.auth.dto.LanguagePreferenceResponse;
import com.stelut.demostracion.auth.dto.LoginRequest;
import com.stelut.demostracion.auth.dto.RefreshRequest;
import com.stelut.demostracion.auth.dto.RegisterRequest;
import com.stelut.demostracion.auth.dto.UserResponse;
import com.stelut.demostracion.user.User;
import com.stelut.demostracion.user.UserRepository;
import com.stelut.demostracion.user.mapper.UserMapper;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

	private final AuthService authService;
	private final UserRepository userRepository;
	private final UserMapper userMapper; // mapstruct se usa aqui

	public AuthController(AuthService authService, UserRepository userRepository, UserMapper userMapper) {
		this.authService = authService;
		this.userRepository = userRepository;
		this.userMapper = userMapper;
	}

	@PostMapping("/register")
	@ResponseStatus(HttpStatus.CREATED)
	public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
		return authService.register(request);
	}

	@PostMapping("/login")
	public AuthResponse login(@Valid @RequestBody LoginRequest request) {
		return authService.login(request);
	}

	@PostMapping("/refresh")
	public AuthResponse refresh(@Valid @RequestBody RefreshRequest request) {
		return authService.refresh(request);
	}

	@GetMapping("/me")
	public UserResponse me(@AuthenticationPrincipal Jwt jwt) {
		UUID userId = extractUserId(jwt);
		User user = userRepository.findById(userId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "user not found"));

		return userMapper.toUserResponse(user);
	}

	@GetMapping("/preferences/language")
	public LanguagePreferenceResponse getLanguagePreference(@AuthenticationPrincipal Jwt jwt) {
		UUID userId = extractUserId(jwt);
		String language = authService.getPreferredLanguage(userId);
		return new LanguagePreferenceResponse(language);
	}

	@PutMapping("/preferences/language")
	public LanguagePreferenceResponse updateLanguagePreference(
			@AuthenticationPrincipal Jwt jwt,
			@Valid @RequestBody LanguagePreferenceRequest request
	) {
		UUID userId = extractUserId(jwt);
		String language = authService.updatePreferredLanguage(userId, request.language());
		return new LanguagePreferenceResponse(language);
	}

	private UUID extractUserId(Jwt jwt) {
		if (jwt == null) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid token");
		}
		try {
			return UUID.fromString(jwt.getSubject());
		} catch (IllegalArgumentException ex) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid token");
		}
	}
}
