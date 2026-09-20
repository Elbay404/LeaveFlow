package com.example.leave_management.service;

import com.example.leave_management.entity.Holiday;
import com.example.leave_management.repository.HolidayRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class HolidayService {

    private final HolidayRepository holidayRepository;

    public List<Holiday> findAll() {
        return holidayRepository.findAll();
    }
}