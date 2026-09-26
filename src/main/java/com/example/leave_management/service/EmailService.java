package com.example.leave_management.service;

import com.example.leave_management.exception.EmailSendingException;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.io.File;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    public void sendAccountCredentials(
            String recipientEmail,
            String firstName,
            String temporaryPassword,
            String role,
            String department) {

        try {
            SimpleMailMessage message = new SimpleMailMessage();

            message.setTo(recipientEmail);
            message.setSubject("Your account has been created");
            message.setText(
                    "Hello " + firstName + ",\n\n" +
                            "Your account has been created successfully.\n\n" +
                            "Email: " + recipientEmail + "\n" +
                            "Temporary password: " + temporaryPassword + "\n\n" +
                            "Role: " + role + "\n" +
                            "Department: " + department + "\n\n" +
                            "Please change your password after your first login.\n\n" +
                            "Regards,\n" +
                            "HR Department"
            );

            mailSender.send(message);

        } catch (Exception exception) {
            throw new EmailSendingException(
                    "Failed to send account email"
            );
        }
    }

    public void sendPasswordResetEmail(
            String recipientEmail,
            String firstName,
            String temporaryPassword) {

        try {
            SimpleMailMessage message = new SimpleMailMessage();

            message.setTo(recipientEmail);
            message.setSubject("Your password has been reset");
            message.setText(
                    "Hello " + firstName + ",\n\n" +
                            "Your password has been reset by the HR department.\n\n" +
                            "Email: " + recipientEmail + "\n" +
                            "Temporary password: " + temporaryPassword + "\n\n" +
                            "Please change your password after logging in.\n\n" +
                            "Regards,\n" +
                            "HR Department"
            );

            mailSender.send(message);

        } catch (Exception exception) {
            throw new EmailSendingException(
                    "Failed to send password reset email"
            );
        }
    }


    public void sendLeaveRequestEmail(
            String employeeEmail,
            String managerEmail,
            String employeeName,
            String leaveType,
            String startDate,
            String endDate,
            int duration,
            String documentPath
    ) {
        try {
            MimeMessage message = mailSender.createMimeMessage();

            MimeMessageHelper helper =
                    new MimeMessageHelper(message, true); //supprt attachments

            helper.setTo(employeeEmail);

            if (managerEmail != null && !managerEmail.isBlank()) {
                helper.setCc(managerEmail);
            }
            helper.setSubject("Leave Request Submitted");

            helper.setText(
                    "Leave request submitted\n\n" +
                            "Employee: " + employeeName + "\n" +
                            "Leave type: " + leaveType + "\n" +
                            "Start date: " + startDate + "\n" +
                            "End date: " + endDate + "\n" +
                            "Duration: " + duration + " working days\n" +
                            "Status: PENDING"
            );

            addAttachment(helper, documentPath);

            mailSender.send(message);

        } catch (MessagingException exception) {
            throw new IllegalArgumentException("Failed to send leave request email");
        }
    }

    public void sendLeaveDecisionEmail(
            String employeeEmail,
            String managerEmail,
            String employeeName,
            String leaveType,
            String startDate,
            String endDate,
            int duration,
            String status,
            String rejectionReason,
            String actionBy,
            String documentPath
    ) {
        try {
            MimeMessage message = mailSender.createMimeMessage();

            MimeMessageHelper helper =
                    new MimeMessageHelper(message, true);

            helper.setTo(employeeEmail);

            if (managerEmail != null && !managerEmail.isBlank()) {
                helper.setCc(managerEmail);
            }
            helper.setSubject("Leave Request " + status);

            String text =
                    "Leave request " + status.toLowerCase() + "\n\n" +
                            "Employee: " + employeeName + "\n" +
                            "Leave type: " + leaveType + "\n" +
                            "Start date: " + startDate + "\n" +
                            "End date: " + endDate + "\n" +
                            "Duration: " + duration + " working days\n" +
                            "Status: " + status + "\n" +
                            "Action by: " + actionBy;

            if (rejectionReason != null &&
                    !rejectionReason.isBlank()) {
                text += "\nRejection reason: " + rejectionReason;
            }

            helper.setText(text);

            addAttachment(helper, documentPath);

            mailSender.send(message);

        } catch (MessagingException exception) {
            throw new IllegalArgumentException(
                    "Failed to send leave decision email"
            );
        }
    }

    private void addAttachment(
            MimeMessageHelper helper,
            String documentPath
    ) throws MessagingException {

        if (documentPath == null) {
            return;
        }

        File file = new File(documentPath);

        if (file.exists()) {
            FileSystemResource resource =
                    new FileSystemResource(file);

            helper.addAttachment(
                    file.getName(),
                    resource
            );
        }
    }

    public void sendPasswordResetLink(
            String recipientEmail,
            String firstName,
            String resetToken) {

        try {
            SimpleMailMessage message = new SimpleMailMessage();

            message.setTo(recipientEmail);
            message.setSubject("Password reset request");
            message.setText(
                    "Hello " + firstName + ",\n\n" +
                            "We received a request to reset your password.\n\n" +
                            "Use the following link to reset your password:\n" +
                            "http://localhost:3000/reset-password?token=" + resetToken+ "\n\n" +
                            "This link will expire in 15 minutes.\n\n" +
                            "If you did not request this reset, you can ignore this email.\n\n" +
                            "Regards,\n" +
                            "HR Department"
            );

            mailSender.send(message);

        } catch (Exception exception) {
            throw new EmailSendingException(
                    "Failed to send password reset email"
            );
        }
    }

}
