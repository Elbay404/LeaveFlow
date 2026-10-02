package com.example.leave_management.audit;

import com.example.leave_management.entity.User;
import org.hibernate.envers.RevisionListener;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public class AuditRevisionListener implements RevisionListener {

    @Override
    public void newRevision(Object revisionEntity) {

        AuditRevisionEntity revision = (AuditRevisionEntity) revisionEntity;

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            revision.setUsername("SYSTEM");
            return;
        } //for automatic operations

        Object principal = authentication.getPrincipal();

        if (principal instanceof User user) {
            revision.setUsername(user.getEmail());
        } else {
            revision.setUsername(authentication.getName());
        }
    }
}