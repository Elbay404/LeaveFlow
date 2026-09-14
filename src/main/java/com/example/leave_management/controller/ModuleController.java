package com.example.leave_management.controller;

import com.example.leave_management.dto.module.ModuleRequest;
import com.example.leave_management.dto.module.ModuleResponse;
import com.example.leave_management.service.ModuleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/modules")
@RequiredArgsConstructor
public class ModuleController {

    private final ModuleService moduleService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ModuleResponse create(
            @Valid @RequestBody ModuleRequest request
    ) {
        return moduleService.create(request);
    }

    @GetMapping
    public List<ModuleResponse> findAll() {
        return moduleService.findAll();
    }

    @GetMapping("/{id}")
    public ModuleResponse findById(@PathVariable Long id) {
        return moduleService.findById(id);
    }

    @PutMapping("/{id}")
    public ModuleResponse update(
            @PathVariable Long id,
            @Valid @RequestBody ModuleRequest request
    ) {
        return moduleService.update(id, request);
    }


}