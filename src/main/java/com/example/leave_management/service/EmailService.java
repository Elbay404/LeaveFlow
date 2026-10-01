package com.example.leave_management.service;

import com.example.leave_management.exception.EmailSendingException;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.FileSystemResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.io.File;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    public void sendAccountCredentials(
            String recipientEmail,
            String firstName,
            String temporaryPassword,
            String role,
            String department) {

        Context context = new Context();

        context.setVariable("firstName", firstName);
        context.setVariable("recipientEmail", recipientEmail);
        context.setVariable("temporaryPassword", temporaryPassword);
        context.setVariable("role", role);
        context.setVariable("department", department);

        String html = templateEngine.process(
                "email/account-created",
                context
        );

        sendHtmlEmail(
                recipientEmail,
                "Your LeaveFlow account has been created",
                html,
                null
        );
    }

    public void sendPasswordResetEmail(
            String recipientEmail,
            String firstName,
            String temporaryPassword) {

        Context context = new Context();

        context.setVariable("firstName", firstName);
        context.setVariable("recipientEmail", recipientEmail);
        context.setVariable("temporaryPassword", temporaryPassword);

        String html = templateEngine.process(
                "email/password-reset",
                context
        );

        sendHtmlEmail(
                recipientEmail,
                "Your LeaveFlow password has been reset",
                html,
                null
        );
    }

    public void sendPasswordResetLink(
            String recipientEmail,
            String firstName,
            String resetToken) {

        Context context = new Context();

        context.setVariable("firstName", firstName);

        String resetUrl =
                "http://localhost:3000/reset-password?token="
                        + resetToken;

        context.setVariable("resetUrl", resetUrl);

        String html = templateEngine.process(
                "email/password-reset-link",
                context
        );

        sendHtmlEmail(
                recipientEmail,
                "Reset your LeaveFlow password",
                html,
                null
        );
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

        Context context = new Context();

        context.setVariable("employeeName", employeeName);
        context.setVariable("leaveType", leaveType);
        context.setVariable("startDate", startDate);
        context.setVariable("endDate", endDate);
        context.setVariable("duration", duration);

        String html = templateEngine.process(
                "email/leave-submitted",
                context
        );

        sendHtmlEmail(
                employeeEmail,
                "Leave Request Submitted",
                html,
                managerEmail,
                documentPath
        );
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

        Context context = new Context();

        context.setVariable("employeeName", employeeName);
        context.setVariable("leaveType", leaveType);
        context.setVariable("startDate", startDate);
        context.setVariable("endDate", endDate);
        context.setVariable("duration", duration);
        context.setVariable("status", status);
        context.setVariable("rejectionReason", rejectionReason);
        context.setVariable("actionBy", actionBy);

        String html = templateEngine.process(
                "email/leave-decision",
                context
        );

        sendHtmlEmail(
                employeeEmail,
                "Leave Request " + status,
                html,
                managerEmail,
                documentPath
        );
    }

    private void sendHtmlEmail(
            String recipientEmail,
            String subject,
            String html,
            String ccEmail
    ) {

        sendHtmlEmail(
                recipientEmail,
                subject,
                html,
                ccEmail,
                null
        );
    }

    private void sendHtmlEmail(
            String recipientEmail,
            String subject,
            String html,
            String ccEmail,
            String documentPath
    ) {

        try {

            MimeMessage message =
                    mailSender.createMimeMessage();

            MimeMessageHelper helper =
                    new MimeMessageHelper(
                            message,
                            true,
                            "UTF-8"
                    );

            helper.setTo(recipientEmail);

            if (ccEmail != null && !ccEmail.isBlank()) {
                helper.setCc(ccEmail);
            }

            helper.setSubject(subject);
            helper.setText(html, true);

            ClassPathResource logo =
                    new ClassPathResource(
                            "static/images/leaveflow-logo.png"
                    );

            helper.addInline(
                    "logo",
                    logo
            );

            addAttachment(
                    helper,
                    documentPath
            );

            mailSender.send(message);

        } catch (Exception exception) {
            System.err.println("EMAIL ERROR:");
            exception.printStackTrace();

            throw new EmailSendingException(
                    "Failed to send email: " + exception.getMessage()
            );
        }
    }

    private void addAttachment(
            MimeMessageHelper helper,
            String documentPath
    ) throws MessagingException {

        if (documentPath == null ||
                documentPath.isBlank()) {
            return;
        }

        File file = new File(documentPath);

        if (!file.exists()) {
            return;
        }

        FileSystemResource resource =
                new FileSystemResource(file);

        helper.addAttachment(
                file.getName(),
                resource
        );
    }
}