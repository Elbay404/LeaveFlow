package com.example.leave_management.service;

import com.example.leave_management.dto.ldap.ResetPasswordRequest;
import com.example.leave_management.entity.PasswordResetToken;
import com.example.leave_management.entity.User;
import com.example.leave_management.exception.InvalidCredentialsException;
import com.example.leave_management.exception.ResourceNotFoundException;
import com.example.leave_management.repository.PasswordResetTokenRepository;
import com.example.leave_management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final LdapService ldapService;

    private final PasswordService passwordService;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    private final PasswordResetTokenRepository passwordResetTokenRepository;


    public String login(String email, String password) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new InvalidCredentialsException("Invalid email or password"));

        if (!user.isActive()) {
            throw new AccessDeniedException("Account is disabled");
        }

      /*  if (!passwordEn  coder.matches(password, user.getPassword())) {
            throw new InvalidCredentialsException("Invalid email or password");
        }*/

        String username = user.getLdapUid();


        if (!ldapService.authenticate(username, password)) {
            throw new InvalidCredentialsException(
                    "Invalid email or password"
            );
        }

        return jwtService.generateToken(
                user.getEmail(),
                user.getRole().getName(),
                user.getTokenVersion()
        );
    }


    public void changePassword(
            String email,
            String currentPassword,
            String newPassword
    ) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User not found"));

        if (!user.isActive()) {
            throw new AccessDeniedException("Account is disabled");
        }

        if (!ldapService.authenticate(user.getLdapUid(), currentPassword)) {
            throw new InvalidCredentialsException("Current password is incorrect");
        }

        try {
            ldapService.changePassword(
                    user.getLdapUid(),
                    newPassword
            );
        } catch (Exception e) {
            throw new RuntimeException("Failed to change password");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setMustChangePassword(false);
        user.setTokenVersion(user.getTokenVersion() + 1);
        userRepository.save(user);
    }



    public PasswordResetToken validateResetToken(String token) {
        String tokenHash = hashResetToken(token);

        PasswordResetToken resetToken =
                passwordResetTokenRepository.findByTokenHash(tokenHash)
                        .orElseThrow(() ->
                                new InvalidCredentialsException("Invalid or expired reset token"));

        if (resetToken.isUsed()) {
            throw new InvalidCredentialsException("Invalid or expired reset token");
        }

        if (resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new InvalidCredentialsException("Invalid or expired reset token");
        }

        return resetToken;
    }

    public void resetPassword(ResetPasswordRequest request) {

        PasswordResetToken resetToken =
                validateResetToken(request.token());

        User user = resetToken.getUser();

        try {
            ldapService.changePassword(
                    user.getLdapUid(),
                    request.newPassword()
            );
        } catch (Exception exception) {
            throw new RuntimeException("Failed to reset password");
        }

        user.setPassword(
                passwordEncoder.encode(request.newPassword())
        );

        user.setMustChangePassword(false);
        user.setTokenVersion(user.getTokenVersion() + 1);

        userRepository.save(user);

        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);
    }


    public void resetPassword(Long userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User not found"));

        if (!user.isActive()) {
            throw new AccessDeniedException("Account is disabled");
        }

        String temporaryPassword =
                passwordService.generateTemporaryPassword();

        try {
            ldapService.changePassword(
                    user.getLdapUid(),
                    temporaryPassword
            );
        } catch (Exception e) {
            throw new RuntimeException("Failed to reset password");
        }

        user.setPassword(passwordEncoder.encode(temporaryPassword));
        user.setMustChangePassword(true);
        user.setTokenVersion(user.getTokenVersion() + 1);
        userRepository.save(user);

        emailService.sendPasswordResetEmail(
                user.getEmail(),
                user.getFirstName(),
                temporaryPassword
        );

    }


    public void forgotPassword(String email) {
        Optional<User> optionalUser = userRepository.findByEmail(email);

        if (optionalUser.isEmpty()) {
            return;
        }

        User user = optionalUser.get();

        if (!user.isActive()) {
            return;
        }

        String resetToken = generateResetToken();
        String tokenHash = hashResetToken(resetToken);

        PasswordResetToken passwordResetToken = PasswordResetToken.builder()
                .user(user)
                .tokenHash(tokenHash)
                .expiresAt(LocalDateTime.now().plusMinutes(15))
                .used(false)
                .build();

        passwordResetTokenRepository.save(passwordResetToken);

        emailService.sendPasswordResetLink(
                user.getEmail(),
                user.getFirstName(),
                resetToken
        );

    }



    private String generateResetToken() {
        byte[] randomBytes = new byte[32];
        new SecureRandom().nextBytes(randomBytes);

        return Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(randomBytes);
    }

    private String hashResetToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(
                    token.getBytes(StandardCharsets.UTF_8)
            );

            return Base64.getEncoder().encodeToString(hash);

        } catch (NoSuchAlgorithmException exception) {
            throw new RuntimeException("Failed to hash reset token");
        }
    }

}