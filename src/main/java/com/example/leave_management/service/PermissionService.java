package com.example.leave_management.service;

import com.example.leave_management.dto.permission.PermissionRequest;
import com.example.leave_management.dto.permission.PermissionResponse;
import com.example.leave_management.entity.Module;
import com.example.leave_management.entity.Permission;
import com.example.leave_management.exception.DuplicateResourceException;
import com.example.leave_management.exception.ResourceNotFoundException;
import com.example.leave_management.repository.ModuleRepository;
import com.example.leave_management.repository.PermissionRepository;
import com.example.leave_management.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PermissionService {

    private final PermissionRepository permissionRepository;
    private final ModuleRepository moduleRepository;

    public PermissionResponse create(PermissionRequest request) {
        checkHr();

        if (permissionRepository.existsByName(request.name())) {
            throw new DuplicateResourceException("Permission name already exists");
        }

        Module module = moduleRepository.findById(request.moduleId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Module not found"));

        Permission permission = Permission.builder()
                .name(request.name())
                .description(request.description())
                .module(module)
                .build();

        Permission savedPermission = permissionRepository.save(permission);

        return toResponse(savedPermission);
    }

    public List<PermissionResponse> findAll() {
        checkHr();
        return permissionRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public PermissionResponse findById(Long id) {
        checkHr();

        Permission permission = permissionRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Permission not found"));

        return toResponse(permission);
    }

    public PermissionResponse update(Long id, PermissionRequest request) {
        checkHr();

        Permission permission = permissionRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Permission not found"));

        if (!permission.getName().equals(request.name())
                && permissionRepository.existsByName(request.name())) {
            throw new DuplicateResourceException("Permission name already exists");
        }

        Module module = moduleRepository.findById(request.moduleId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Module not found"));

        permission.setName(request.name());
        permission.setDescription(request.description());
        permission.setModule(module);

        Permission updatedPermission = permissionRepository.save(permission);

        return toResponse(updatedPermission);
    }

  /*  public void delete(Long id) {

        checkHr();
        Permission permission = permissionRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Permission not found"));

        permissionRepository.delete(permission);
    }*/

    private void checkHr() {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        User currentUser =
                (User) authentication.getPrincipal();

        if (!currentUser.getRole().getName().equals("HR")) {
            throw new AccessDeniedException(
                    "Only HR can manage permissions");
        }
    }

    private PermissionResponse toResponse(Permission permission) {
        return new PermissionResponse(
                permission.getId(),
                permission.getName(),
                permission.getDescription(),
                permission.getModule().getId(),
                permission.getModule().getName()
        );
    }



}