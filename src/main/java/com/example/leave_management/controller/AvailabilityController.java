package com.example.leave_management.controller;

import com.example.leave_management.dto.availability.AvailabilityResponse;
import com.example.leave_management.entity.User;
import com.example.leave_management.service.AvailabilityService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/availability")
@RequiredArgsConstructor
public class AvailabilityController {

    private final AvailabilityService availabilityService;

    @GetMapping
    public Page<AvailabilityResponse> findAll(
            @AuthenticationPrincipal User currentUser,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate startDate,
            Pageable pageable
    ) {
        return availabilityService.findAll(
                currentUser,
                departmentId,
                userId,
                search,
                startDate,
                pageable
        );
    }
}