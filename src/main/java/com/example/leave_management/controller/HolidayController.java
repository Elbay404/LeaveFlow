package com.example.leave_management.controller;

import com.example.leave_management.entity.Holiday;
import com.example.leave_management.repository.HolidayRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/holidays")
@RequiredArgsConstructor
public class HolidayController {

    private final HolidayRepository holidayRepository;

    @GetMapping
    public List<Holiday> findAll() {
        return holidayRepository.findAll();
    }
}