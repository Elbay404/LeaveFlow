package com.example.leave_management.controller;

import com.example.leave_management.dto.user.CurrentUserResponse;
import com.example.leave_management.dto.user.ResetPasswordRequest;
import com.example.leave_management.dto.user.UserRequest;
import com.example.leave_management.dto.user.UserResponse;
import com.example.leave_management.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import org.springframework.data.domain.Pageable;


@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse create(
            @Valid @RequestBody UserRequest request
    ) {
        return userService.create(request);
    }

    @GetMapping
    public Page<UserResponse> findAll(
            @PageableDefault(size = 10) Pageable pageable) {

        return userService.findAll(pageable);
    }

    @GetMapping("/me")
    public CurrentUserResponse getCurrentUser() {
        return userService.getCurrentUser();
    }

    @GetMapping("/{id}")
    public UserResponse findById(
            @PathVariable Long id
    ) {
        return userService.findById(id);
    }

    @PatchMapping("/{id}")
    public UserResponse update(
            @PathVariable Long id,
            @Valid @RequestBody UserRequest request
    ) {
        return userService.update(id, request);
    }

    @PatchMapping("/{id}/reset-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resetPassword(
            @PathVariable Long id,
            @Valid @RequestBody ResetPasswordRequest request
    ) {
        userService.resetPassword(
                id,
                request.password(),
                request.confirmPassword()
        );
    }

}