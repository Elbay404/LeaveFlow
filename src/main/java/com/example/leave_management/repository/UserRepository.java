package com.example.leave_management.repository;

import com.example.leave_management.entity.Department;
import com.example.leave_management.entity.User;
import com.example.leave_management.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);
    boolean existsByRole(Role role);

    Optional<User> findByDepartmentAndRole_Name(
            Department department,
            String roleName
    );

    boolean existsByDepartmentAndRole_Name(
            Department department,
            String roleName
    );
}