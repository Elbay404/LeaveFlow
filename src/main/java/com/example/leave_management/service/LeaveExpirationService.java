package com.example.leave_management.service;

import com.example.leave_management.entity.Leave;
import com.example.leave_management.enums.LeaveStatus;
import com.example.leave_management.enums.NotificationType;
import com.example.leave_management.repository.LeaveRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LeaveExpirationService {

    private final LeaveRepository leaveRepository;
    private final NotificationService notificationService;

    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void expirePendingLeaves() {

        LocalDate today = LocalDate.now();

        List<Leave> leaves =
                leaveRepository.findByStatusAndStartDateLessThanEqual(
                        LeaveStatus.PENDING,
                        today
                );

        for (Leave leave : leaves) {

            leave.setStatus(LeaveStatus.EXPIRED);
            leave.setUpdatedAt(LocalDateTime.now());

            Leave savedLeave = leaveRepository.save(leave);

            notificationService.create(
                    leave.getUser(),
                    NotificationType.LEAVE_EXPIRED,
                    "Leave Expired",
                    "Your leave request from "
                            + leave.getStartDate()
                            + " to "
                            + leave.getEndDate()
                            + " has expired because it was not approved before the start date.",
                    "LEAVE",
                    savedLeave.getId()
            );
        }
    }
}