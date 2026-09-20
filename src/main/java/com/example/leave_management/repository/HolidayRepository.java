package com.example.leave_management.repository;

import com.example.leave_management.entity.Holiday;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface HolidayRepository extends JpaRepository<Holiday, Long> {

    boolean existsByDate(LocalDate date);

    List<Holiday> findByDateBetween(
            LocalDate startDate,
            LocalDate endDate
    );
}