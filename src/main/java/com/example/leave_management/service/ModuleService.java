package com.example.leave_management.service;

import com.example.leave_management.dto.module.ModuleRequest;
import com.example.leave_management.dto.module.ModuleResponse;
import com.example.leave_management.entity.Module;
import com.example.leave_management.entity.User;
import com.example.leave_management.exception.DuplicateResourceException;
import com.example.leave_management.exception.ResourceNotFoundException;
import com.example.leave_management.repository.ModuleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ModuleService {

    private final ModuleRepository moduleRepository;

    public ModuleResponse create(ModuleRequest request) {
        checkHr();

        if (moduleRepository.existsByName(request.name())) {
            throw new DuplicateResourceException("Module name already exists");
        }

        Module module = Module.builder()
                .name(request.name())
                .description(request.description())
                .build();

        Module savedModule = moduleRepository.save(module);

        return toResponse(savedModule);
    }

    public List<ModuleResponse> findAll() {
        checkHr();
        return moduleRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public ModuleResponse findById(Long id) {
        checkHr();

        Module module = moduleRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Module not found"));

        return toResponse(module);
    }

    public ModuleResponse update(Long id, ModuleRequest request) {
        checkHr();

        Module module = moduleRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Module not found"));

        if (!module.getName().equals(request.name())
                && moduleRepository.existsByName(request.name())) {
            throw new DuplicateResourceException("Module name already exists");
        }

        module.setName(request.name());
        module.setDescription(request.description());

        Module updatedModule = moduleRepository.save(module);

        return toResponse(updatedModule);
    }

   /* public void delete(Long id) {

        Module module = moduleRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Module not found"));

        moduleRepository.delete(module);
    }*/

    private void checkHr() {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        User currentUser =
                (User) authentication.getPrincipal();

        if (!currentUser.getRole().getName().equals("HR")) {
            throw new AccessDeniedException(
                    "Only HR can manage modules");
        }
    }

    private ModuleResponse toResponse(Module module) {
        return new ModuleResponse(
                module.getId(),
                module.getName(),
                module.getDescription()
        );
    }
}