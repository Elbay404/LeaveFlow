package com.example.leave_management.audit;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final JdbcTemplate jdbcTemplate;

    public List<AuditDetailResponse> getEntityHistory(
            String entityType,
            Long entityId
    ) {

        String auditTable = getAuditTable(entityType);

        String sql = """
                SELECT a.*, r.username, r.revtstmp
                FROM %s a
                JOIN revinfo r ON r.rev = a.rev
                WHERE a.id = ?
                ORDER BY a.rev
                """.formatted(auditTable);

        List<Map<String, Object>> rows =
                jdbcTemplate.queryForList(sql, entityId);

        List<AuditDetailResponse> result = new ArrayList<>();

        for (int i = 0; i < rows.size(); i++) {

            Map<String, Object> current = rows.get(i);

            Map<String, Object> previous =
                    i > 0 ? rows.get(i - 1) : null;

            int revisionType =
                    ((Number) current.get("revtype")).intValue();

            List<AuditChange> changes =
                    compareRows(
                            entityType,
                            previous,
                            current,
                            revisionType
                    );

            Number revision =
                    (Number) current.get("rev");

            Number timestamp =
                    (Number) current.get("revtstmp");

            LocalDateTime dateTime =
                    LocalDateTime.ofInstant(
                            Instant.ofEpochMilli(
                                    timestamp.longValue()
                            ),
                            ZoneId.systemDefault()
                    );

            result.add(
                    new AuditDetailResponse(
                            entityType.toUpperCase(),
                            entityId,
                            getAction(revisionType),
                            (String) current.get("username"),
                            dateTime,
                            revision,
                            changes
                    )
            );
        }

        return result;
    }

    private List<AuditChange> compareRows(
            String entityType,
            Map<String, Object> previous,
            Map<String, Object> current,
            int revisionType
    ) {

        List<AuditChange> changes = new ArrayList<>();

        for (String column : current.keySet()) {

            if (isTechnicalColumn(column)) {
                continue;
            }

            Object oldValue =
                    previous == null
                            ? null
                            : previous.get(column);

            Object newValue =
                    revisionType == 2
                            ? null
                            : current.get(column);

            String oldString =
                    formatValue(
                            entityType,
                            column,
                            oldValue
                    );

            String newString =
                    formatValue(
                            entityType,
                            column,
                            newValue
                    );

            if (!Objects.equals(oldString, newString)) {

                changes.add(
                        new AuditChange(
                                formatFieldName(column),
                                oldString,
                                newString
                        )
                );
            }
        }

        return changes;
    }

    private boolean isTechnicalColumn(String column) {

        return column.equals("id")
                || column.equals("rev")
                || column.equals("revtype")
                || column.equals("username")
                || column.equals("revtstmp");
    }

    private String getAuditTable(String entityType) {

        return switch (entityType.toUpperCase()) {

            case "USER" -> "users_aud";

            case "ROLE" -> "roles_aud";

            case "DEPARTMENT" -> "departments_aud";

            case "LEAVE_TYPE" -> "leave_types_aud";

            case "LEAVE" -> "leaves_aud";

            default ->
                    throw new IllegalArgumentException(
                            "Unsupported audit entity: " + entityType
                    );
        };
    }

    private String getAction(int revisionType) {

        return switch (revisionType) {

            case 0 -> "CREATED";

            case 1 -> "UPDATED";

            case 2 -> "DELETED";

            default -> "UNKNOWN";
        };
    }

    private String formatFieldName(String column) {

        return switch (column) {

            case "first_name" -> "First Name";

            case "last_name" -> "Last Name";

            case "email" -> "Email";

            case "phone" -> "Phone";

            case "active" -> "Active";

            case "must_change_password" ->
                    "Must Change Password";

            case "birth_date" -> "Birth Date";

            case "role_id" -> "Role";

            case "department_id" -> "Department";

            case "manager_id" -> "Manager";

            case "ldap_uid" -> "LDAP UID";

            case "hire_date" -> "Hire Date";

            case "annual_leave_balance" ->
                    "Annual Leave Balance";

            case "name" -> "Name";

            case "description" -> "Description";

            case "code" -> "Code";

            case "consumes_balance" ->
                    "Consumes Balance";

            case "requires_document" ->
                    "Requires Document";

            case "max_days" ->
                    "Maximum Days";

            case "leave_type_id" ->
                    "Leave Type";

            case "user_id" ->
                    "Employee";

            case "start_date" ->
                    "Start Date";

            case "end_date" ->
                    "End Date";

            case "duration" ->
                    "Duration";

            case "reason" ->
                    "Reason";

            case "requested_at" ->
                    "Requested At";

            case "updated_at" ->
                    "Updated At";

            case "approved_by" ->
                    "Approved By";

            case "approved_at" ->
                    "Approved At";

            case "rejection_reason" ->
                    "Rejection Reason";

            case "document_name" ->
                    "Document Name";

            case "document_path" ->
                    "Document Path";

            case "status" ->
                    "Status";

            default ->
                    column;
        };
    }

    private String formatValue(
            String entityType,
            String column,
            Object value
    ) {

        if (value == null) {
            return null;
        }

        if (isRelationshipColumn(column)) {
            return formatRelationshipValue(
                    column,
                    value
            );
        }

        return String.valueOf(value);
    }

    private boolean isRelationshipColumn(String column) {

        return column.equals("role_id")
                || column.equals("department_id")
                || column.equals("manager_id")
                || column.equals("approved_by")
                || column.equals("user_id")
                || column.equals("leave_type_id");
    }

    private String formatRelationshipValue(
            String column,
            Object value
    ) {

        Long id = ((Number) value).longValue();

        return switch (column) {

            case "role_id" ->
                    findRoleName(id);

            case "department_id" ->
                    findDepartmentName(id);

            case "manager_id",
                 "approved_by",
                 "user_id" ->
                    findUserName(id);

            case "leave_type_id" ->
                    findLeaveTypeName(id);

            default ->
                    String.valueOf(value);
        };
    }

    private String findRoleName(Long id) {

        return jdbcTemplate.query(
                "SELECT name FROM roles WHERE id = ?",
                rs -> rs.next()
                        ? rs.getString("name")
                        : "Deleted Role #" + id,
                id
        );
    }

    private String findDepartmentName(Long id) {

        return jdbcTemplate.query(
                "SELECT name FROM departments WHERE id = ?",
                rs -> rs.next()
                        ? rs.getString("name")
                        : "Deleted Department #" + id,
                id
        );
    }

    private String findUserName(Long id) {

        return jdbcTemplate.query(
                """
                SELECT first_name, last_name
                FROM users
                WHERE id = ?
                """,
                rs -> {

                    if (!rs.next()) {
                        return "Deleted User #" + id;
                    }

                    String firstName =
                            rs.getString("first_name");

                    String lastName =
                            rs.getString("last_name");

                    return firstName + " " + lastName;
                },
                id
        );
    }

    private String findLeaveTypeName(Long id) {

        return jdbcTemplate.query(
                "SELECT name FROM leave_types WHERE id = ?",
                rs -> rs.next()
                        ? rs.getString("name")
                        : "Deleted Leave Type #" + id,
                id
        );
    }

    public List<AuditResponse> getAllAuditLogs() {

        String sql = """
            SELECT
                'USER' AS entity_type,
                a.id AS entity_id,
                a.rev,
                a.revtype,
                r.username,
                r.revtstmp
            FROM users_aud a
            JOIN revinfo r ON r.rev = a.rev

            UNION ALL

            SELECT
                'ROLE' AS entity_type,
                a.id AS entity_id,
                a.rev,
                a.revtype,
                r.username,
                r.revtstmp
            FROM roles_aud a
            JOIN revinfo r ON r.rev = a.rev

            UNION ALL

            SELECT
                'DEPARTMENT' AS entity_type,
                a.id AS entity_id,
                a.rev,
                a.revtype,
                r.username,
                r.revtstmp
            FROM departments_aud a
            JOIN revinfo r ON r.rev = a.rev

            UNION ALL

            SELECT
                'LEAVE_TYPE' AS entity_type,
                a.id AS entity_id,
                a.rev,
                a.revtype,
                r.username,
                r.revtstmp
            FROM leave_types_aud a
            JOIN revinfo r ON r.rev = a.rev

            UNION ALL

            SELECT
                'LEAVE' AS entity_type,
                a.id AS entity_id,
                a.rev,
                a.revtype,
                r.username,
                r.revtstmp
            FROM leaves_aud a
            JOIN revinfo r ON r.rev = a.rev

            ORDER BY rev DESC
            """;

        List<Map<String, Object>> rows =
                jdbcTemplate.queryForList(sql);

        List<AuditResponse> result = new ArrayList<>();

        for (Map<String, Object> row : rows) {

            Number revision =
                    (Number) row.get("rev");

            Number revisionType =
                    (Number) row.get("revtype");

            Number timestamp =
                    (Number) row.get("revtstmp");

            LocalDateTime dateTime =
                    LocalDateTime.ofInstant(
                            Instant.ofEpochMilli(
                                    timestamp.longValue()
                            ),
                            ZoneId.systemDefault()
                    );

            result.add(
                    new AuditResponse(
                            (String) row.get("entity_type"),
                            ((Number) row.get("entity_id")).longValue(),
                            getAction(revisionType.intValue()),
                            (String) row.get("username"),
                            dateTime,
                            revision
                    )
            );
        }

        return result;
    }

}