package com.example.leave_management.controller;

import com.example.leave_management.dto.ldap.LdapMigrationRequest;
import com.example.leave_management.service.LdapMigrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ldap")
@RequiredArgsConstructor
public class LdapMigrationController {

    private final LdapMigrationService ldapMigrationService;

    @PostMapping("/migrate/{userId}")
    public String migrate(
            @PathVariable Long userId,
            @RequestBody LdapMigrationRequest request
    ) {

        ldapMigrationService.migrateUser(
                userId,
                request.password()
        );

        return "User migrated to LDAP successfully";
    }
}