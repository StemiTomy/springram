package com.stelut.demostracion.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

// DTO para la solicitud de registro
//** 
// */
@Schema(example = "user@dominio.com", description = "Correo del usuario")
public record RegisterRequest(
		@Email @NotBlank String email,
		@NotBlank
		@Size(min = 8, max = 72)
		@Pattern(
				regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z\\d]).+$",
				message = "password must contain uppercase, lowercase, digit and symbol"
		)
		String password
) {
}
