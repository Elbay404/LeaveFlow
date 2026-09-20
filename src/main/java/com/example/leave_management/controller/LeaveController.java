package com.example.leave_management.controller;

import com.example.leave_management.dto.leave.LeaveRequest;
import com.example.leave_management.dto.leave.LeaveResponse;
import com.example.leave_management.enums.LeaveStatus;
import com.example.leave_management.service.LeaveService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/leaves")
@RequiredArgsConstructor
public class LeaveController {

    private final LeaveService leaveService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public LeaveResponse create(
            @RequestParam Long leaveTypeId,
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate,
            @RequestParam(required = false) String reason,
            @RequestParam(required = false) MultipartFile document
    ) {
        LeaveRequest request = new LeaveRequest(
                leaveTypeId,
                startDate,
                endDate,
                reason,
                document
        );

        return leaveService.create(request);
    }

    @PatchMapping("/{leaveId}/status")
    public LeaveResponse updateStatus(
            @PathVariable Long leaveId,
            @RequestParam LeaveStatus status,
            @RequestParam(required = false) String rejectionReason
    ) {
        return leaveService.updateStatus(
                leaveId,
                status,
                rejectionReason
        );
    }

    @GetMapping("/own_leave")
    public List<LeaveResponse> findMyLeaves() {
        return leaveService.findMyLeaves();
    }

    @GetMapping("/team")
    public List<LeaveResponse> findMyTeamLeaves() {
        return leaveService.findMyTeamLeaves();
    }

    @GetMapping("/all")
    public List<LeaveResponse> findAllLeaves() {
        return leaveService.findAllLeaves();
    }

    @GetMapping("/department/{departmentId}")
    public List<LeaveResponse> findByDepartmentId(
            @PathVariable Long departmentId
    ) {
        return leaveService.findByDepartmentId(departmentId);
    }
}