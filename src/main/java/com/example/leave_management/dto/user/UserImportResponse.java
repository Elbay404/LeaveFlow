package com.example.leave_management.dto.user;

import java.util.List;

public record UserImportResponse(
        int totalRows,
        int successCount,
        int failedCount,
        List<UserImportError> errors
) {
}