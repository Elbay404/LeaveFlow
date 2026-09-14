package com.example.leave_management.dto.user;


import java.time.LocalDate;

public record UserRequest(
        String firstName,
        String lastName,
        String phone,
        Long roleId,
        Long departmentId,
        LocalDate hireDate,
        Boolean active
) {}