package com.example.leave_management.service;

import com.example.leave_management.dto.leave.LeaveBalanceResponse;
import com.example.leave_management.dto.leave.MonthlyLeaveConsumptionResponse;
import com.example.leave_management.entity.Leave;
import com.example.leave_management.entity.User;
import com.example.leave_management.enums.LeaveStatus;
import com.example.leave_management.repository.LeaveRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.Month;
import java.time.Year;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LeaveBalanceService {

    private final LeaveRepository leaveRepository;
    private final LeaveDurationService leaveDurationService;

    public LeaveBalanceResponse getMyBalance() {

        User currentUser =
                (User) SecurityContextHolder
                        .getContext()
                        .getAuthentication()
                        .getPrincipal();

        int year = Year.now().getValue();

        LocalDate yearStart =
                LocalDate.of(year, 1, 1);

        LocalDate yearEnd =
                LocalDate.of(year, 12, 31);

        List<Leave> approvedLeaves =
                leaveRepository
                        .findByUserAndStatusAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                                currentUser,
                                LeaveStatus.APPROVED,
                                yearEnd,
                                yearStart
                        );

        int usedDays = 0;

        List<MonthlyLeaveConsumptionResponse> monthlyConsumption =
                new ArrayList<>();

        for (Month month : Month.values()) {

            LocalDate monthStart =
                    LocalDate.of(year, month, 1);

            LocalDate monthEnd =
                    monthStart.withDayOfMonth(
                            month.length(
                                    monthStart.isLeapYear()
                            )
                    );

            int monthDays = 0;

            for (Leave leave : approvedLeaves) {

                LocalDate start =
                        leave.getStartDate().isAfter(monthStart)
                                ? leave.getStartDate()
                                : monthStart;

                LocalDate end =
                        leave.getEndDate().isBefore(monthEnd)
                                ? leave.getEndDate()
                                : monthEnd;

                if (!start.isAfter(end)) {

                    monthDays +=
                            leaveDurationService
                                    .calculateWorkingDays(
                                            start,
                                            end
                                    );
                }
            }

            usedDays += monthDays;

            monthlyConsumption.add(
                    new MonthlyLeaveConsumptionResponse(
                            month.name(),
                            monthDays
                    )
            );
        }

        int workingDays =
                leaveDurationService.calculateWorkingDays(
                        yearStart,
                        yearEnd
                );

        int totalDays =
                yearStart.lengthOfYear();

        int nonWorkingDays =
                totalDays - workingDays;

        int remainingDays =
                currentUser.getAnnualLeaveBalance();

        int accruedDays =
                remainingDays + usedDays;

        int userWorkingDays =
                Math.max(workingDays - usedDays, 0);

        double utilizationPercentage =
                accruedDays > 0
                        ? ((double) usedDays / accruedDays) * 100
                        : 0;

        LocalDate today = LocalDate.now();

        LocalDate nextAccrualDate =
                today.withDayOfMonth(1);

        if (!today.isBefore(nextAccrualDate)) {
            nextAccrualDate =
                    nextAccrualDate.plusMonths(1);
        }

        return new LeaveBalanceResponse(
                year,
                accruedDays,
                usedDays,
                remainingDays,
                workingDays,
                userWorkingDays,
                nonWorkingDays,
                utilizationPercentage,
                nextAccrualDate,
                monthlyConsumption
        );
    }
}