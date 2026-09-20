package com.example.leave_management.dto.availability;

import java.time.LocalDate;
import java.util.Map;

public record AvailabilityResponse(
        Long userId,
        String firstName,
        String lastName,
        String department,
        Map<LocalDate, DayAvailability> availability
) {
}