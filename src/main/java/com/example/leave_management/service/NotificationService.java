package com.example.leave_management.service;

import com.example.leave_management.dto.notification.NotificationResponse;
import com.example.leave_management.entity.Notification;
import com.example.leave_management.entity.User;
import com.example.leave_management.enums.NotificationType;
import com.example.leave_management.repository.NotificationRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public Notification create(
            User recipient,
            NotificationType type,
            String title,
            String message,
            String entityType,
            Long entityId
    ) {
        Notification notification = Notification.builder()
                .recipient(recipient)
                .type(type)
                .title(title)
                .message(message)
                .entityType(entityType)
                .entityId(entityId)
                .read(false)
                .createdAt(LocalDateTime.now())
                .build();

        Notification savedNotification =
                notificationRepository.save(notification);

        messagingTemplate.convertAndSendToUser(
                recipient.getEmail(),
                "/notifications",
                toResponse(savedNotification)
        );

        return savedNotification;
    }

    public List<NotificationResponse> getMyNotifications() {
        User currentUser = getCurrentUser();

        return notificationRepository
                .findByRecipientOrderByCreatedAtDesc(currentUser)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<NotificationResponse> getUnreadNotifications() {
        User currentUser = getCurrentUser();

        return notificationRepository
                .findByRecipientAndReadFalseOrderByCreatedAtDesc(currentUser)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public long getUnreadCount() {
        User currentUser = getCurrentUser();

        return notificationRepository
                .countByRecipientAndReadFalse(currentUser);
    }

    @Transactional
    public void markAsRead(Long notificationId) {
        User currentUser = getCurrentUser();

        Notification notification = notificationRepository
                .findById(notificationId)
                .orElseThrow(() ->
                        new EntityNotFoundException("Notification not found"));

        if (!notification.getRecipient().getId().equals(currentUser.getId())) {
            throw new SecurityException(
                    "You cannot modify another user's notification"
            );
        }

        if (!notification.isRead()) {
            notification.setRead(true);
            notification.setReadAt(LocalDateTime.now());
            notificationRepository.save(notification);
        }
    }

    @Transactional
    public void markAllAsRead() {
        User currentUser = getCurrentUser();

        List<Notification> notifications =
                notificationRepository
                        .findByRecipientAndReadFalseOrderByCreatedAtDesc(currentUser);

        LocalDateTime now = LocalDateTime.now();

        notifications.forEach(notification -> {
            notification.setRead(true);
            notification.setReadAt(now);
        });

        notificationRepository.saveAll(notifications);
    }

    private User getCurrentUser() {
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        return (User) authentication.getPrincipal();
    }

    private NotificationResponse toResponse(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getType(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getEntityType(),
                notification.getEntityId(),
                notification.isRead(),
                notification.getCreatedAt(),
                notification.getReadAt()
        );
    }
}