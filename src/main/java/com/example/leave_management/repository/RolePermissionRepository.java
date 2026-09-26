package com.example.leave_management.repository;

import com.example.leave_management.entity.RolePermission;
import com.example.leave_management.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RolePermissionRepository
        extends JpaRepository<RolePermission, Long> {

    List<RolePermission> findByRole(Role role);

    @Modifying
    @Query("DELETE FROM RolePermission rp WHERE rp.role.id = :roleId")
    void deleteByRoleId(@Param("roleId") Long roleId);
}