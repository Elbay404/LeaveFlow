package com.example.leave_management.service;

import com.example.leave_management.dto.permission.PermissionResponse;
import com.example.leave_management.dto.role.RoleRequest;
import com.example.leave_management.dto.role.RoleResponse;
import com.example.leave_management.entity.Permission;
import com.example.leave_management.entity.Role;
import com.example.leave_management.entity.RolePermission;
import com.example.leave_management.entity.User;
import com.example.leave_management.exception.DuplicateResourceException;
import com.example.leave_management.exception.ResourceNotFoundException;
import com.example.leave_management.repository.PermissionRepository;
import com.example.leave_management.repository.RolePermissionRepository;
import com.example.leave_management.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RoleService {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final RolePermissionRepository rolePermissionRepository;

    @Transactional
    public RoleResponse create(RoleRequest request) {

        checkHr();

        if (roleRepository.existsByName(request.name())) {
            throw new DuplicateResourceException("Role name already exists");
        }

        Role role = Role.builder()
                .name(request.name())
                .description(request.description())
                .build();

        Role savedRole = roleRepository.save(role);

        if (request.permissionIds() != null) {

            for (Long permissionId : new HashSet<>(request.permissionIds())) {

                Permission permission = permissionRepository.findById(permissionId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Permission not found: " + permissionId
                                ));

                RolePermission rolePermission = RolePermission.builder()
                        .role(savedRole)
                        .permission(permission)
                        .build();

                rolePermissionRepository.save(rolePermission);
            }
        }

        return toResponse(savedRole);
    }

    public List<RoleResponse> findAll() {

        checkHr();

        return roleRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public RoleResponse findById(Long id) {

        checkHr();

        Role role = roleRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Role not found"));

        return toResponse(role);
    }

    @Transactional
    public RoleResponse update(Long id, RoleRequest request) {

        checkHr();

        Role role = roleRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Role not found"));

        if (!role.getName().equals(request.name())
                && roleRepository.existsByName(request.name())) {
            throw new DuplicateResourceException("Role name already exists");
        }

        role.setName(request.name());
        role.setDescription(request.description());

        List<RolePermission> oldPermissions =
                rolePermissionRepository.findByRole(role);

        rolePermissionRepository.deleteAll(oldPermissions);

        if (request.permissionIds() != null) {

            for (Long permissionId : new HashSet<>(request.permissionIds())) {

                Permission permission = permissionRepository.findById(permissionId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Permission not found: " + permissionId
                                ));

                RolePermission rolePermission = RolePermission.builder()
                        .role(role)
                        .permission(permission)
                        .build();

                rolePermissionRepository.save(rolePermission);
            }
        }

        Role updatedRole = roleRepository.save(role);

        return toResponse(updatedRole);
    }

    public List<PermissionResponse> getPermissions(Long roleId) {

        checkHr();

        Role role = roleRepository.findById(roleId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Role not found"));

        return rolePermissionRepository.findByRole(role)
                .stream()
                .map(rolePermission -> {
                    Permission permission = rolePermission.getPermission();

                    return new PermissionResponse(
                            permission.getId(),
                            permission.getName(),
                            permission.getDescription(),
                            permission.getModule().getId(),
                            permission.getModule().getName()
                    );
                })
                .toList();
    }

    @Transactional
    public List<PermissionResponse> updatePermissions(
            Long roleId,
            List<Long> permissionIds
    ) {

        checkHr();

        Role role = roleRepository.findById(roleId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Role not found"));

        rolePermissionRepository.deleteByRoleId(roleId);
        rolePermissionRepository.flush();

        if (permissionIds != null) {

            for (Long permissionId : new HashSet<>(permissionIds)) {

                Permission permission = permissionRepository.findById(permissionId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Permission not found: " + permissionId
                                ));

                RolePermission rolePermission = RolePermission.builder()
                        .role(role)
                        .permission(permission)
                        .build();

                rolePermissionRepository.save(rolePermission);
            }
        }

        return getPermissions(roleId);
    }

    private RoleResponse toResponse(Role role) {

        List<PermissionResponse> permissions =
                rolePermissionRepository.findByRole(role)
                        .stream()
                        .map(rolePermission -> {
                            Permission permission = rolePermission.getPermission();

                            return new PermissionResponse(
                                    permission.getId(),
                                    permission.getName(),
                                    permission.getDescription(),
                                    permission.getModule().getId(),
                                    permission.getModule().getName()
                            );
                        })
                        .toList();

        return new RoleResponse(
                role.getId(),
                role.getName(),
                role.getDescription(),
                permissions
        );
    }

    private void checkHr() {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        User currentUser = (User) authentication.getPrincipal();

        if (!currentUser.getRole().getName().equals("HR")) {
            throw new AccessDeniedException(
                    "Only HR can manage roles");
        }
    }
}