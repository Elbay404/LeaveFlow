package com.example.leave_management.audit;

import com.example.leave_management.entity.User;
import com.example.leave_management.security.AuthorizationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/audit")
@RequiredArgsConstructor
public class AuditController {

    private final AuditService auditService;
    private final AuthorizationService authorizationService;

    @GetMapping("/{entityType}/{entityId}")
    public ResponseEntity<List<AuditDetailResponse>> getEntityHistory(
            @PathVariable String entityType,
            @PathVariable Long entityId
    ) {

        User currentUser = getCurrentUser();

        if (!authorizationService.hasPermission(
                currentUser,
                "AUDIT_READ"
        )) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        try {
            return ResponseEntity.ok(
                    auditService.getEntityHistory(
                            entityType,
                            entityId
                    )
            );
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping
    public ResponseEntity<List<AuditResponse>> getAllAuditLogs() {

        User currentUser = getCurrentUser();

        if (!authorizationService.hasPermission(
                currentUser,
                "AUDIT_READ"
        )) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        return ResponseEntity.ok(
                auditService.getAllAuditLogs()
        );
    }

    private User getCurrentUser() {
        return (User) org.springframework.security.core.context.SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getPrincipal();
    }
}