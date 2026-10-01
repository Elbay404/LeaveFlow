package com.example.leave_management.repository;

import com.example.leave_management.entity.Leave;
import com.example.leave_management.entity.User;
import com.example.leave_management.enums.LeaveStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface LeaveRepository extends JpaRepository<Leave, Long> {

    boolean existsByUserAndStatusInAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
            User user,
            List<LeaveStatus> statuses,
            LocalDate endDate,
            LocalDate startDate
    );

    @Modifying
    @Query("""
    UPDATE Leave l
    SET l.status = com.example.leave_management.enums.LeaveStatus.EXPIRED,
        l.updatedAt = CURRENT_TIMESTAMP
    WHERE l.status = com.example.leave_management.enums.LeaveStatus.PENDING
    AND l.startDate <= :today
""")
    void expirePendingLeaves(@Param("today") LocalDate today);

    List<Leave> findByUser(User user);
    List<Leave> findByUserManager(User manager);

    @Query(value = """
            SELECT l.*
            FROM leaves l
            JOIN users u ON l.user_id = u.id
            WHERE u.department_id = :departmentId
            """, nativeQuery = true)
    List<Leave> findAllByDepartmentId(
            @Param("departmentId") Long departmentId
    );

    List<Leave> findByStartDateLessThanEqualAndEndDateGreaterThanEqual(
            LocalDate endDate,
            LocalDate startDate
    );

    List<Leave> findByUserAndStatusAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
            User user,
            LeaveStatus status,
            LocalDate endDate,
            LocalDate startDate
    );

    List<Leave> findByStatusAndStartDateLessThanEqual(
            LeaveStatus status,
            LocalDate date
    );

}