# LeaveFlow — Company Leave Management System

**LeaveFlow** is a full-stack leave-management platform designed to centralize employee leave requests, approval workflows, leave balances, organizational administration, notifications, and audit history. Its role-aware workspace supports **Employees, Managers, and HR** through a unified interface, while the Spring Boot backend enforces access control and business rules.

> **Project documentation:** This README describes the architecture and functionality established during development. Confirm environment-specific settings, repository paths, and endpoint mappings against the latest source before deploying.

---

## Table of Contents

- [Overview](#overview)
- [Key Highlights](#key-highlights)
- [Features](#features)
- [Roles and Access Control](#roles-and-access-control)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Authentication and Security](#authentication-and-security)
- [LDAP Integration](#ldap-integration)
- [Database Management with Liquibase](#database-management-with-liquibase)
- [Leave Workflow and Business Rules](#leave-workflow-and-business-rules)
- [Audit Trail](#audit-trail)
- [Notifications and Email](#notifications-and-email)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Configuration](#configuration)
- [Run Locally](#run-locally)
- [API Overview](#api-overview)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## Overview

LeaveFlow provides a central workspace for managing employee absences and the approval process around them. Employees can submit and track leave requests, managers can review requests within their authorization scope, and HR can manage users and organizational configuration.

The application uses a **single role-aware dashboard** rather than separate frontends for each role. The interface adapts its navigation and available actions to the user's permissions; the backend independently validates access to protected operations and data.

## Key Highlights

- **Role-based access control (RBAC):** roles, modules, permissions, and role-permission assignments.
- **End-to-end leave lifecycle:** submission, approval, rejection, cancellation, expiration, conflict detection, and balance handling.
- **LDAP integration:** directory-service integration for supported identity and password-reset workflows.
- **Versioned database schema:** Liquibase changelogs manage database structure and incremental changes.
- **Auditable changes:** Hibernate Envers records revisions for selected entities.
- **Real-time notifications:** persistent PostgreSQL notifications with REST endpoints and WebSocket/STOMP delivery.
- **Scheduled processing:** pending-leave expiration, monthly balance accrual, and year-end balance reset.
- **Security controls:** JWT cookie-based authentication, BCrypt password hashing, permission checks, and rate limiting.

## Features

### Leave management
- Submit, view, and track leave requests.
- Approve or reject requests according to the configured workflow.
- Cancel eligible requests and handle applicable balance refunds.
- Calculate leave duration using working days and configured holidays.
- Detect overlapping requests and prevent conflicting leave periods.
- Upload and view supporting documents when required by the leave type.
- Automatically expire pending requests whose start date arrives without approval.

### Leave balances and calendar
- Track annual leave balances.
- Process scheduled monthly accrual and year-end balance reset.
- Manage holidays used in working-day calculations.
- Display leave and holiday events in a calendar.
- Review employee availability information.

### User and organization administration
- Manage users, departments, roles, permissions, and leave types.
- Maintain manager-to-employee relationships.
- Bulk-import users from Excel.
- Support future hire dates while keeping future-hire users inactive.
- Manage account activation and the `mustChangePassword` state.

### Dashboard and user experience
- Unified dashboard for Employees, Managers, and HR.
- Permission-aware sidebar navigation and actions.
- Dashboard statistics and charts.
- Shared application shell, reusable API utilities, and protected routes.
- Responsive pages for administration, leave management, calendar, and settings.

### Notifications and audit
- Persist notifications and retrieve all, unread, or unread-count data.
- Mark individual notifications or all notifications as read.
- Deliver notifications in real time through WebSocket/STOMP.
- Review entity revisions and field-level changes where historical data exists.

## Roles and Access Control

| Role | Typical responsibilities |
|---|---|
| **Employee** | Submit and track personal leave requests and view personal leave information. |
| **Manager** | Review requests and access team information within the assigned permission scope. |
| **HR** | Administer users and organizational configuration, oversee leave management, and access audit history when granted the relevant permission. |

Authorization is based on role, module, and permission records rather than relying exclusively on hard-coded role checks. Permission assignments and team-level access are controlled by the backend.

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | Next.js App Router, React, TypeScript, Tailwind CSS |
| Backend | Java 21, Spring Boot, Maven |
| Database | PostgreSQL |
| ORM and persistence | Spring Data JPA, Hibernate |
| Schema migrations | **Liquibase** |
| Authentication and identity integration | JWT cookies, LDAP integration |
| Password hashing | BCrypt |
| Authorization | Roles, modules, permissions, role-permission assignments |
| Audit history | Hibernate Envers |
| Real-time messaging | WebSocket, STOMP, Spring Messaging |
| Rate limiting | Bucket4j |
| Email | Spring email integration |
| Icons | Lucide React |

## Architecture

```text
┌───────────────────────────────┐
│         Web Browser           │
└───────────────┬───────────────┘
                │
                ▼
┌───────────────────────────────┐
│      Next.js / React UI       │
│ Pages · Route Guards · UI     │
│ Shared API utilities          │
└───────────────┬───────────────┘
                │ HTTP / REST
                ▼
┌───────────────────────────────┐
│       Spring Boot API         │
│ Authentication & RBAC         │
│ Users · Leaves · Balances     │
│ Notifications · Audit         │
│ Scheduled services            │
└───────┬───────────┬───────────┘
        │           │
        ▼           ▼
┌──────────────┐  ┌────────────────────┐
│ PostgreSQL   │  │ External services  │
│ Application  │  │ LDAP / SMTP, as    │
│ data + audit │  │ configured         │
└──────────────┘  └────────────────────┘

       Browser ◄── WebSocket / STOMP ──► API
```

The frontend provides the user experience and route-level protection. **Backend authorization is the security boundary**: hiding a page or action in the UI does not replace server-side permission checks.

## Authentication and Security

Security mechanisms discussed and implemented in the project include:

- JWT authentication using an HTTP cookie.
- BCrypt password hashing.
- Role- and permission-based authorization.
- Account activation and token-version invalidation where applicable.
- Password-change and password-reset workflows.
- CORS configuration for the frontend origin.
- Rate limiting for sensitive operations such as login.
- Permission checks before serving protected leave documents.
- `AUDIT_READ` permission checks for audit endpoints.
- Exclusion of sensitive values such as passwords and token versions from audit history.

### Rate limiting considerations

The login limiter uses a bucket keyed by client IP, creating a bucket when an IP is first encountered. A development example discussed during implementation allowed five attempts per minute per IP.

In production, configure trusted reverse-proxy handling before relying on forwarded IP headers. Do not blindly trust arbitrary `X-Forwarded-For` values; account-based limits can complement IP-based limits.

## LDAP Integration

LeaveFlow includes **LDAP directory-service integration** for supported identity and password-reset workflows. LDAP connection settings should be supplied through backend configuration rather than hard-coded in source code.

Typical configuration areas include:

| Setting | Purpose |
|---|---|
| LDAP server URL | Address of the directory service |
| Base DN | Directory subtree used for lookups |
| Bind DN / service account | Identity used for directory operations, if required |
| Bind password | Secret for the service account, if required |
| User lookup attributes | Directory attributes used to identify users |

Use the exact property names expected by the current backend configuration. Store bind credentials in environment variables or a secret manager, and never commit real credentials to source control.

**Scope note:** LDAP behavior depends on the current configuration and implementation. Verify which authentication and password-reset operations use LDAP before describing it as the sole authentication provider.

## Database Management with Liquibase

**Liquibase** manages version-controlled, incremental database schema changes. Database changes are represented as changelogs and recorded in Liquibase's tracking tables, allowing environments to apply migrations in a controlled order.

The project database includes application tables for users, roles, departments, permissions, leave requests, leave types, and notifications. Hibernate Envers also uses revision metadata and audit tables for audited entities.

### Migration practices

1. Keep changelogs under version control.
2. Add a **new changeset** for a new schema change instead of editing a changeset that has already been applied.
3. Review migration output and database state when a migration fails.
4. Test migrations against a development database before applying them to a shared or production environment.
5. Back up important data before performing schema operations.
6. Do not drop audit tables, reset revision history, or bypass checksum validation in production as a routine fix.

### Liquibase and Hibernate Envers

Liquibase manages the schema changes, while Hibernate Envers records entity revisions at runtime. The Envers setup includes a revision metadata table (`revinfo`) and entity audit tables such as `users_aud` and `leaves_aud`.

The revision sequence and table definitions must remain compatible with the Hibernate/Envers configuration. If a migration reports a checksum mismatch, investigate the changeset history rather than modifying applied migrations blindly.

## Leave Workflow and Business Rules

The following summarizes the workflow established during development. Confirm it against the current implementation and applicable company policy before treating it as formal HR policy.

| Status | Blocks conflicting dates? | Balance effect |
|---|---:|---|
| `PENDING` | Yes | No consumption until approval |
| `APPROVED` | Yes | Consumes balance where applicable |
| `REJECTED` | No | No consumption |
| `CANCELLED` | No | Eligible approved cancellation may refund balance |
| `EXPIRED` | No | No consumption |

Additional workflow rules:
- Pending requests whose start date arrives without approval are expired by a scheduled service.
- Monthly leave accrual is scheduled for the first day of the month.
- Annual balance reset is scheduled at year-end.
- Working-day calculations account for configured holidays.
- Document requirements are driven by the leave type's `requiresDocument` setting.
- Future-hire users remain inactive until eligible.
- Manager relationships influence team access and notification routing.

## Audit Trail

Hibernate Envers provides revision history for selected entities discussed during development:

- `User`
- `Role`
- `Department`
- `Leave`
- `LeaveType`

Revision metadata includes a timestamp and a username where available. The History interface displays actions, entities, revisions, actors, timestamps, and field-level changes when those values can be derived.

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/audit` | Retrieve audit logs; requires `AUDIT_READ`. |
| `GET` | `/api/audit/{entityType}/{entityId}` | Retrieve an entity's history; requires `AUDIT_READ`. |

Audit history is not retroactive: if no earlier revision was recorded, previous values cannot be reconstructed. Envers also does not automatically record every security event, such as failed login attempts; those require explicit event logging.

## Notifications and Email

Notifications are stored in PostgreSQL. REST endpoints provide notification history and read-state management, while WebSocket/STOMP supports real-time delivery.

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/notifications` | Get the current user's notifications. |
| `GET` | `/api/notifications/unread` | Get unread notifications. |
| `GET` | `/api/notifications/unread-count` | Get the unread count. |
| `PATCH` | `/api/notifications/{notificationId}/read` | Mark one notification as read. |
| `PATCH` | `/api/notifications/read-all` | Mark all current-user notifications as read. |

The WebSocket endpoint discussed during development is `/ws`, with user-specific STOMP delivery to `/user/notifications`. The allowed origin must match the active environment.

Notification types include `LEAVE_SUBMITTED`, `LEAVE_APPROVED`, `LEAVE_REJECTED`, `LEAVE_CANCELLED`, and `LEAVE_EXPIRED`.

Email delivery is integrated into relevant account and leave workflows. Before release, test SMTP connectivity, all active templates, and any inline assets against the latest implementation.

## Project Structure

The exact repository layout should match the current checkout. The following is an illustrative full-stack layout:

```text
Leave_management/
├── backend/
│   └── src/main/
│       ├── java/                   # Controllers, services, repositories, entities
│       └── resources/
│           └── db/changelog/       # Liquibase changelogs (path may vary)
└── frontend/
    └── src/
        ├── app/                    # Next.js App Router pages
        ├── components/             # Shared UI and feature components
        └── lib/                    # API utilities and client integrations
```

## Prerequisites

- JDK 21
- Maven, or the repository's Maven Wrapper if included
- Node.js compatible with the installed Next.js version
- npm or the package manager used by the frontend lockfile
- PostgreSQL
- Git
- An LDAP service if LDAP-dependent features are enabled in the selected configuration
- SMTP credentials if email delivery is enabled

## Configuration

Configure these values using the **exact property names present in the repository**. Do not commit database passwords, JWT signing secrets, SMTP credentials, LDAP bind credentials, or production `.env` files.

| Area | Configuration required |
|---|---|
| PostgreSQL | JDBC URL, username, password |
| Authentication | JWT signing configuration, token settings, cookie settings |
| LDAP | Server URL, base DN, and bind settings where applicable |
| Email | SMTP host, port, credentials, and TLS settings |
| CORS | Allowed frontend origin |
| Frontend | Backend API base URL |
| WebSocket | Endpoint URL and allowed origin |

The backend was previously run on `http://localhost:8080`. The frontend used port `3000` in one setup and `3001` in later work. Check the current configuration and terminal output for the active URLs.

Only expose frontend environment variables that are safe for the browser. Keep backend secrets on the server.

## Run Locally

These are typical development commands. Run them from the actual backend and frontend directories and check the repository scripts before use.

### 1. Start PostgreSQL

Create a development database and configure the backend connection.

### 2. Start the backend

If the Maven Wrapper is available:

```bash
# macOS / Linux
./mvnw spring-boot:run
```

```powershell
# Windows
.\mvnw.cmd spring-boot:run
```

Otherwise, use an installed Maven version:

```bash
mvn spring-boot:run
```

On startup, verify that Liquibase migrations complete successfully and that the application connects to PostgreSQL and any enabled LDAP/SMTP services.

### 3. Start the frontend

From the frontend directory:

```bash
npm install
npm run dev
```

Use the URL printed by the development server.

### 4. Sign in

Use an account created through the project's supported initialization or user-management workflow. Do not publish default administrator credentials.

## API Overview

This is a partial list of endpoints discussed during implementation, not a complete API specification.

### Audit

- `GET /api/audit`
- `GET /api/audit/{entityType}/{entityId}`

Both require `AUDIT_READ`.

### Notifications

- `GET /api/notifications`
- `GET /api/notifications/unread`
- `GET /api/notifications/unread-count`
- `PATCH /api/notifications/{notificationId}/read`
- `PATCH /api/notifications/read-all`

### Leave documents

A document endpoint was implemented as `GET /{leaveId}/document` under the leave controller's base mapping. Confirm the complete route in the current controller before using it in external documentation.

For a complete API reference, inspect the controllers or add an OpenAPI specification.

## Troubleshooting

| Issue | What to check |
|---|---|
| Liquibase migration fails | Review the changeset ID, database state, migration history, and full error. Avoid editing applied changesets. |
| Envers schema or sequence error | Confirm the revision table and sequence match the active Hibernate/Envers configuration. |
| Frontend cannot reach backend | Check the API base URL, backend port, CORS origins, cookie credentials, and browser Network panel. |
| Login is rate-limited | Review bucket configuration and client-IP resolution; verify trusted proxy settings. |
| LDAP operation fails | Check server reachability, base DN, bind settings, directory attributes, and backend logs. Never expose bind credentials. |
| Email sending fails | Verify SMTP settings, active template names, resource paths, and the original backend exception. |
| Audit history has no previous values | Earlier values are unavailable when no prior Envers revision was recorded. Changes before auditing was enabled are not retroactive. |

## License

This project is licensed under the MIT License.

```text
MIT License

Copyright (c) 2026 [Your Name]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
