package com.example.leave_management.repository;

import com.example.leave_management.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, Long> {

    Optional<Role> findByName(String name);

    boolean existsByName(String name);

    //for excel import
    Optional<Role> findByNameIgnoreCase(String name);


}