package com.example.leave_management.dto.leave;

public record LeaveUserResponse(
        Long id,
        String firstName,
        String lastName,
        String email,
        String department
) {
}