package com.example.leave_management.service;

import com.example.leave_management.dto.department.DepartmentRequest;
import com.example.leave_management.dto.department.DepartmentResponse;
import com.example.leave_management.entity.Department;
import com.example.leave_management.entity.User;
import com.example.leave_management.exception.DuplicateResourceException;
import com.example.leave_management.exception.ResourceNotFoundException;
import com.example.leave_management.repository.DepartmentRepository;
import com.example.leave_management.security.AuthorizationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DepartmentService {

    private final DepartmentRepository departmentRepository;

    private final AuthorizationService authorizationService;

    public DepartmentResponse create(DepartmentRequest request) {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        User currentUser = (User) authentication.getPrincipal();

        if (!authorizationService.hasPermission(
                currentUser,
                "DEPARTMENT_CREATE")) {

            throw new AccessDeniedException(
                    "Only HR can create departments");
        }

        if (departmentRepository.existsByName(request.name())) {
            throw new DuplicateResourceException(
                    "Department already exists");
        }

        Department department = Department.builder()
                .name(request.name())
                .description(request.description())
                .build();

        Department savedDepartment =
                departmentRepository.save(department);

        return toResponse(savedDepartment);
    }

    public Page<DepartmentResponse> findAll(Pageable pageable) {
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        User currentUser = (User) authentication.getPrincipal();

        if (!authorizationService.hasPermission(
                currentUser,
                "DEPARTMENT_READ")) {

            throw new AccessDeniedException(
                    "You do not have permission to view departments");
        }

        return departmentRepository.findAll(pageable)
                .map(this::toResponse);

    }

    private DepartmentResponse toResponse(Department department){
        return new DepartmentResponse(
                department.getId(),
                department.getName(),
                department.getDescription()  );
    }

    public DepartmentResponse findById(Long id) {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        User currentUser = (User) authentication.getPrincipal();

        if (!authorizationService.hasPermission(
                currentUser,
                "DEPARTMENT_READ")) {

            throw new AccessDeniedException(
                    "You do not have permission to view departments");
        }

        Department department = departmentRepository.findById(id)
                .orElseThrow(() ->  new ResourceNotFoundException("Department not found"));

        return toResponse(department);
    }


    public DepartmentResponse update(Long id, DepartmentRequest request) {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        User currentUser = (User) authentication.getPrincipal();

        if (!authorizationService.hasPermission(
                currentUser,
                "DEPARTMENT_UPDATE")) {

            throw new AccessDeniedException(
                    "Only HR can update departments");
        }


        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found"));

        if (!department.getName().equals(request.name())
                && departmentRepository.existsByName(request.name())) {
            throw new DuplicateResourceException("Department already exists");
        }

        department.setName(request.name());
        department.setDescription(request.description());

        Department updatedDepartment =
                departmentRepository.save(department);

        return toResponse(updatedDepartment);
    }



}
