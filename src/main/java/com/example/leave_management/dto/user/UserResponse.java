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
       // Long roleId,
        String roleName,
       // Long departmentId,
        String departmentName,
        LocalDate hireDate,
        Integer annualLeaveBalance

) {
}