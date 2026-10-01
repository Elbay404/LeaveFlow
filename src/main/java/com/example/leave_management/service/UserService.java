package com.example.leave_management.service;

import com.example.leave_management.dto.user.UserImportResponse;
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
import jakarta.transaction.Transactional;
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
import com.example.leave_management.dto.user.UserImportError;
import com.example.leave_management.dto.user.UserImportResponse;
import org.apache.poi.ss.usermodel.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;

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

    @Transactional
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
        LocalDate hireDate = request.hireDate();

        if (hireDate == null) {
            throw new IllegalArgumentException("Hire date is required");
        }

        boolean active = !hireDate.isAfter(LocalDate.now());

        User user = User.builder()
                .firstName(request.firstName())
                .lastName(request.lastName())
                .email(email)
                .ldapUid(ldapUid)
                .phone(request.phone())
                .birthDate(request.birthDate())
                .password(hashedPassword)
                .role(role)
                .department(department)
                .manager(manager)
                .active(active)
                .tokenVersion(0)
                .mustChangePassword(true)
                .hireDate(hireDate)
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


    public Page<UserResponse> findAll(String search, Pageable pageable) {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        User currentUser = (User) authentication.getPrincipal();

        if (!authorizationService.hasPermission(
                currentUser, "USER_READ")) {

            throw new AccessDeniedException(
                    "You do not have permission to view users");
        }

        Page<User> users;

        if (search == null || search.trim().isEmpty()) {
            users = userRepository.findAll(pageable);
        } else {
            users = userRepository.searchUsers(
                    search.trim(),
                    pageable
            );
        }

        return users.map(this::toResponse);
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

            LocalDate newHireDate = request.hireDate();

            user.setHireDate(newHireDate);

            if (newHireDate.isAfter(LocalDate.now())) {
                user.setActive(false);
                user.setTokenVersion(user.getTokenVersion() + 1);
            } else {
                user.setActive(true);
            }
        }

        if (request.birthDate() != null) {
            user.setBirthDate(request.birthDate());
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
                user.getBirthDate(),
                user.getAnnualLeaveBalance()
        );
    }


    /*private String generateUniqueEmail(String firstName, String lastName) {

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
    }*/

    private String generateUniqueEmail(String firstName, String lastName) {

        String cleanFirstName = cleanName(firstName);
        String cleanLastName = cleanName(lastName);

        String email =
                cleanFirstName + "." + cleanLastName + "@company.bm";

        if (!userRepository.existsByEmail(email)) {
            return email;
        }

        String lastLetter =
                cleanLastName.substring(cleanLastName.length() - 1);

        String repeatedLastName = cleanLastName;

        while (userRepository.existsByEmail(email)) {

            repeatedLastName += lastLetter;

            email =
                    cleanFirstName
                            + "."
                            + repeatedLastName
                            + "@company.bm";
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

    @Transactional
    public void resetPassword(
            Long id,
            String password,
            String confirmPassword
    ) {
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        User currentUser =
                (User) authentication.getPrincipal();

        if (!authorizationService.hasPermission(
                currentUser, "USER_UPDATE")) {

            throw new AccessDeniedException(
                    "You do not have permission to reset user passwords"
            );
        }

        if (!password.equals(confirmPassword)) {
            throw new IllegalArgumentException(
                    "Passwords do not match"
            );
        }

        User user = userRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found"
                        )
                );

        if (user.getLdapUid() == null ||
                user.getLdapUid().isBlank()) {

            throw new IllegalArgumentException(
                    "User does not have an LDAP account"
            );
        }

        ldapService.changePassword(
                user.getLdapUid(),
                password
        );

        user.setPassword(
                passwordEncoder.encode(password)
        );

        user.setMustChangePassword(false);

        user.setTokenVersion(
                user.getTokenVersion() + 1
        );

        userRepository.save(user);
    }


    public UserImportResponse importUsers(MultipartFile file) {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        User currentUser = (User) authentication.getPrincipal();

        if (!authorizationService.hasPermission(
                currentUser, "USER_CREATE")) {

            throw new AccessDeniedException(
                    "Only HR can import users");
        }

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException(
                    "Excel file is required");
        }

        String filename = file.getOriginalFilename();

        if (filename == null ||
                (!filename.toLowerCase().endsWith(".xlsx")
                        && !filename.toLowerCase().endsWith(".xls"))) {

            throw new IllegalArgumentException(
                    "Only Excel files are supported");
        }

        List<UserImportError> errors = new ArrayList<>();
        int totalRows = 0;
        int successCount = 0;

        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
