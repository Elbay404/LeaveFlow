package com.example.leave_management.controller;

import com.example.leave_management.entity.LeaveType;
import com.example.leave_management.repository.LeaveTypeRepository;
import lombok.RequiredArgsConstructor;
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
}