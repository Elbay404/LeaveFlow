package com.example.leave_management.dto.leave;

import com.example.leave_management.enums.LeaveStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record LeaveResponse(

        Long id,

        Long userId,

        String leaveType,

        LocalDate startDate,

        LocalDate endDate,

        Integer duration,

        String reason,

        LocalDateTime requestedAt,
        LocalDateTime updatedAt,

        LeaveStatus status,

        Long approvedById,

        LocalDateTime approvedAt,

        String rejectionReason,

        String documentName
) {}