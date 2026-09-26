package com.example.leave_management.service;

import com.example.leave_management.entity.Holiday;
import com.example.leave_management.entity.User;
import com.example.leave_management.repository.HolidayRepository;
import com.example.leave_management.security.AuthorizationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class HolidayService {

    private final HolidayRepository holidayRepository;
    private final AuthorizationService authorizationService;

    public List<Holiday> getAllHolidays() {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        User currentUser = (User) authentication.getPrincipal();

        if (!authorizationService.hasPermission(
                currentUser, "HOLIDAY_READ")) {

            throw new AccessDeniedException(
                    "You do not have permission to view holidays");
        }

        return holidayRepository.findAll();
    }

    @Transactional
    public Holiday createHoliday(
            LocalDate date,
            String name,
            String description
    ) {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        User currentUser = (User) authentication.getPrincipal();

        if (!authorizationService.hasPermission(
                currentUser, "HOLIDAY_CREATE")) {

            throw new AccessDeniedException(
                    "You do not have permission to create holidays");
        }

        if (holidayRepository.existsByDate(date)) {
            throw new IllegalArgumentException(
                    "A holiday already exists for this date");
        }

        Holiday holiday = Holiday.builder()
                .date(date)
                .name(name)
                .description(description)
                .build();

        return holidayRepository.save(holiday);
    }

    @Transactional
    public Holiday updateHoliday(
            Long id,
            LocalDate date,
            String name,
            String description
    ) {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        var currentUser = (com.example.leave_management.entity.User)
                authentication.getPrincipal();

        if (!authorizationService.hasPermission(
                currentUser, "HOLIDAY_UPDATE")) {

            throw new AccessDeniedException(
                    "You do not have permission to update holidays");
        }

        Holiday holiday = holidayRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Holiday not found"));

        if (!holiday.getDate().equals(date)
                && holidayRepository.existsByDate(date)) {

            throw new IllegalArgumentException(
                    "A holiday already exists for this date");
        }

        holiday.setDate(date);
        holiday.setName(name);
        holiday.setDescription(description);

        return holidayRepository.save(holiday);
    }

    @Transactional
    public void deleteHoliday(Long id) {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        User currentUser = (User) authentication.getPrincipal();

        if (!authorizationService.hasPermission(
                currentUser, "HOLIDAY_DELETE")) {

            throw new AccessDeniedException(
                    "You do not have permission to delete holidays");
        }

        Holiday holiday = holidayRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Holiday not found"));

        holidayRepository.delete(holiday);
    }

}