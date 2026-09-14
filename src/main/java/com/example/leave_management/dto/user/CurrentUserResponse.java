package com.example.leave_management.dto.user;

import java.time.LocalDate;

public record CurrentUserResponse(
        Long id,
        String firstName,
        String lastName,
        String email,
        String phone,
        boolean active,
        boolean mustChangePassword,
        String roleName,
        String departmentName,
        Long managerId,
        String managerFirstName,
        String managerLastName,
        String managerEmail,
        LocalDate hireDate,
        Integer annualLeaveBalance
) {
}