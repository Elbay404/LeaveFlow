package com.example.leave_management.audit;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.envers.RevisionEntity;
import org.hibernate.envers.RevisionNumber;
import org.hibernate.envers.RevisionTimestamp;

@Entity
@Table(name = "revinfo")
@RevisionEntity(AuditRevisionListener.class)
@Getter
@Setter
public class AuditRevisionEntity {

    @Id
    @RevisionNumber
    @GeneratedValue(
            strategy = GenerationType.SEQUENCE,
            generator = "revinfo_generator"
    )
    @SequenceGenerator(
            name = "revinfo_generator",
            sequenceName = "revinfo_seq",
            allocationSize = 50
    )
    @Column(name = "rev")
    private int id;

    @RevisionTimestamp
    @Column(name = "revtstmp")
    private long timestamp;

    @Column(name = "username")
    private String username;
}