//try to closes the workbook
            Sheet sheet = workbook.getSheetAt(0);//get first sheet

            if (sheet.getPhysicalNumberOfRows() <= 1) {
                throw new IllegalArgumentException(
                        "The Excel file contains no users");
            }

            Row header = sheet.getRow(0);

            validateHeaders(header);

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {

                Row row = sheet.getRow(i);

                if (row == null || isEmptyRow(row)) {
                    continue;
                }

                totalRows++;

                int excelRow = i + 1;

                try {

                    String firstName = getCellValue(row.getCell(0));
                    String lastName = getCellValue(row.getCell(1));
                    String phone = getCellValue(row.getCell(2));
                    String roleName = getCellValue(row.getCell(3));
                    String departmentName = getCellValue(row.getCell(4));
                    String hireDateValue = getCellValue(row.getCell(5));
                    String birthDateValue = getCellValue(row.getCell(6));

                    if (firstName.isBlank()) {
                        throw new IllegalArgumentException(
                                "First Name is required");
                    }

                    if (lastName.isBlank()) {
                        throw new IllegalArgumentException(
                                "Last Name is required");
                    }

                    if (!phone.matches("\\d{8}")) { // \\d : digit
                        throw new IllegalArgumentException(
                                "Phone must contain exactly 8 digits");
                    }

                    if (roleName.isBlank()) {
                        throw new IllegalArgumentException(
                                "Role is required");
                    }

                    if (departmentName.isBlank()) {
                        throw new IllegalArgumentException(
                                "Department is required");
                    }

                    if (hireDateValue.isBlank()) {
                        throw new IllegalArgumentException(
                                "Hire Date is required");
                    }

                    if (birthDateValue.isBlank()) {
                        throw new IllegalArgumentException(
                                "Birth Date is required");
                    }

                    Role role = roleRepository
                            .findByNameIgnoreCase(roleName)
                            .orElseThrow(() ->
                                    new ResourceNotFoundException(
                                            "Role not found: " + roleName));

                    Department department = departmentRepository
                            .findByNameIgnoreCase(departmentName)
                            .orElseThrow(() ->
                                    new ResourceNotFoundException(
                                            "Department not found: "
                                                    + departmentName));

                    LocalDate hireDate =
                            parseExcelDate(hireDateValue);

                    LocalDate birthDate =
                            parseExcelDate(birthDateValue);



                    if (birthDate.isAfter(LocalDate.now())) {
                        throw new IllegalArgumentException(
                                "Birth Date cannot be in the future");
                    }

                    UserRequest request = new UserRequest(
                            firstName,
                            lastName,
                            phone,
                            role.getId(),
                            department.getId(),
                            hireDate,
                            birthDate,
                            true
                    );

                    create(request);

                    successCount++;

                } catch (Exception e) {

                    errors.add(
                            new UserImportError(
                                    excelRow,
                                    e.getMessage() != null
                                            ? e.getMessage()
                                            : "Unable to import user"
                            )
                    );
                }
            }

        } catch (IOException e) {

            throw new IllegalArgumentException(
                    "Unable to read the Excel file");
        }

        return new UserImportResponse(
                totalRows,
                successCount,
                errors.size(),
                errors
        );
    }

    private void validateHeaders(Row header) {

        if (header == null) {
            throw new IllegalArgumentException(
                    "Excel header row is missing");
        }

        String[] expectedHeaders = {
                "First Name",
                "Last Name",
                "Phone",
                "Role",
                "Department",
                "Hire Date",
                "Birth Date"
        };

        for (int i = 0; i < expectedHeaders.length; i++) {

            String actual =
                    getCellValue(header.getCell(i));

            if (!expectedHeaders[i]
                    .equalsIgnoreCase(actual.trim())) {

                throw new IllegalArgumentException(
                        "Invalid Excel header at column "
                                + (i + 1)
                                + ". Expected: "
                                + expectedHeaders[i]);
            }
        }
    }
    private String getCellValue(Cell cell) {

        if (cell == null) {
            return "";
        }

        DataFormatter formatter = new DataFormatter();

        return formatter
                .formatCellValue(cell)
                .trim();
    }

    private boolean isEmptyRow(Row row) {

        for (int i = 0; i < 7; i++) {

            if (!getCellValue(row.getCell(i)).isBlank()) {
                return false;
            }
        }

        return true;
    }
    private LocalDate parseExcelDate(String value) {

        try {

            return LocalDate.parse(
                    value,
                    DateTimeFormatter.ISO_LOCAL_DATE
            );

        } catch (DateTimeParseException e) {

            throw new IllegalArgumentException(
                    "Date must use YYYY-MM-DD format");
        }
    }


}