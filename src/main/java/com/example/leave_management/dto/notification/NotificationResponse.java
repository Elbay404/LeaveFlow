package com.example.leave_management.dto.notification;

import com.example.leave_management.enums.NotificationType;

import java.time.LocalDateTime;

public record NotificationResponse(
        Long id,
        NotificationType type,
        String title,
        String message,
        String entityType,
        Long entityId,
        boolean read,
        LocalDateTime createdAt,
        LocalDateTime readAt
) {}