package com.stelut.demostracion.logging;

import java.io.IOException;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class MeEndpointAuditFilter extends OncePerRequestFilter {

	private static final Logger log = LoggerFactory.getLogger(MeEndpointAuditFilter.class);

	@Override
	protected boolean shouldNotFilter(HttpServletRequest request) {
		return !"/api/v1/auth/me".equals(request.getRequestURI());
	}

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
			throws ServletException, IOException {
		long start = System.nanoTime();
		try {
			filterChain.doFilter(request, response);
		} finally {
			long durationMs = (System.nanoTime() - start) / 1_000_000;
			String ip = resolveClientIp(request);
			String user = resolveUser();
			String method = request.getMethod();
			String path = request.getRequestURI();
			int status = response.getStatus();

			// Etiqueta de log personalizada para auditoría de "/api/v1/auth/me"
			log.info("auth_me_audit method={} path={} status={} ip={} user={} durationMs={}",
					method, path, status, ip, user, durationMs);
		}
	}

	private String resolveUser() {
		Authentication auth = SecurityContextHolder.getContext().getAuthentication();
		if (auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken) {
			return "anonymous";
		}
		return auth.getName();
	}

	private String resolveClientIp(HttpServletRequest request) {
		String xForwardedFor = request.getHeader("X-Forwarded-For");
		if (xForwardedFor != null && !xForwardedFor.isBlank()) {
			return xForwardedFor.split(",")[0].trim();
		}
		String xRealIp = request.getHeader("X-Real-IP");
		if (xRealIp != null && !xRealIp.isBlank()) {
			return xRealIp.trim();
		}
		return request.getRemoteAddr();
	}
}
