package com.example.leave_management.dto.auth;

import java.util.List;

public record MeResponse(
        Long id,
        String firstName,
        String lastName,
        String email,
        Boolean active,
        String role,
        String department,
        Integer annualLeaveBalance,
        Boolean mustChangePassword,
        List<String> permissions,
        List<String> modules
) {}