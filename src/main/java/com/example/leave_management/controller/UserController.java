package com.example.leave_management.controller;

import com.example.leave_management.dto.user.*;
import com.example.leave_management.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;


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
            @RequestParam(required = false, defaultValue = "") String search,
            @PageableDefault(size = 8) Pageable pageable
    ) {
        return userService.findAll(search, pageable);
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

    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public UserImportResponse importUsers(
            @RequestParam("file") MultipartFile file) {
        return userService.importUsers(file);
    }

}