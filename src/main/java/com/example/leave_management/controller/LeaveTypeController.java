package com.example.leave_management.controller;

import com.example.leave_management.dto.leave_type.LeaveTypeRequest;
import com.example.leave_management.entity.LeaveType;
import com.example.leave_management.repository.LeaveTypeRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/leave-types")
@RequiredArgsConstructor
public class LeaveTypeController {

    private final LeaveTypeRepository leaveTypeRepository;

    @GetMapping
    public List<LeaveType> findAll() {
        return leaveTypeRepository.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public LeaveType create(
            @Valid @RequestBody LeaveTypeRequest request
    ) {

        if (leaveTypeRepository.existsByCode(request.code())) {
            throw new IllegalArgumentException(
                    "Leave type code already exists"
            );
        }

        LeaveType leaveType = LeaveType.builder()
                .code(request.code())
                .name(request.name())
                .description(request.description())
                .consumesBalance(request.consumesBalance())
                .requiresDocument(request.requiresDocument())
                .maxDays(request.maxDays())
                .build();

        return leaveTypeRepository.save(leaveType);
    }

    @PutMapping("/{id}")
    public LeaveType update(
            @PathVariable Long id,
            @Valid @RequestBody LeaveTypeRequest request
    ) {

        LeaveType leaveType = leaveTypeRepository.findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Leave type not found"
                        )
                );

        if (!leaveType.getCode().equals(request.code())
                && leaveTypeRepository.existsByCode(request.code())) {

            throw new IllegalArgumentException(
                    "Leave type code already exists"
            );
        }

        leaveType.setCode(request.code());
        leaveType.setName(request.name());
        leaveType.setDescription(request.description());
        leaveType.setConsumesBalance(request.consumesBalance());
        leaveType.setRequiresDocument(request.requiresDocument());
        leaveType.setMaxDays(request.maxDays());

        return leaveTypeRepository.save(leaveType);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {

        LeaveType leaveType = leaveTypeRepository.findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Leave type not found"
                        )
                );

        leaveTypeRepository.delete(leaveType);
    }
}