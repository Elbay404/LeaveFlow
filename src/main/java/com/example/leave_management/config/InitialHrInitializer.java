package com.example.leave_management.config;

import com.example.leave_management.entity.Department;
import com.example.leave_management.entity.Role;
import com.example.leave_management.entity.User;
import com.example.leave_management.repository.DepartmentRepository;
import com.example.leave_management.repository.RoleRepository;
import com.example.leave_management.repository.UserRepository;
import com.example.leave_management.service.EmailService;
import com.example.leave_management.service.LdapService;
import com.example.leave_management.service.PasswordService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Slf4j
@Component
@RequiredArgsConstructor
public class InitialHrInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final RoleRepository roleRepository;
    private final PasswordService passwordService;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    private final LdapService ldapService;

    @Override
    public void run(String... args) {

        Role hrRole = roleRepository.findByName("HR")
                .orElseThrow(() ->
                        new IllegalStateException("HR role not found"));

        if (userRepository.existsByRole(hrRole)) {
            return;
        }

        Department department = departmentRepository
                .findByName("Administration")
                .orElseGet(() -> {
                    Department newDepartment = Department.builder()
                            .name("Administration")
                            .description("Administrative department")
                            .build();

                    return departmentRepository.save(newDepartment);
                });

        String temporaryPassword =
                passwordService.generateTemporaryPassword();

        String hashedPassword =
                passwordEncoder.encode(temporaryPassword);

        User hr = User.builder()
                .firstName("System")
                .lastName("Administrator")
                .email("admin@company.com")
                .ldapUid("admin")
                .password(hashedPassword)
                .role(hrRole)
                .department(department)
                .active(true)
                .mustChangePassword(true)
                .hireDate(LocalDate.now())
                .annualLeaveBalance(0)
                .build();


        ldapService.createUser(
                hr.getLdapUid(),
                hr.getFirstName(),
                hr.getLastName(),
                hr.getEmail(),
                temporaryPassword
        );

        User savedHr = userRepository.save(hr);

        emailService.sendAccountCredentials(
                savedHr.getEmail(),
                savedHr.getFirstName(),
                temporaryPassword,
                savedHr.getRole().getName(),
                savedHr.getDepartment().getName()
        );

        log.info("Initial HR account created: {}", savedHr.getEmail());
    }
}