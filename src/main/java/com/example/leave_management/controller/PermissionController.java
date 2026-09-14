package com.example.leave_management.controller;

import com.example.leave_management.dto.permission.PermissionRequest;
import com.example.leave_management.dto.permission.PermissionResponse;
import com.example.leave_management.service.PermissionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/permissions")
@RequiredArgsConstructor
public class PermissionController {

    private final PermissionService permissionService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PermissionResponse create(
            @Valid @RequestBody PermissionRequest request
    ) {
        return permissionService.create(request);
    }

    @GetMapping
    public List<PermissionResponse> findAll() {
        return permissionService.findAll();
    }

    @GetMapping("/{id}")
    public PermissionResponse findById(@PathVariable Long id) {
        return permissionService.findById(id);
    }

    @PutMapping("/{id}")
    public PermissionResponse update(
            @PathVariable Long id,
            @Valid @RequestBody PermissionRequest request
    ) {
        return permissionService.update(id, request);
    }

   /* @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        permissionService.delete(id);
    }*/
}