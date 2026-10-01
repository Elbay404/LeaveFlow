package com.example.leave_management.dto.leave_type;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record LeaveTypeRequest(

        @NotBlank
        String code,

        @NotBlank
        String name,

        String description,

        @NotNull
        Boolean consumesBalance,

        @NotNull
        Boolean requiresDocument,

        @Min(1)
        Integer maxDays
) {
}