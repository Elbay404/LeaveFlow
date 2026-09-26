package com.example.leave_management.dto.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
        @NotBlank
        @Size(min = 8, message = "Password must contain at least 8 characters")
        String password,

        @NotBlank
        String confirmPassword
) {
}