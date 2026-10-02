package com.example.leave_management.entity;


import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import lombok.*;
import org.hibernate.envers.Audited;
import org.hibernate.envers.NotAudited;

import java.time.LocalDate;

@Entity
@Audited
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String firstName;

    @Column(nullable = false)
    private String lastName;

    @Column(nullable = false, unique = true)
    @Email
    private String email;

    @NotAudited
    @Column(nullable = false)
    private String password;

    private String phone;

    @Column(nullable = false)
    private boolean active = true;

    @Column(nullable = false)
    private boolean mustChangePassword = true;
    @Column(name = "birth_date")
    private LocalDate birthDate;

    @ManyToOne
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    @ManyToOne
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    @ManyToOne
    @JoinColumn(name = "manager_id")
    private User manager;

    @Column(name = "ldap_uid", unique = true, nullable = false)
    private String ldapUid;

    @Column(name = "hire_date", nullable = false)
    private LocalDate hireDate;

    @Column(name = "annual_leave_balance", nullable = false)
    private Integer annualLeaveBalance;

    @NotAudited
    @Column(name = "token_version", nullable = false)
    private Integer tokenVersion = 0;
}