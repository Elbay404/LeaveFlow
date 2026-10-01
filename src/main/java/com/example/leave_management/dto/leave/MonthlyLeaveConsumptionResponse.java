package com.example.leave_management.dto.leave;

public record MonthlyLeaveConsumptionResponse(
        String month,
        int days
) {
}