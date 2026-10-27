# LeaveFlow --- Company Leave Management System

LeaveFlow is a full-stack company leave management application for
employee leave requests, approval workflows, leave balances, holidays,
notifications, and audit history. It provides one role-aware workspace
for employees, managers, and HR, with backend-enforced permissions.

> **Documentation note:** This README reflects project details discussed
> during development. Exact repository paths, configuration property
> names, and some integrations should be verified against the latest
> source code before a production release. Items known to have
> encountered unfinished work are called out rather than represented as
> confirmed.

## Contents

-   [Overview](#overview)
-   [Highlights](#highlights)
-   [Features](#features)
-   [Roles and Permissions](#roles-and-permissions)
-   [Technology Stack](#technology-stack)
-   [Architecture](#architecture)
-   [Business Rules](#business-rules)
-   [Security](#security)
-   [Audit History](#audit-history)
-   [Notifications and Email](#notifications-and-email)
-   [Database and Migrations](#database-and-migrations)
-   [Project Structure](#project-structure)
-   [Prerequisites](#prerequisites)
-   [Configuration](#configuration)
-   [Run Locally](#run-locally)
-   [API Overview](#api-overview)
-   [Troubleshooting](#troubleshooting)
-   [Verification Checklist](#verification-checklist)
-   [License](#license)

## Overview

LeaveFlow centralizes leave administration in a web application.
Employees can submit and track requests, managers can review requests
within their authorization scope, and HR can administer users and
organizational configuration.

A shared dashboard and application shell adapt to the signed-in user's
permissions instead of maintaining separate frontends for each role. The
frontend supports navigation and usability; the backend independently
protects data and operations.

## Highlights

1.  **Fine-grained RBAC:** roles, modules, permissions, and
    role-permission assignments, including personal, team, and
    organization-wide leave access scopes.
2.  **End-to-end leave lifecycle:** submission, approval, rejection,
    cancellation, expiration, conflict checks, working-day calculations,
    supporting documents, and balance effects.
3.  **Audit history:** Hibernate Envers revisions and a History UI for
    system-wide and entity-specific audit records.
4.  **Persistent real-time notifications:** PostgreSQL storage and REST
    read-state/history endpoints combined with WebSocket/STOMP delivery.
5.  **Scheduled operations:** separate services for pending-request
    expiration, monthly leave accrual, and year-end balance reset.
6.  **Security-aware architecture:** JWT cookie authentication, BCrypt,
    permission checks, LDAP integration, and rate limiting.

## Features

### Leave management

-   Submit leave requests with type, dates, reason, and supporting
    documents when required.
-   Approve or reject requests through the applicable workflow.
-   Cancel eligible requests.
-   Calculate duration using working days and configured holidays.
-   Detect overlapping leave requests.
-   Track request status and decision timestamps.
-   Automatically expire pending requests whose start date arrives
    without approval.
-   View authorized leave documents.

### Balances and scheduling

-   Track annual leave balances.
-   Accrue leave balance through a scheduled monthly process.
-   Reset annual balances through a scheduled year-end process.
-   Manage public holidays and working-day calculations.
-   Display leave and holiday events in a calendar.
-   Review availability information.

### Users and organization

-   Manage users, departments, roles, permissions, and leave types.
-   Maintain manager relationships between users.
-   Bulk-import users from Excel.
-   Support future hire dates while keeping future-hire users inactive.
-   Display employee and manager information.
-   Support account activation and a `mustChangePassword` state.

### Dashboard and interface

-   Unified dashboard for HR, managers, and employees.
-   Permission-aware sidebar navigation and actions.
-   Dashboard statistics and charts.
-   Shared application shell with sidebar and top navigation.
-   Protected application routes and guest-only authentication routes.
-   Responsive layout, profile/settings pages, and calendar views.

### Notifications and communications

-   Persist notifications in PostgreSQL.
-   Retrieve all or unread notifications and unread counts.
-   Mark one notification or all notifications as read.
-   Deliver new notifications over WebSocket/STOMP.
-   Integrate email notifications into relevant account and leave
    workflows.

### Audit history

-   Track revisions for selected entities using Hibernate Envers.
-   Retrieve all audit logs or the history of one entity.
-   Display revision, action, actor, timestamp, and changed fields where
    available.
-   Protect audit APIs using `AUDIT_READ`.

## Roles and Permissions

  -----------------------------------------------------------------------
  Role                                Typical responsibilities
  ----------------------------------- -----------------------------------
  **Employee**                        Submit and track personal leave
                                      requests and view personal leave
                                      information.

  **Manager**                         Review requests and access team
                                      information within the assigned
                                      permission scope.

  **HR**                              Manage users and organizational
                                      configuration, oversee leave
                                      administration, and access audit
                                      history when granted `AUDIT_READ`.
  -----------------------------------------------------------------------

The authorization model uses module and permission records rather than
relying only on hard-coded role checks. Exact permission names and
assignments should be taken from the current migrations/seed data.
Manager relationships influence team-level access and notification
routing.

## Technology Stack

  -----------------------------------------------------------------------
  Layer                               Technology
  ----------------------------------- -----------------------------------
  Frontend                            Next.js App Router, React,
                                      TypeScript, Tailwind CSS

  Backend                             Java 21, Spring Boot, Maven

  Persistence                         PostgreSQL, Spring Data JPA,
                                      Hibernate

  Migrations                          Liquibase

  Authentication                      JWT cookie-based authentication,
                                      LDAP integration

  Password security                   BCrypt

  Authorization                       Roles, modules, permissions,
                                      role-permission assignments

  Audit                               Hibernate Envers

  Real-time messaging                 WebSocket, STOMP, Spring messaging

  Rate limiting                       Bucket4j

  Email                               Spring email integration

  Icons                               Lucide React
  -----------------------------------------------------------------------

## Architecture

``` text
Browser
   |
   v
Next.js / React
  - Pages and route guards
  - Shared AppShell
  - Reusable API utilities
   | HTTP / REST
   v
Spring Boot API
  - Authentication and authorization
  - User and department management
  - Leave workflow and balance rules
  - Notifications and audit history
  - Scheduled services
   |
   v
PostgreSQL
  - Application data
  - Persistent notifications
  - Envers revision history

Frontend <---- WebSocket / STOMP ----> Backend
Backend  ---- SMTP / LDAP as configured ----> Services
```

The frontend has guest-only routes for authentication pages and
protected routes for authenticated pages. `AppShell` provides shared
navigation and layout. Backend authorization remains the security
boundary.

## Business Rules

The following summarizes the design discussed during development;
confirm it against the current implementation and approved company
policy before treating it as formal HR policy.

  ------------------------------------------------------------------------
  Status                   Blocks conflicting dates? Balance effect
  --------------------- ---------------------------- ---------------------
  `PENDING`                                      Yes No consumption until
                                                     approval

  `APPROVED`                                     Yes Consumes balance
                                                     where applicable

  `REJECTED`                                      No No consumption

  `CANCELLED`                                     No Eligible approved
                                                     cancellation refunds
                                                     the balance

  `EXPIRED`                                       No No consumption
  ------------------------------------------------------------------------

Other discussed rules: - Pending requests whose start date has arrived
without approval are expired by a scheduled service. - Monthly accrual
is scheduled for the first day of the month. - Annual balance reset is
scheduled at year-end. - Working-day calculations account for configured
holidays. - Document requirements are controlled by the leave type's
`requiresDocument` setting. - Future-hire users remain inactive until
eligible. - Manager relationships influence team-level access and
notification routing. - Email is treated as the login identity in the
discussed design; verify exact validation/generation rules in the
current source.

## Security

Security features discussed for the project include: - JWT
authentication with cookie-based token transport. - BCrypt password
hashing. - Role- and permission-based authorization. - Account
activation and token-version invalidation where applicable. - Password
change and password-reset workflows. - CORS configuration for the
frontend origin. - Rate limiting for sensitive endpoints such as
login. - Permission checks before serving leave documents. -
`AUDIT_READ` checks on audit endpoints. - Exclusion of password and
token-version values from audit history.

### Login rate limiting

The discussed login limiter uses a key such as `login:<client-ip>` and
creates a bucket the first time that key appears. The example allows
five attempts per minute per IP. In production behind a reverse proxy,
configure trusted proxy handling before relying on forwarded IP headers.
Do not blindly trust arbitrary `X-Forwarded-For` values. Account-based
limits can complement IP-based limits.

## Audit History

Hibernate Envers is used for revision history on selected entities
discussed during development: - `User` - `Role` - `Department` -
`Leave` - `LeaveType`

The audit schema includes revision metadata (`revinfo`) and audit tables
such as `users_aud` and `leaves_aud`. Revision metadata includes a
timestamp and a username where available.

  --------------------------------------------------------------------------------------
  Method                  Endpoint                               Purpose
  ----------------------- -------------------------------------- -----------------------
  `GET`                   `/api/audit`                           Retrieve audit logs;
                                                                 requires `AUDIT_READ`.

  `GET`                   `/api/audit/{entityType}/{entityId}`   Retrieve one entity's
                                                                 history; requires
                                                                 `AUDIT_READ`.
  --------------------------------------------------------------------------------------

The History page supports searching/filtering and a details drawer
showing action, entity, revision, actor, timestamp, and field-level
changes. If an entity has no earlier recorded revision, previous values
cannot be reconstructed retroactively. Envers also does not
automatically record every business/security event, such as failed login
attempts; those require explicit audit-event handling.

## Notifications and Email

Notifications are persisted in PostgreSQL. REST endpoints handle
notification history/read state, while WebSocket/STOMP provides
real-time delivery.

  --------------------------------------------------------------------------------------------
  Method                  Endpoint                                     Purpose
  ----------------------- -------------------------------------------- -----------------------
  `GET`                   `/api/notifications`                         Get the current user's
                                                                       notifications.

  `GET`                   `/api/notifications/unread`                  Get unread
                                                                       notifications.

  `GET`                   `/api/notifications/unread-count`            Get unread count.

  `PATCH`                 `/api/notifications/{notificationId}/read`   Mark one notification
                                                                       as read.

  `PATCH`                 `/api/notifications/read-all`                Mark all current-user
                                                                       notifications as read.
  --------------------------------------------------------------------------------------------

The WebSocket endpoint discussed during development is `/ws`, with
user-specific STOMP delivery to `/user/notifications`. Allowed origins
and URLs must match the environment.

Notification types discussed include `LEAVE_SUBMITTED`,
`LEAVE_APPROVED`, `LEAVE_REJECTED`, `LEAVE_CANCELLED`, and
`LEAVE_EXPIRED`.

Email notifications are part of the project. A newer Thymeleaf-template
conversion encountered errors during development; verify that conversion
against the current code before claiming all branded templates work
end-to-end.

## Database and Migrations

PostgreSQL stores application data and persistent notifications.
Liquibase manages schema migrations, and Hibernate Envers maintains
audit revision history.

Development notes: - Envers tables and revision sequence settings must
match the Hibernate configuration. - A revision sequence increment
mismatch was encountered during development. - Liquibase checksum
validation failed after an applied changeset was edited. - Prefer adding
a new changeset for future schema changes instead of editing an
already-applied changeset. - Do not drop audit tables, reset revisions,
or alter Liquibase checksums in production as a routine fix.

## Project Structure

The latest repository layout has not been verified. This is
illustrative; adjust the directory names to match the actual repository:

``` text
Leave_management/
├── backend/                         # Spring Boot application
│   └── src/main/
│       ├── java/                    # Controllers, services, repositories, entities
│       └── resources/db/changelog/  # Liquibase migrations
└── frontend/                        # Next.js application
    └── src/
        ├── app/                     # App Router pages and route groups
        ├── components/              # Shared UI and feature components
        └── lib/                     # API utilities and WebSocket client
```

## Prerequisites

-   JDK 21
-   Maven, or the repository's Maven Wrapper if included
-   Node.js compatible with the installed Next.js version
-   npm or the package manager matching the frontend lockfile
-   PostgreSQL
-   Git
-   LDAP service if LDAP authentication is enabled in the selected
    configuration

## Configuration

Do not commit database passwords, JWT secrets, SMTP credentials, LDAP
bind credentials, or production `.env` files.

Configure these areas using the exact property names in the repository:

  -----------------------------------------------------------------------
  Area                                Configuration
  ----------------------------------- -----------------------------------
  PostgreSQL                          JDBC URL, username, password

  Authentication                      JWT signing configuration, token
                                      settings, cookie settings

  Email                               SMTP host, port, credentials, TLS
                                      settings

  LDAP (if enabled)                   LDAP URL, base DN, bind
                                      configuration

  CORS                                Allowed frontend origin

  Frontend                            Backend API base URL

  WebSocket                           Endpoint URL and allowed origin
  -----------------------------------------------------------------------

The development API URL discussed previously was
`http://localhost:8080`. The frontend ran on port `3000` in one local
setup and `3001` in some later work. Verify the current configuration
before relying on either. Only expose frontend environment variables
that are safe for the browser; keep backend secrets on the server.

## Run Locally

These are typical commands; verify the current folder names, scripts,
and configuration before running them.

### 1. Start PostgreSQL

Create a development database and configure the backend connection.

### 2. Start the backend

From the backend directory, if the Maven Wrapper is present:

``` bash
./mvnw spring-boot:run
```

On Windows:

``` powershell
.\mvnw.cmd spring-boot:run
```

If no wrapper is included:

``` bash
mvn spring-boot:run
```

### 3. Start the frontend

From the frontend directory:

``` bash
npm install
npm run dev
```

Check `package.json` and terminal output for the actual local URL.

### 4. Sign in

Use an account created by the supported initialization or
user-management workflow. Do not publish default administrator
credentials.

## API Overview

This is a partial list of endpoints specifically discussed during
implementation.

### Audit

-   `GET /api/audit`
-   `GET /api/audit/{entityType}/{entityId}`

Both require `AUDIT_READ`.

### Notifications

-   `GET /api/notifications`
-   `GET /api/notifications/unread`
-   `GET /api/notifications/unread-count`
-   `PATCH /api/notifications/{notificationId}/read`
-   `PATCH /api/notifications/read-all`

### Leave documents

A document endpoint was implemented as `GET /{leaveId}/document` under
the leave controller's base mapping. Verify the complete path from the
current controller before publishing it as an exact endpoint.

For a complete API reference, inspect the current controllers or
add/generate an OpenAPI specification.

## Troubleshooting

**Liquibase or Envers migration errors** - Read the full error and
identify the changeset ID. - Check whether Envers tables or
`revinfo_seq` already exist. - Confirm the sequence increment matches
Hibernate configuration. - Avoid editing applied changesets; create a
new changeset for later changes.

**Frontend cannot reach the backend** - Verify the configured API URL
and backend port. - Confirm CORS allows the frontend origin. - Ensure
cookie-authenticated requests include credentials. - Inspect browser
Network tools and backend logs.

**Login is rate-limited** - Check the bucket limit and how the client IP
is resolved. - Verify trusted proxy handling in reverse-proxy
deployments. - Do not rely on untrusted forwarded headers.

**Email sending fails** - Verify SMTP configuration, template names, and
resource paths. - Inspect the original backend exception without
exposing credentials. - Confirm whether the newer Thymeleaf conversion
is complete.

**Audit history has no previous values** - Previous values are
unavailable if no earlier Envers revision was recorded. - Changes made
before auditing was enabled are not captured retroactively.

## Verification Checklist

Before treating this as final release documentation, verify: 1. Exact
backend and frontend directory names. 2. Actual `package.json` scripts
and Maven Wrapper availability. 3. Current environment-variable/property
names and safe example values. 4. Complete leave-document endpoint
mapping. 5. Exact permission names and role assignments in
migrations/seed data. 6. Whether the Thymeleaf email templates work
end-to-end. 7. Whether LDAP is enabled by default or optional. 8.
Current frontend port and WebSocket origin. 9. Exact accrual/reset
policy against current code and company requirements.

## Future Improvements

Potential improvements, depending on project scope: - Publish a complete
OpenAPI specification. - Add automated tests for leave lifecycle rules,
permission boundaries, and scheduled jobs. - Document production
deployment and trusted-proxy configuration. - Add explicit audit events
for security events Envers does not capture. - Add screenshots and a
short demo GIF. - Document backup, recovery, and retention policies for
uploaded documents and audit data.

## License

Add the license appropriate for this repository. If it is not intended
for public reuse, state that explicitly rather than implying an
open-source license.
