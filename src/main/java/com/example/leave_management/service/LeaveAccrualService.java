package com.example.leave_management.service;

import com.example.leave_management.entity.User;
import com.example.leave_management.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;


@Service
@RequiredArgsConstructor
public class LeaveAccrualService {

    private final UserRepository userRepository;

    @Scheduled(cron = "0 0 0 1 * *") //auto running at midnight every month
    @Transactional
    public void accrueLeave() {


        userRepository.findAll().stream()
                .filter(User::isActive)
                .forEach(user -> {

                    user.setAnnualLeaveBalance(
                            user.getAnnualLeaveBalance() + 2
                    );

                    userRepository.save(user);
                });
    }

    @Scheduled(cron = "59 59 23 31 12 *")
    @Transactional
    public void resetAnnualLeaveBalances() {
        System.out.println("Resetting annual leave balances...");
        userRepository.resetAllAnnualLeaveBalances();
    }


}
