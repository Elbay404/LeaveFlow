package com.example.leave_management.repository;

import com.example.leave_management.entity.Department;
import com.example.leave_management.entity.User;
import com.example.leave_management.entity.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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

    @Query("""
        SELECT u
        FROM User u
        WHERE (:departmentId IS NULL OR u.department.id = :departmentId)
        AND (:userId IS NULL OR u.id = :userId)
        AND (
            :search =''
            OR LOWER(u.firstName) LIKE LOWER(CONCAT('%', :search, '%'))
            OR LOWER(u.lastName) LIKE LOWER(CONCAT('%', :search, '%'))
            OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%'))
        )
        """)
    Page<User> findAvailabilityUsers(
            @Param("departmentId") Long departmentId,
            @Param("userId") Long userId,
            @Param("search") String search,
            Pageable pageable
    );

    Optional<User> findFirstByRole_Name(String roleName);
}