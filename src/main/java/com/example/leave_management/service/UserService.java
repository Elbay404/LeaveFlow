package com.example.leave_management.service;

import com.example.leave_management.dto.user.UserRequest;
import com.example.leave_management.dto.user.UserResponse;
import com.example.leave_management.entity.Department;
import com.example.leave_management.entity.Role;
import com.example.leave_management.entity.User;
import com.example.leave_management.exception.DuplicateResourceException;
import com.example.leave_management.exception.ResourceNotFoundException;
import com.example.leave_management.repository.DepartmentRepository;
import com.example.leave_management.repository.RoleRepository;
import com.example.leave_management.repository.UserRepository;
import com.example.leave_management.security.AuthorizationService;
import lombok.RequiredArgsConstructor;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import com.example.leave_management.dto.user.CurrentUserResponse;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.text.Normalizer;
import java.time.LocalDate;


@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final DepartmentRepository departmentRepository;
    private final PasswordService passwordService;
    private final PasswordEncoder passwordEncoder;
    private final AuthorizationService authorizationService;
    private final EmailService emailService;
    private final LdapService ldapService;


    public UserResponse create(UserRequest request) {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        User currentUser = (User) authentication.getPrincipal();

        if (!authorizationService.hasPermission(
                currentUser, "USER_CREATE")) {

            throw new AccessDeniedException(
                    "Only HR can create users");
        }

        String email = generateUniqueEmail(
                request.firstName(),
                request.lastName()
        );

        String ldapUid = email.substring(
                0,
                email.indexOf("@")
        );


        Department department =
                departmentRepository.findById(request.departmentId())
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Department not found"));

        Role role =
                roleRepository.findById(request.roleId())
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Role not found"));


        if (role.getName().equals("MANAGER")
                && userRepository.existsByDepartmentAndRole_Name(
                department, "MANAGER")) {

            throw new DuplicateResourceException(
                    "This department already has a manager");
        }

        String temporaryPassword =
                passwordService.generateTemporaryPassword();

        ldapService.createUser(
                ldapUid,
                request.firstName(),
                request.lastName(),
                email,
                temporaryPassword
        );

        String hashedPassword =
                passwordEncoder.encode(temporaryPassword);

        User manager = null;

        if (role.getName().equals("MANAGER")) {
            manager = currentUser;
        }

        if (role.getName().equals("EMPLOYEE")) {

            manager = userRepository
                    .findByDepartmentAndRole_Name(
                            department, "MANAGER")
                    .orElseThrow(() ->
                            new ResourceNotFoundException(
                                    "No manager found for this department"));
        }

        User user = User.builder()
                .firstName(request.firstName())
                .lastName(request.lastName())
                .email(email)
                .ldapUid(ldapUid)
                .phone(request.phone())
                .password(hashedPassword)
                .role(role)
                .department(department)
                .manager(manager)
                .active(true)
                .mustChangePassword(true)
                .hireDate(LocalDate.now())
                .annualLeaveBalance(0)
                .build();

        User savedUser = userRepository.save(user);

        emailService.sendAccountCredentials(
                savedUser.getEmail(),
                savedUser.getFirstName(),
                temporaryPassword,
                savedUser.getRole().getName(),
                savedUser.getDepartment().getName()
        );

        return toResponse(savedUser);
    }


    public Page<UserResponse> findAll(Pageable pageable) {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        User currentUser = (User) authentication.getPrincipal();

        if (!authorizationService.hasPermission(
                currentUser, "USER_READ")) {

            throw new AccessDeniedException(
                    "You do not have permission to view users");
        }

        return userRepository.findAll(pageable)
                .map(this::toResponse);
    }


    public UserResponse findById(Long id) {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        User currentUser = (User) authentication.getPrincipal();

        if (!authorizationService.hasPermission(
                currentUser, "USER_READ")) {

            throw new AccessDeniedException(
                    "You do not have permission to view users");
        }

        User user = userRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found"));

        return toResponse(user);
    }


    public UserResponse update(Long id, UserRequest request) {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        User currentUser = (User) authentication.getPrincipal();

        if (!authorizationService.hasPermission(
                currentUser, "USER_UPDATE")) {

            throw new AccessDeniedException(
                    "Only HR can update users");
        }

        User user = userRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found"));

        boolean roleChanged =
                request.roleId() != null
                        && !request.roleId().equals(user.getRole().getId());

        boolean departmentChanged =
                request.departmentId() != null
                        && !request.departmentId().equals(user.getDepartment().getId());

/*
        boolean nameChanged =
                !user.getFirstName().equals(request.firstName())
                        || !user.getLastName().equals(request.lastName());

        String email = user.getEmail();

        if (nameChanged) {
            email = generateUniqueEmail(
                    request.firstName(),
                    request.lastName()
            );
        }  */

        Department department = user.getDepartment();

        if (request.departmentId() != null) {
            department = departmentRepository.findById(request.departmentId())
                    .orElseThrow(() ->
                            new ResourceNotFoundException(
                                    "Department not found"));
        }

        Role role = user.getRole();

        if (request.roleId() != null) {
            role = roleRepository.findById(request.roleId())
                    .orElseThrow(() ->
                            new ResourceNotFoundException(
                                    "Role not found"));
        }

        if (role.getName().equals("MANAGER")
                && (roleChanged || departmentChanged)) {

            boolean anotherManagerExists =
                    userRepository
                            .findByDepartmentAndRole_Name(
                                    department, "MANAGER")
                            .filter(existingManager ->
                                    !existingManager.getId()
                                            .equals(user.getId()))
                            .isPresent();

            if (anotherManagerExists) {

                throw new DuplicateResourceException(
                        "This department already has a manager");
            }
        }

        if (request.active() != null) {
            boolean isDeactivated =
                    user.isActive() && !request.active();

            user.setActive(request.active());

            if (isDeactivated) {
                user.setTokenVersion(user.getTokenVersion() + 1);
            }
        }

        if (request.firstName() != null) {
            user.setFirstName(request.firstName());
        }

        if (request.lastName() != null) {
            user.setLastName(request.lastName());
        }

        if (request.phone() != null) {
            user.setPhone(request.phone());
        }
        if (request.hireDate() != null) {
            user.setHireDate(request.hireDate());
        }

        user.setRole(role);
        user.setDepartment(department);

        if (roleChanged || departmentChanged) {

            if (role.getName().equals("MANAGER")) {

                user.setManager(currentUser);

            } else if (role.getName().equals("EMPLOYEE")) {

                User manager =
                        userRepository
                                .findByDepartmentAndRole_Name(
                                        department, "MANAGER")
                                .orElseThrow(() ->
                                        new ResourceNotFoundException(
                                                "No manager found for this department"));

                user.setManager(manager);

            } else {

                user.setManager(null);
            }
        }

        User updatedUser = userRepository.save(user);

        return toResponse(updatedUser);
    }


    private UserResponse toResponse(User user) {

        return new UserResponse(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getPhone(),
                user.isActive(),
                user.isMustChangePassword(),
                user.getRole().getName(),
                user.getDepartment().getName(),
                user.getHireDate(),
                user.getAnnualLeaveBalance()
        );
    }


    private String generateUniqueEmail(String firstName, String lastName) {

        String cleanFirstName = cleanName(firstName);

        String cleanLastName = cleanName(lastName);

        String baseEmail = cleanFirstName
                        + "_"
                        + cleanLastName
                        + "@company.bm";

        String email = baseEmail;

        int counter = 2;

        while (userRepository.existsByEmail(email)) {

            email = cleanFirstName
                    + "."
                    + cleanLastName
                    + counter
                    + "@company.bm";

            counter++;
        }

        return email;
    }


    private String cleanName(String name) {

        return Normalizer.normalize(
                        name,
                        Normalizer.Form.NFD
                )
                .replaceAll("\\p{M}", "") //rm accents
                .toLowerCase()
                .replaceAll("[^a-z0-9]", "");
    }

    public CurrentUserResponse getCurrentUser() {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        User user = (User) authentication.getPrincipal();

        return new CurrentUserResponse(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getPhone(),
                user.isActive(),
                user.isMustChangePassword(),
                user.getRole().getName(),
                user.getDepartment().getName(),
                user.getManager() != null
                        ? user.getManager().getId()
                        : null,
                user.getManager() != null
                        ? user.getManager().getFirstName()
                        : null,
                user.getManager() != null
                        ? user.getManager().getLastName()
                        : null,
                user.getManager() != null
                        ? user.getManager().getEmail()
                        : null,
                user.getHireDate(),
                user.getAnnualLeaveBalance()
        );
    }


}