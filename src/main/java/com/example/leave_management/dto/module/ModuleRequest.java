package com.example.leave_management.dto.module;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ModuleRequest(

        @NotBlank(message = "Module name is required")
        @Size(max = 255)
        String name,

        @Size(max = 500)
        String description
) {
}