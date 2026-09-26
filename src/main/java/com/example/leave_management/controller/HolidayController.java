package com.example.leave_management.controller;

import com.example.leave_management.dto.holiday.HolidayRequest;
import com.example.leave_management.entity.Holiday;
import com.example.leave_management.service.HolidayService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/holidays")
@RequiredArgsConstructor
public class HolidayController {

    private final HolidayService holidayService;

    @GetMapping
    public List<Holiday> getAllHolidays() {
        return holidayService.getAllHolidays();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Holiday createHoliday(
            @Valid @RequestBody HolidayRequest request
    ) {
        return holidayService.createHoliday(
                request.date(),
                request.name(),
                request.description()
        );
    }

    @PutMapping("/{id}")
    public Holiday updateHoliday(
            @PathVariable Long id,
            @Valid @RequestBody HolidayRequest request
    ) {
        return holidayService.updateHoliday(
                id,
                request.date(),
                request.name(),
                request.description()
        );
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteHoliday(@PathVariable Long id) {
        holidayService.deleteHoliday(id);
    }
}