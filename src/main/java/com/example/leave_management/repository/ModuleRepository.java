package com.example.leave_management.repository;

import com.example.leave_management.entity.Module;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ModuleRepository extends JpaRepository<Module, Long> {

    Optional<Module> findByName(String name);

    boolean existsByName(String name);
}