package com.example.leave_management.dto.user;

public record UserImportError(
        int row,
        String message
) {
}