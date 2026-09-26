package com.example.leave_management.dto.holiday;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record HolidayRequest(
        @NotNull
        LocalDate date,

        @NotBlank
        String name,

        String description
) {}