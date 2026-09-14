package com.example.leave_management.controller;


import com.example.leave_management.dto.department.DepartmentRequest;
import com.example.leave_management.dto.department.DepartmentResponse;
import com.example.leave_management.service.DepartmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/departments")
@RequiredArgsConstructor
public class DepartmentController {

    private final DepartmentService departmentService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DepartmentResponse create(
            @Valid @RequestBody DepartmentRequest request
    ) {
        return departmentService.create(request);
    }

    @GetMapping
    public Page<DepartmentResponse> findAll(
            @PageableDefault(size = 10) Pageable pageable) {

        return departmentService.findAll(pageable);
    }

    @GetMapping("/{id}")
    public DepartmentResponse findById(@PathVariable Long id) {
        return departmentService.findById(id);
    }

    @PutMapping("/{id}")
    public DepartmentResponse update(
            @PathVariable Long id,
            @Valid @RequestBody DepartmentRequest request
    ) {
        return departmentService.update(id, request);
    }


}