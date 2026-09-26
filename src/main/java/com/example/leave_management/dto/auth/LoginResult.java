package com.example.leave_management.dto.auth;

public record LoginResult(
        String token,
        boolean mustChangePassword
) {
}