package com.example.leave_management.dto.leave;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;

public record LeaveRequest(

        @NotNull(message = "Leave type is required")
        Long leaveTypeId,

        @NotNull(message = "Start date is required")
        LocalDate startDate,

        @NotNull(message = "End date is required")
        LocalDate endDate,

        @Size(max = 1000)
        String reason,

        MultipartFile document
) {}