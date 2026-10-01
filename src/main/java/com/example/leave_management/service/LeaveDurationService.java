package com.example.leave_management.service;

import com.example.leave_management.repository.HolidayRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class LeaveDurationService {

    private final HolidayRepository holidayRepository;

    public int calculateWorkingDays(LocalDate startDate, LocalDate endDate) {
        int workingDays = 0;

        LocalDate currentDate = startDate;

        while (!currentDate.isAfter(endDate)) {

            DayOfWeek dayOfWeek = currentDate.getDayOfWeek();

            boolean weekend =
                    dayOfWeek == DayOfWeek.SATURDAY ||
                            dayOfWeek == DayOfWeek.SUNDAY;

            boolean holiday =
                    holidayRepository.existsByDate(currentDate);

            if (!weekend && !holiday) {
                workingDays++;
            }

            currentDate = currentDate.plusDays(1);
        }

        return workingDays;
    }


    public boolean isWorkingDay(LocalDate date) {

        DayOfWeek dayOfWeek = date.getDayOfWeek();

        boolean weekend =
                dayOfWeek == DayOfWeek.SATURDAY ||
                        dayOfWeek == DayOfWeek.SUNDAY;

        boolean holiday =
                holidayRepository.existsByDate(date);

        return !weekend && !holiday;
    }



}