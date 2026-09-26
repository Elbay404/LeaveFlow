package com.example.leave_management.service;

import com.example.leave_management.dto.leave.LeaveRequest;
import com.example.leave_management.dto.leave.LeaveResponse;
import com.example.leave_management.dto.leave.LeaveUserResponse;
import com.example.leave_management.entity.Leave;
import com.example.leave_management.entity.LeaveType;
import com.example.leave_management.entity.User;
import com.example.leave_management.enums.LeaveStatus;
import com.example.leave_management.repository.LeaveRepository;
import com.example.leave_management.repository.LeaveTypeRepository;
import com.example.leave_management.repository.UserRepository;
import com.example.leave_management.security.AuthorizationService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LeaveService {

    private final LeaveRepository leaveRepository;
    private final LeaveTypeRepository leaveTypeRepository;
    private final UserRepository userRepository;
    private final AuthorizationService authorizationService;
    private final LeaveDurationService leaveDurationService;

    private final EmailService emailService;

    private final Path uploadDirectory =
            Paths.get("uploads/leaves");


    public LeaveResponse create(LeaveRequest request) {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        User currentUser = (User) authentication.getPrincipal();

        if (!authorizationService.hasPermission(
                currentUser, "LEAVE_CREATE")) {

            throw new AccessDeniedException(
                    "You do not have permission to create a leave"
            );
        }

        if (request.startDate() == null ||
                request.endDate() == null) {

            throw new IllegalArgumentException(
                    "Start date and end date are required"
            );
        }

        if (request.endDate().isBefore(request.startDate())) {

            throw new IllegalArgumentException(
                    "End date cannot be before start date"
            );
        }

        LeaveType leaveType = leaveTypeRepository.findById(
                request.leaveTypeId()
        ).orElseThrow(() ->
                new EntityNotFoundException(
                        "Leave type not found"
                )
        );

        if (leaveType.getRequiresDocument() &&
                (request.document() == null ||
                        request.document().isEmpty())) {

            throw new IllegalArgumentException(
                    "This leave type requires a document"
            );
        }

        int days = leaveDurationService.calculateWorkingDays(
                request.startDate(),
                request.endDate()
        );

        if (days == 0) {
            throw new IllegalArgumentException(
                    "Leave period contains no working days"
            );
        }

        if (leaveType.getMaxDays() != null &&
                days > leaveType.getMaxDays()) {

            throw new IllegalArgumentException(
                    "Leave duration exceeds the maximum allowed days"
            );
        }

        if (Boolean.TRUE.equals(
                leaveType.getConsumesBalance())) {

            if (days > currentUser.getAnnualLeaveBalance()) {

                throw new IllegalArgumentException(
                        "Insufficient annual leave balance"
                );
            }
        }

        if (leaveRepository
                .existsByUserAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                        currentUser,
                        request.endDate(),
                        request.startDate()
                )) {

            throw new IllegalArgumentException(
                    "You already have a leave during these dates"
            );
        }

        String documentPath = saveDocument(request.document());

        Leave leave = Leave.builder()
                .user(currentUser)
                .leaveType(leaveType)
                .startDate(request.startDate())
                .endDate(request.endDate())
                .duration(days)
                .reason(request.reason())
                .requestedAt(LocalDateTime.now())
                .status(LeaveStatus.PENDING)
                .documentName(
                        request.document() != null
                                ? request.document().getOriginalFilename()
                                : null
                )
                .documentPath(documentPath)
                .build();

        Leave savedLeave = leaveRepository.save(leave);
        String recipientEmail = null;

        if ("EMPLOYEE".equals(currentUser.getRole().getName())) {
            recipientEmail = currentUser.getManager().getEmail();
        } else if ("MANAGER".equals(currentUser.getRole().getName())) {
            recipientEmail = userRepository.findFirstByRole_Name("HR")
                    .map(User::getEmail)
                    .orElse(null);
        } else if ("HR".equals(currentUser.getRole().getName())) {
            recipientEmail = userRepository.findFirstByRole_Name("CEO")
                    .map(User::getEmail)
                    .orElse(null);
        }

        emailService.sendLeaveRequestEmail(
                currentUser.getEmail(),
                recipientEmail,
                currentUser.getFirstName() + " " + currentUser.getLastName(),
                leaveType.getCode(),
                request.startDate().toString(),
                request.endDate().toString(),
                days,
                documentPath
        );

        return toResponse(savedLeave);
    }

    @Transactional
    public LeaveResponse updateStatus(
            Long leaveId,
            LeaveStatus status,
            String rejectionReason
    ) {

        Leave leave = leaveRepository.findById(leaveId)
                .orElseThrow(() ->
                        new EntityNotFoundException(
                                "Leave not found"
                        )
                );

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        User currentUser =
                (User) authentication.getPrincipal();

        if (status != LeaveStatus.CANCELLED &&
                leave.getStatus() != LeaveStatus.PENDING) {

            throw new IllegalArgumentException(
                    "Only pending leaves can be updated"
            );
        }

        if (status == LeaveStatus.CANCELLED) {

            if (leave.getStatus() != LeaveStatus.PENDING &&
                    leave.getStatus() != LeaveStatus.APPROVED) {

                throw new IllegalArgumentException(
                        "Only pending or approved leaves can be cancelled"
                );
            }

            if (!leave.getUser().getId()
                    .equals(currentUser.getId())) {

                throw new AccessDeniedException(
                        "You can only cancel your own leave"
                );
            }

            if (!authorizationService.hasPermission(
                    currentUser, "LEAVE_CANCEL_OWN")) {

                throw new AccessDeniedException(
                        "You do not have permission to cancel a leave"
                );
            }
        }

        else if (status == LeaveStatus.APPROVED ||
                status == LeaveStatus.REJECTED) {

            String permission =
                    status == LeaveStatus.APPROVED
                            ? "LEAVE_APPROVE"
                            : "LEAVE_REJECT";

            if (!authorizationService.hasPermission(
                    currentUser, permission)) {

                throw new AccessDeniedException(
                        "You do not have permission to change this leave status"
                );
            }

            String role = currentUser.getRole().getName();
            String employeeRole = leave.getUser().getRole().getName();

            if ("MANAGER".equals(role)) {

                if (!"EMPLOYEE".equals(employeeRole) ||
                        leave.getUser().getManager() == null ||
                        !leave.getUser()
                                .getManager()
                                .getId()
                                .equals(currentUser.getId())) {

                    throw new AccessDeniedException(
                            "Managers can only manage leaves from their team"
                    );
                }

            } else if ("HR".equals(role)) {

                if (!"MANAGER".equals(employeeRole)) {

                    throw new AccessDeniedException(
                            "HR can only manage Manager leaves"
                    );
                }

            } else if ("CEO".equals(role)) {

                if (!"HR".equals(employeeRole)) {

                    throw new AccessDeniedException(
                            "CEO can only manage HR leaves"
                    );
                }

            } else {

                throw new AccessDeniedException(
                        "You are not allowed to approve or reject this leave"
                );
            }

            if (status == LeaveStatus.REJECTED) {

                if (rejectionReason == null ||
                        rejectionReason.isBlank()) {

                    throw new IllegalArgumentException(
                            "Rejection reason is required"
                    );
                }

                leave.setRejectionReason(rejectionReason);

            } else {

                leave.setRejectionReason(null);
            }

            leave.setApprovedBy(currentUser);
            leave.setApprovedAt(LocalDateTime.now());
        }

        else {

            throw new IllegalArgumentException(
                    "Invalid status change"
            );
        }

        if (status == LeaveStatus.APPROVED &&
                Boolean.TRUE.equals(
                        leave.getLeaveType()
                                .getConsumesBalance()) )  {

            User employee = leave.getUser();

            employee.setAnnualLeaveBalance(
                    employee.getAnnualLeaveBalance()
                            - leave.getDuration()
            );

            userRepository.save(employee);
        }
//refund
        if (status == LeaveStatus.CANCELLED &&
                leave.getStatus() == LeaveStatus.APPROVED &&
                Boolean.TRUE.equals(
                        leave.getLeaveType()
                                .getConsumesBalance())) {

            User employee = leave.getUser();

            employee.setAnnualLeaveBalance(
                    employee.getAnnualLeaveBalance()
                            + leave.getDuration()
            );

            userRepository.save(employee);
        }

        leave.setStatus(status);
        leave.setUpdatedAt(LocalDateTime.now());

        Leave savedLeave = leaveRepository.save(leave);



        User employee = leave.getUser();

        String recipientEmail = null;

        if ("MANAGER".equals(employee.getRole().getName())) {

            recipientEmail = userRepository.findFirstByRole_Name("HR")
                    .map(User::getEmail)
                    .orElse(null);

        } else if (employee.getManager() != null) {

            recipientEmail = employee.getManager().getEmail();
        }

        emailService.sendLeaveDecisionEmail(
                employee.getEmail(),
                recipientEmail,
                employee.getFirstName() + " " + employee.getLastName().toUpperCase(),
                leave.getLeaveType().getCode(),
                leave.getStartDate().toString(),
                leave.getEndDate().toString(),
                leave.getDuration(),
                status.name(),
                leave.getRejectionReason(),
                currentUser.getFirstName() + " " + currentUser.getLastName(),
                leave.getDocumentPath()
        );


        return toResponse(savedLeave);
    }

    public List<LeaveResponse> findMyLeaves() {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        User currentUser =
                (User) authentication.getPrincipal();

        if (!authorizationService.hasPermission(
                currentUser, "LEAVE_READ_OWN")) {

            throw new AccessDeniedException(
                    "You do not have permission to view your leaves"
            );
        }

        return leaveRepository.findByUser(currentUser)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<LeaveResponse> findMyTeamLeaves() {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        User currentUser =
                (User) authentication.getPrincipal();

        if (!authorizationService.hasPermission(
                currentUser, "LEAVE_READ_TEAM")) {

            throw new AccessDeniedException(
                    "You do not have permission to view team leaves"
            );
        }

        return leaveRepository.findByUserManager(currentUser)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<LeaveResponse> findByDepartmentId(Long departmentId) {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        User currentUser =
                (User) authentication.getPrincipal();

        boolean canReadTeam =
                authorizationService.hasPermission(
                        currentUser,
                        "LEAVE_READ_TEAM"
                );

        boolean canReadAll =
                authorizationService.hasPermission(
                        currentUser,
                        "LEAVE_READ_ALL"
                );

        if (canReadAll) {

            return leaveRepository
                    .findAllByDepartmentId(departmentId)
                    .stream()
                    .map(this::toResponse)
                    .toList();
        }

        if (canReadTeam &&
                currentUser.getDepartment().getId()
                        .equals(departmentId)) {

            return leaveRepository
                    .findAllByDepartmentId(departmentId)
                    .stream()
                    .map(this::toResponse)
                    .toList();
        }

        throw new AccessDeniedException(
                "You do not have permission to view this department's leaves"
        );
    }

    private LeaveResponse toResponse(Leave leave) {

        return new LeaveResponse(
                leave.getId(),
                new LeaveUserResponse(
                        leave.getUser().getId(),
                        leave.getUser().getFirstName(),
                        leave.getUser().getLastName(),
                        leave.getUser().getEmail(),
                        leave.getUser().getDepartment().getName()
                ),
                leave.getLeaveType().getCode(),
                leave.getStartDate(),
                leave.getEndDate(),
                leave.getDuration(),
                leave.getReason(),
                leave.getRequestedAt(),
                leave.getUpdatedAt(),
                leave.getStatus(),
                leave.getApprovedBy() != null
                        ? leave.getApprovedBy().getId()
                        : null,
                leave.getApprovedAt(),
                leave.getRejectionReason(),
                leave.getDocumentName()
        );
    }

    //save leave doc
    private String saveDocument(MultipartFile document) {

        if (document == null || document.isEmpty()) {
            return null;
        }
        String contentType = document.getContentType();

        if (!"application/pdf".equals(contentType) &&
                !"image/jpeg".equals(contentType) &&
                !"image/png".equals(contentType)) {
            throw new IllegalArgumentException(
                    "Only PDF, JPG, JPEG and PNG files are allowed"
            );
        }

        if (document.getSize() > 5 * 1024 * 1024) {
            throw new IllegalArgumentException(
                    "Document size must not exceed 5 MB"
            );
        }

        try {
            Files.createDirectories(uploadDirectory);

            String originalFilename = document.getOriginalFilename();
            String extension = "";

            if (originalFilename != null &&
                    originalFilename.contains(".")) {
                extension = originalFilename.substring(
                        originalFilename.lastIndexOf(".")
                );
            }

            String storedFilename =
                    UUID.randomUUID() + extension;

            Path filePath =
                    uploadDirectory.resolve(storedFilename);

            Files.copy(
                    document.getInputStream(),
                    filePath
            );

            return filePath.toString();

        } catch (IOException exception) {
            throw new IllegalArgumentException(
                    "Failed to save document"
            );
        }
    }

    public List<LeaveResponse> findAllLeaves() {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        User currentUser =
                (User) authentication.getPrincipal();

        if (!authorizationService.hasPermission(
                currentUser, "LEAVE_READ_ALL")) {

            throw new AccessDeniedException(
                    "You do not have permission to view all leaves"
            );
        }

        return leaveRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }
}