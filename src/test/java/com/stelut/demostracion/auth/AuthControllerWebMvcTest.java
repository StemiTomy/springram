package com.stelut.demostracion.auth;

import static org.mockito.Mockito.verifyNoInteractions;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.stelut.demostracion.config.SecurityConfig;
import com.stelut.demostracion.logging.MeEndpointAuditFilter;
import com.stelut.demostracion.user.UserRepository;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(controllers = AuthController.class)
@Import({SecurityConfig.class, MeEndpointAuditFilter.class})
class AuthControllerWebMvcTest {

	@Autowired
	private MockMvc mockMvc;

	@MockitoBean
	private AuthService authService;

	@MockitoBean
	private UserRepository userRepository;

	@MockitoBean
	private JwtDecoder jwtDecoder;

	@Test
	void meWithoutTokenReturnsUnauthorized() throws Exception {
		mockMvc.perform(get("/api/v1/auth/me"))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void registerWithWeakPasswordReturnsBadRequest() throws Exception {
		String body = """
				{
				  "email": "user@example.com",
				  "password": "weakpass"
				}
				""";

		mockMvc.perform(post("/api/v1/auth/register")
						.contentType(MediaType.APPLICATION_JSON)
						.content(body))
				.andExpect(status().isBadRequest());

		verifyNoInteractions(authService);
	}
}
