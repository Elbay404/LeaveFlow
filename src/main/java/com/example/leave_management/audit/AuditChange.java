package com.example.leave_management.audit;

public record AuditChange(
        String field,
        String oldValue,
        String newValue
) {
}