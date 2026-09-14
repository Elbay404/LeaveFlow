package com.example.leave_management.security;

import com.example.leave_management.entity.User;
import com.example.leave_management.entity.RolePermission;
import com.example.leave_management.repository.RolePermissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthorizationService {

    private final RolePermissionRepository rolePermissionRepository;


    public boolean hasPermission(User user, String permissionName) {

        return rolePermissionRepository.findByRole(user.getRole())
                .stream()
                .map(RolePermission::getPermission)
                .anyMatch(permission ->
                        permission.getName().equals(permissionName)
                );
    }


}