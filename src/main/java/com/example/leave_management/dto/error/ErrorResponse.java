package com.example.leave_management.dto.error;

public record ErrorResponse(
        int status,
        String message,
        String timestamp
) {
}