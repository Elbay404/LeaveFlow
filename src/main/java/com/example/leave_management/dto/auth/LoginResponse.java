package com.example.leave_management.dto.auth;

public record LoginResponse(
        String message,
        boolean mustChangePassword
) {
}