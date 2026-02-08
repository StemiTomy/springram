package com.stelut.demostracion.config;

import java.nio.charset.StandardCharsets;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;

@Configuration
@EnableConfigurationProperties(JwtProperties.class)
public class JwtConfig {

	@Bean
	public SecretKey jwtSecretKey(JwtProperties properties) {
		if (properties.secret() == null || properties.secret().isBlank()) {
			throw new IllegalStateException("JWT secret must be configured (app.jwt.secret)");
		}
		byte[] keyBytes = properties.secret().getBytes(StandardCharsets.UTF_8);
		if (keyBytes.length < 32) {
			throw new IllegalStateException("JWT secret must be at least 32 bytes");
		}
		return new SecretKeySpec(keyBytes, "HmacSHA256");
	}

	@Bean
	public JwtEncoder jwtEncoder(SecretKey secretKey) {
		return NimbusJwtEncoder.withSecretKey(secretKey).build();
	}

	@Bean
	public JwtDecoder jwtDecoder(SecretKey secretKey) {
		return NimbusJwtDecoder.withSecretKey(secretKey)
				.macAlgorithm(MacAlgorithm.HS256)
				.build();
	}
}
