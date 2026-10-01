package com.example.leave_management.controller;

import com.example.leave_management.dto.notification.NotificationResponse;
import com.example.leave_management.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public List<NotificationResponse> getMyNotifications() {
        return notificationService.getMyNotifications();
    }

    @GetMapping("/unread")
    public List<NotificationResponse> getUnreadNotifications() {
        return notificationService.getUnreadNotifications();
    }

    @GetMapping("/unread-count")
    public long getUnreadCount() {
        return notificationService.getUnreadCount();
    }

    @PatchMapping("/{notificationId}/read")
    public void markAsRead(
            @PathVariable Long notificationId
    ) {
        notificationService.markAsRead(notificationId);
    }

    @PatchMapping("/read-all")
    public void markAllAsRead() {
        notificationService.markAllAsRead();
    }
}