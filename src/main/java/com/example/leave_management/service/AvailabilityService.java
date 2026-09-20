package com.example.leave_management.service;

import com.example.leave_management.dto.availability.AvailabilityResponse;
import com.example.leave_management.dto.availability.DayAvailability;
import com.example.leave_management.entity.Holiday;
import com.example.leave_management.entity.Leave;
import com.example.leave_management.entity.User;
import com.example.leave_management.enums.LeaveStatus;
import com.example.leave_management.repository.HolidayRepository;
import com.example.leave_management.repository.LeaveRepository;
import com.example.leave_management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AvailabilityService {

    private final UserRepository userRepository;
    private final LeaveRepository leaveRepository;

    private final HolidayRepository holidayRepository;

    public Page<AvailabilityResponse> findAll(
            User currentUser,
            Long departmentId,
            Long userId,
            String search,
            LocalDate startDate,
            Pageable pageable
    ){

        LocalDate monday;

        if (startDate != null) {
            monday = startDate;
        } else {
            monday = LocalDate.now().with(DayOfWeek.MONDAY);
        }

        LocalDate friday = monday.plusDays(4);

        //
        List<Holiday> holidays =
                holidayRepository.findByDateBetween(monday, friday);

        List<LocalDate> dates = new ArrayList<>();

        for (int i = 0; i < 5; i++) {
            dates.add(monday.plusDays(i));
        }

        List<Leave> leaves =
                leaveRepository
                        .findByStartDateLessThanEqualAndEndDateGreaterThanEqual(
                                friday,
                                monday
                        );

        Map<Long, List<Leave>> leavesByUser =
                new LinkedHashMap<>();

        for (Leave leave : leaves) {
            leavesByUser
                    .computeIfAbsent(
                            leave.getUser().getId(),
                            key -> new ArrayList<>()
                    )
                    .add(leave);
        }

        Long effectiveDepartmentId = departmentId;

        if (effectiveDepartmentId == null
                && !"HR".equals(currentUser.getRole().getName())) {

            if (currentUser.getDepartment() != null) {
                effectiveDepartmentId =
                        currentUser.getDepartment().getId();
            }
        }
        final Long departmentFilter = effectiveDepartmentId;

        String effectiveSearch = search == null
                ? ""
                : search.trim();

        Page<User> users = userRepository.findAvailabilityUsers(
                departmentFilter,
                userId,
                effectiveSearch,
                pageable
        );

        return users.map(user ->
                toResponse(
                        user,
                        dates,
                        leavesByUser.getOrDefault(
                                user.getId(),
                                List.of()
                        ),
                        holidays
                )
        );
    }

    private AvailabilityResponse toResponse(
            User user,
            List<LocalDate> dates,
            List<Leave> leaves,
            List<Holiday> holidays
    ) {

        Map<LocalDate, DayAvailability> availability =
                new LinkedHashMap<>();

        for (LocalDate date : dates) {

            String status = "AVAILABLE";
            String label = "Available";

            Holiday holiday = holidays.stream()
                    .filter(item -> item.getDate().equals(date))
                    .findFirst()
                    .orElse(null);

            if (holiday != null) {
                status = "HOLIDAY";
                label = holiday.getName();
            } else {
                for (Leave leave : leaves) {

                    boolean dateInLeave =
                            !date.isBefore(leave.getStartDate())
                                    && !date.isAfter(leave.getEndDate());

                    if (dateInLeave) {

                        if (leave.getStatus() == LeaveStatus.APPROVED) {
                            status = "ON_LEAVE";
                            label = leave.getLeaveType().getName();
                            break;
                        }

                        if (leave.getStatus() == LeaveStatus.PENDING) {
                            status = "PENDING";
                            label = "Leave pending";
                        }
                    }
                }
            }

            availability.put(date, new DayAvailability(status, label) );
        }

        return new AvailabilityResponse(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getDepartment() != null
                        ? user.getDepartment().getName()
                        : null,
                availability
        );
    }
}