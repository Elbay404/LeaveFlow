package com.example.leave_management.audit;

import java.time.LocalDateTime;
import java.util.List;

public record AuditDetailResponse(
        String entityType,
        Long entityId,
        String action,
        String username,
        LocalDateTime timestamp,
        Number revision,
        List<AuditChange> changes
) {
}