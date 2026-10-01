package com.example.leave_management.service;

import com.example.leave_management.entity.User;
import com.example.leave_management.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserActivationService {

    private final UserRepository userRepository;

    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void activateUsers() {

        LocalDate today = LocalDate.now();

        List<User> users =
                userRepository.findByActiveFalseAndHireDateLessThanEqual(today);

        for (User user : users) {
            user.setActive(true);
            userRepository.save(user);
        }
    }
}