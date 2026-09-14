package com.example.leave_management.repository;

import com.example.leave_management.entity.RolePermission;
import com.example.leave_management.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RolePermissionRepository
        extends JpaRepository<RolePermission, Long> {

    List<RolePermission> findByRole(Role role);
}