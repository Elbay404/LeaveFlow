package com.example.leave_management.audit;

import java.time.LocalDateTime;

public record AuditResponse(
        String entityType,
        Long entityId,
        String action,
        String username,
        LocalDateTime timestamp,
        Number revision
) {
}