package com.example.leave_management.controller;

import com.example.leave_management.dto.role.RoleRequest;
import com.example.leave_management.dto.role.RoleResponse;
import com.example.leave_management.service.RoleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/roles")
@RequiredArgsConstructor
public class RoleController {

    private final RoleService roleService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RoleResponse create(
            @Valid @RequestBody RoleRequest request
    ) {
        return roleService.create(request);
    }

    @GetMapping
    public List<RoleResponse> findAll() {
        return roleService.findAll();
    }

    @GetMapping("/{id}")
    public RoleResponse findById(@PathVariable Long id) {
        return roleService.findById(id);
    }

    @PutMapping("/{id}")
    public RoleResponse update(
            @PathVariable Long id,
            @Valid @RequestBody RoleRequest request
    ) {
        return roleService.update(id, request);
    }


}