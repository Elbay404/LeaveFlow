package com.example.leave_management.dto.leave;

import java.time.LocalDate;
import java.util.List;

public record LeaveBalanceResponse(
        int year,
        int accruedDays,
        int usedDays,
        int remainingDays,
        int workingDays,
        int userWorkingDays,
        int nonWorkingDays,
        double utilizationPercentage,
        LocalDate nextAccrualDate,
        List<MonthlyLeaveConsumptionResponse> monthlyConsumption
) {
}