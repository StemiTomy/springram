package com.stelut.demostracion.auth.state;

import java.util.Locale;
import java.util.UUID;

import org.springframework.beans.factory.config.ConfigurableBeanFactory;
import org.springframework.context.annotation.Scope;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
@Scope(ConfigurableBeanFactory.SCOPE_PROTOTYPE)
// # Bean prototype: estado mutable por operacion/usuario para evitar mezcla entre requests.
public class UserLanguagePreferenceState {

	private UUID userId;
	private String language;

	public void initialize(UUID userId, String currentLanguage) {
		this.userId = userId;
		this.language = normalize(currentLanguage);
	}

	public void apply(String requestedLanguage) {
		requireInitialized();
		this.language = normalize(requestedLanguage);
	}

	public UUID userId() {
		requireInitialized();
		return userId;
	}

	public String language() {
		requireInitialized();
		return language;
	}

	private void requireInitialized() {
		if (userId == null) {
			throw new IllegalStateException("state bean not initialized");
		}
	}

	private String normalize(String value) {
		String normalized = value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
		if (!"es".equals(normalized) && !"en".equals(normalized)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "language must be 'es' or 'en'");
		}
		return normalized;
	}
}
