package com.example.leave_management.repository;

import com.example.leave_management.entity.Leave;
import com.example.leave_management.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface LeaveRepository extends JpaRepository<Leave, Long> {

    boolean existsByUserAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
            User user,
            LocalDate endDate,
            LocalDate startDate
    );

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

}