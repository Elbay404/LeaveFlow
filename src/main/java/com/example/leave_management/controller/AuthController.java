package com.example.leave_management.controller;

import com.example.leave_management.dto.auth.LoginRequest;
import com.example.leave_management.dto.auth.LoginResponse;
import com.example.leave_management.dto.auth.LoginResult;
import com.example.leave_management.dto.auth.MeResponse;
import com.example.leave_management.dto.ldap.ChangePasswordRequest;
import com.example.leave_management.dto.ldap.ResetPasswordRequest;
import com.example.leave_management.entity.User;
import com.example.leave_management.service.AuthService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseCookie;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public LoginResponse login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse response) {

        LoginResult result = authService.login(
                request.email(),
                request.password()
        );

        ResponseCookie cookie = ResponseCookie.from("jwt", result.token())
                .httpOnly(true)
                .secure(false)
                .path("/")
                .maxAge(60 * 60)
                .sameSite("Lax")
                .build();

        response.addHeader("Set-Cookie", cookie.toString());

        return new LoginResponse(
                "Login successful",
                result.mustChangePassword()
        );
    }

    @PostMapping("/logout")
    public String logout(
            @AuthenticationPrincipal User user,
            HttpServletResponse response) {

        authService.logout(user);

        ResponseCookie cookie = ResponseCookie.from("jwt", "")
                .httpOnly(true)
                .secure(false)
                .path("/")
                .maxAge(0)
                .sameSite("Lax")
                .build();

        response.addHeader("Set-Cookie", cookie.toString());

        return "Logout successful";
    }

    @GetMapping("/me")
    public MeResponse me(@AuthenticationPrincipal User user) {
        return authService.getCurrentUser(user);
    }


    @PostMapping("/change-password")
    public String changePassword(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody ChangePasswordRequest request ) {

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