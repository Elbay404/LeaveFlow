/*package com.example.conge_management.controller;

import com.example.conge_management.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/test-email")
@RequiredArgsConstructor
public class EmailTestController {

    private final EmailService emailService;

    @PostMapping
    public String testEmail(@RequestParam String email) {

        emailService.sendAccountCredentials(
                email,
                "Test User",
                "Test123456"
        );

        return "Email sent successfully";
    }
}*/