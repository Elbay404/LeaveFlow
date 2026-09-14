package com.example.leave_management.service;

import com.example.leave_management.entity.User;
import com.example.leave_management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class LdapMigrationService {

    private final UserRepository userRepository;
    private final LdapService ldapService;

    public void migrateUser(Long userId, String temporaryPassword) {

        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        ldapService.createUser(
                user.getLdapUid(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                temporaryPassword
        );
    }
}