package com.example.leave_management.dto.user;

import java.time.LocalDate;

public record UserResponse(
        Long id,
        String firstName,
        String lastName,
        String email,
        String phone,
        boolean active,
        boolean mustChangePassword,
        String roleName,
        String departmentName,
        LocalDate hireDate,
        LocalDate birthDate,
        double annualLeaveBalance,
        Long managerId,
        String managerFirstName,
        String managerLastName,
        String managerEmail
) {
}