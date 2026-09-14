package com.example.leave_management.controller;

import com.example.leave_management.dto.auth.LoginRequest;
import com.example.leave_management.dto.ldap.ChangePasswordRequest;
import com.example.leave_management.dto.ldap.ResetPasswordRequest;
import com.example.leave_management.entity.User;
import com.example.leave_management.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public String login(@Valid @RequestBody LoginRequest request) {

        return authService.login(
                request.email(),
                request.password()
        );
    }



    @PostMapping("/change-password")
    public String changePassword(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody ChangePasswordRequest request
    ) {

        authService.changePassword(
                user.getEmail(),
                request.currentPassword(),
                request.newPassword()
        );

        return "Password changed successfully";
    }

    @PostMapping("/{userId}/reset-password")
    @PreAuthorize("hasRole('HR')")
    public String resetPassword(
            @PathVariable Long userId
    ) {
        authService.resetPassword(userId);
        return "Password reset successfully";
    }

    @PostMapping("/forgot-password")
    public String forgotPassword(@RequestParam String email) {
        authService.forgotPassword(email);

        return "Password reset instructions sent";
    }

    @PostMapping("/reset-password")
    public String resetPassword(
            @Valid @RequestBody ResetPasswordRequest request
    ) {
        authService.resetPassword(request);
        return "Password reset successfully";
    }

}