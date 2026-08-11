# PCT — Authentication

**Project:** Permetheon Command Terminal
**Short Name:** PCT
**Domain:** `pct.permetheon.com`
**Document Type:** Authentication Specification
**Status:** Active
**Version:** 1.0

---

# 1. Purpose

This document defines the authentication architecture for PCT.

PCT is an internal Permetheon system. Authentication must therefore be:

* Simple
* Secure
* Server-controlled
* Database-backed
* Easy to maintain
* Compatible with Hostinger deployment

PCT must not depend on third-party authentication providers.

---

# 2. Authentication Architecture

Authentication is handled by the Express.js backend.

```text id="f7n4l8"
React Login Page
       │
       │ POST /api/auth/login
       ▼
Express Backend
       │
       ├── Validate Input
       │
       ├── Find User
       │
       ├── Verify Password
       │
       ├── Verify Account Status
       │
       └── Create Authentication State
              │
              ▼
          MySQL / Auth Session
              │
              ▼
        Authenticated User
```

The React frontend is responsible for displaying authentication state.

The backend is responsible for deciding whether the user is actually authenticated.

---

# 3. Authentication Model

PCT uses application-managed authentication.

The system must NOT use:

* Firebase Authentication
* Supabase Auth
* Auth0
* Clerk
* OAuth providers
* Third-party identity providers

Authentication remains inside the PCT backend.

---

# 4. User Registration

Public registration is disabled.

There is no public:

```text id="0r2xqx"
/register
```

page.

Users are created by authorized PCT administrators.

```text id="qwpn7k"
ADMIN
  │
  ▼
Create User
  │
  ▼
User Record
  │
  ▼
Developer / Team Lead / Admin
```

---

# 5. User Account Structure

A user should contain information such as:

```text id="v4kt2g"
id
name
email
password_hash
role
status
created_at
updated_at
last_login_at
```

The exact database structure is defined in `DATABASE.md`.

---

# 6. Roles

Initial PCT roles:

```text id="4q9w4c"
ADMIN
TEAM_LEAD
DEVELOPER
```

Authentication identifies the user.

Authorization determines what the user is allowed to do.

These are separate concepts.

```text id="5m2d7y"
Authentication
"Who are you?"

Authorization
"What are you allowed to do?"
```

---

# 7. Account Status

Users should have an account status.

Recommended values:

```text id="p9aj0k"
ACTIVE
INACTIVE
```

Only active users can authenticate.

An inactive user attempting to log in must be rejected.

---

# 8. Login

Endpoint:

```text id="3r3smj"
POST /api/auth/login
```

Request:

```json id="n8f0v2"
{
  "email": "developer@example.com",
  "password": "user-password"
}
```

Backend process:

```text id="2g7z1q"
Receive Credentials
       ↓
Validate Input
       ↓
Find User
       ↓
Check Account Status
       ↓
Verify Password Hash
       ↓
Create Authentication State
       ↓
Update Last Login
       ↓
Return User Information
```

---

# 9. Login Success

Successful authentication should return the authenticated user's safe information.

Example:

```json id="j8t7wm"
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "user": {
      "id": 12,
      "name": "Ahmed",
      "email": "ahmed@example.com",
      "role": "DEVELOPER"
    }
  }
}
```

Never return:

```text id="4m8r9p"
password
password_hash
session_secret
database_credentials
```

---

# 10. Login Failure

Invalid credentials should produce a generic error.

Example:

```json id="1x1xhp"
{
  "success": false,
  "message": "Invalid email or password."
}
```

Do not reveal whether:

* The email exists
* The account exists
* The password was wrong
* The account belongs to a specific role

This reduces unnecessary account enumeration.

---

# 11. Inactive Account

If a valid account is inactive, login must be denied.

Example:

```json id="qu5h6x"
{
  "success": false,
  "message": "This account is inactive."
}
```

The exact user-facing wording may be adjusted if required by the final UX.

---

# 12. Password Storage

Passwords must NEVER be stored in plain text.

Correct:

```text id="7a2n0u"
User Password
      ↓
Password Hash
      ↓
MySQL
```

The database stores only the password hash.

---

# 13. Password Hashing

Use a proven password hashing algorithm/library available in the Node.js ecosystem.

Preferred implementation:

```text id="c8r1r8"
bcrypt
```

The exact implementation should be kept inside a dedicated authentication/password utility.

Example:

```text id="a1i8sh"
server/utils/password.js
```

The rest of the application must not manually implement hashing algorithms.

---

# 14. Password Verification

During login:

```text id="3f2c0k"
Submitted Password
       │
       ▼
Password Verification
       │
       ▼
Stored Hash
       │
       ├── Match → Continue
       │
       └── Fail  → Reject Login
```

Passwords must never be compared as plain database values.

---

# 15. Authentication State

PCT should use a secure server-controlled authentication mechanism.

Recommended approach:

```text id="p7g7yz"
HTTP-only Secure Cookie
        +
Server-side Authentication State
```

The browser should not need to expose authentication secrets to JavaScript.

Authentication cookies should use appropriate security flags.

Production should use:

```text id="w6ts7u"
HttpOnly
Secure
SameSite
```

with values appropriate for the deployed domain and architecture.

---

# 16. Session Management

Authenticated sessions should be associated with the authenticated user.

A session record may contain:

```text id="x3q6e2"
id
user_id
session_identifier
created_at
expires_at
```

If server-side sessions are implemented, session data should be stored server-side rather than putting sensitive user data directly into the browser.

The exact session implementation must remain consistent across frontend and backend.

---

# 17. Session Expiration

Authentication sessions should expire after an appropriate period.

The system should not create permanent authentication sessions by default.

When a session expires:

```text id="5y24o8"
Frontend Request
      ↓
Backend
      ↓
Authentication Failed
      ↓
401 Unauthorized
      ↓
Frontend Redirects to Login
```

The exact session lifetime may be configured through environment settings.

---

# 18. Current User Endpoint

Endpoint:

```text id="c2g9ak"
GET /api/auth/me
```

This endpoint returns the currently authenticated user.

Example:

```json id="5h9h03"
{
  "success": true,
  "data": {
    "user": {
      "id": 12,
      "name": "Ahmed",
      "email": "ahmed@example.com",
      "role": "DEVELOPER"
    }
  }
}
```

The endpoint must derive the user from the authentication state.

The frontend must not provide a user ID to determine who is logged in.

---

# 19. Logout

Endpoint:

```text id="9p2r1v"
POST /api/auth/logout
```

Logout must invalidate the current authentication state.

Flow:

```text id="f73x2h"
User clicks Logout
       ↓
POST /api/auth/logout
       ↓
Invalidate Session
       ↓
Clear Authentication Cookie
       ↓
Return Success
       ↓
React clears auth state
       ↓
Redirect to Login
```

---

# 20. Protected Routes

All internal PCT application pages require authentication.

Examples:

```text id="7svy7s"
/dashboard
/tasks
/projects
/developers
/reviews
/notifications
/activity
/reports
/settings
```

Unauthenticated users should be redirected to:

```text id="8z0h7x"
/login
```

---

# 21. Backend Route Protection

Frontend route protection is not enough.

Backend routes must also require authentication.

Example:

```text id="u5g2vi"
GET /api/tasks
       ↓
Auth Middleware
       ↓
Authenticated?
       ├── NO → 401
       └── YES → Continue
```

---

# 22. Authentication Middleware

Recommended file:

```text id="l3h2s1"
server/middleware/authMiddleware.js
```

Responsibilities:

* Read authentication state
* Validate session
* Identify user
* Attach authenticated user to request
* Reject unauthenticated requests

Conceptually:

```text id="i9m7az"
Request
   ↓
authMiddleware
   ↓
req.user
   ↓
Controller
```

---

# 23. Authorization Middleware

Authentication middleware identifies the user.

Role middleware verifies permissions.

Recommended file:

```text id="2k7m8q"
server/middleware/roleMiddleware.js
```

Example:

```text id="6c2w0d"
Request
   ↓
Authentication
   ↓
Role Check
   ↓
Controller
```

---

# 24. Role Access

## ADMIN

Full access to PCT.

Can manage:

* Users
* Developers
* Projects
* Tasks
* Reviews
* Files
* Reports
* Activity
* Settings

---

## TEAM_LEAD

Operational access.

Can manage:

* Assigned projects
* Project members
* Tasks
* Task assignments
* Reviews
* Relevant activity
* Relevant reports

---

## DEVELOPER

Developer-level access.

Can:

* View assigned tasks
* Update assigned tasks
* Add comments
* Upload files
* Submit tasks for review
* View relevant projects
* View relevant activity

---

# 25. Backend Permission Principle

The backend is the final authority.

Example:

A developer does not see the "Delete User" button.

That is only a UI restriction.

The backend must independently reject:

```text id="l2f3z0"
DELETE /api/users/10
```

if the authenticated user is not authorized.

Expected:

```text id="x5l8cm"
403 Forbidden
```

---

# 26. Frontend Authentication State

Recommended structure:

```text id="7drw6e"
client/src/context/AuthContext.jsx
```

AuthContext may manage:

```text id="1p8b8g"
currentUser
isAuthenticated
loading
login()
logout()
refreshUser()
```

The frontend should not store sensitive authentication secrets in:

```text id="8w7z7n"
localStorage
sessionStorage
```

unless a specific security-reviewed requirement requires it.

---

# 27. Authentication Flow

Complete application flow:

```text id="d2cx8j"
                    ┌──────────────┐
                    │ Login Page   │
                    └──────┬───────┘
                           │
                           ▼
                  POST /api/auth/login
                           │
                           ▼
                  Express Auth Layer
                           │
                    ┌──────┴──────┐
                    │             │
                 Invalid        Valid
                    │             │
                    ▼             ▼
                  401        Create Session
                                  │
                                  ▼
                            Return User
                                  │
                                  ▼
                           AuthContext
                                  │
                                  ▼
                           PCT Dashboard
```

---

# 28. Application Startup Authentication

When the React application loads:

```text id="t0c2qa"
React Starts
     ↓
AuthContext Initializes
     ↓
GET /api/auth/me
     ↓
     ├── 200 → User Authenticated
     │
     └── 401 → User Not Authenticated
```

While authentication state is being checked, the application should show an appropriate loading state instead of briefly rendering protected content.

---

# 29. Authentication Redirects

### Unauthenticated User

```text id="8w7sl8"
/dashboard
   ↓
Not Authenticated
   ↓
/login
```

### Authenticated User

```text id="h6h5yr"
/login
   ↓
Already Authenticated
   ↓
/dashboard
```

The exact default landing page may depend on the user's role.

---

# 30. Login Form Validation

Frontend should validate obvious input errors before submitting.

Examples:

```text id="o1cb8j"
Email required
Valid email format
Password required
```

Backend must perform the same validation independently.

Frontend validation is for UX.

Backend validation is authoritative.

---

# 31. Brute Force Protection

Because PCT is an internal application, authentication should still protect against repeated login attempts.

The backend should consider rate limiting or temporary login throttling for repeated failed attempts.

Do not permanently lock accounts based solely on a few failed attempts unless an explicit account-lockout policy is implemented.

---

# 32. CSRF Protection

If authentication uses cookie-based sessions, state-changing requests must be protected against CSRF where required by the final deployment configuration.

Relevant operations include:

```text id="slc5js"
POST
PUT
PATCH
DELETE
```

The exact CSRF implementation should be selected according to the final cookie/session architecture.

---

# 33. CORS

PCT is primarily a same-application frontend/backend system.

CORS should therefore remain restrictive.

Production should allow only the required PCT frontend origin.

Do not use unrestricted:

```text id="q8j4d3"
Access-Control-Allow-Origin: *
```

for authenticated production operations.

---

# 34. Environment Variables

Authentication-related secrets must be stored in environment variables.

Example:

```env id="2u6mhy"
SESSION_SECRET=
COOKIE_SECRET=
```

Database credentials also belong in environment configuration.

No authentication secrets may be committed to Git.

---

# 35. Authentication Activity

Authentication events should integrate with `ACTIVITY_LOG.md`.

Relevant events:

```text id="hckq3s"
USER_LOGIN
USER_LOGOUT
LOGIN_FAILED
```

Successful login should record:

```text id="a4b5h5"
User
Action
Timestamp
```

Failed login events should avoid storing sensitive credential information.

Never log:

```text id="6qv9r4"
Password
Password hash
Session secret
Authentication token
```

---

# 36. Password Reset

PCT does not initially require public self-service password reset.

Because users are created internally, password changes may initially be handled by an authorized administrator.

Future password-reset functionality may be added if required.

If implemented later, it must be documented separately and must not expose passwords or reset secrets.

---

# 37. Change Password

A future authenticated password-change flow may use:

```text id="7a9f8m"
POST /api/auth/change-password
```

It should require:

* Current password
* New password
* New password confirmation

The new password must be hashed before storage.

---

# 38. Account Deactivation

Deactivating an account must not automatically delete its historical records.

Example:

```text id="f3p8kh"
User
 ↓
INACTIVE
 ↓
Cannot Login
 ↓
Historical Tasks/Activity Remain
```

This preserves project and task history.

---

# 39. Authentication Security Rules

The following rules are mandatory:

1. Never store plain-text passwords.
2. Never return password hashes.
3. Never expose authentication secrets.
4. Never trust frontend role information.
5. Always verify authentication on protected backend routes.
6. Always verify authorization on sensitive backend operations.
7. Use secure cookies for authentication where applicable.
8. Do not store sensitive authentication secrets in localStorage.
9. Do not hardcode production credentials.
10. Do not log passwords or tokens.
11. Use generic invalid-credential responses.
12. Validate authentication input on both frontend and backend.

---

# 40. Authentication File Structure

Authentication-related files should remain organized.

```text id="w8p0km"
server/
├── controllers/
│   └── authController.js
│
├── routes/
│   └── authRoutes.js
│
├── middleware/
│   ├── authMiddleware.js
│   └── roleMiddleware.js
│
├── services/
│   └── authService.js
│
└── utils/
    ├── password.js
    └── tokens.js

client/
└── src/
    ├── context/
    │   └── AuthContext.jsx
    │
    ├── hooks/
    │   └── useAuth.js
    │
    ├── pages/
    │   └── auth/
    │       └── Login.jsx
    │
    └── services/
        └── authService.js
```

---

# 41. Authentication API Summary

| Method | Endpoint                    | Purpose         | Access                    |
| ------ | --------------------------- | --------------- | ------------------------- |
| POST   | `/api/auth/login`           | Login           | Public                    |
| POST   | `/api/auth/logout`          | Logout          | Authenticated             |
| GET    | `/api/auth/me`              | Current user    | Authenticated             |
| POST   | `/api/auth/change-password` | Change password | Authenticated             |
| POST   | `/api/auth/reset-password`  | Future feature  | Not initially implemented |

---

# 42. What PCT Does Not Use

Authentication must NOT introduce:

```text id="8wq5d4"
Firebase Auth
Supabase Auth
Auth0
Clerk
Google OAuth
Facebook Login
Third-party identity providers
External authentication APIs
```

PCT authentication remains internal.

---

# 43. Implementation Principle

Authentication should be implemented before protected business modules are considered complete.

The implementation order should be:

```text id="q1l4f6"
1. Database User Structure
        ↓
2. Password Hashing
        ↓
3. Login
        ↓
4. Session Management
        ↓
5. Auth Middleware
        ↓
6. Role Middleware
        ↓
7. /api/auth/me
        ↓
8. Logout
        ↓
9. React AuthContext
        ↓
10. Protected Routes
        ↓
11. Role-Based UI
```

---

# 44. Source of Truth

This document defines the authentication requirements for PCT.

Authentication implementation must follow:

* `ARCHITECTURE.md`
* `API.md`
* `ACTIVITY_LOG.md`
* `DATABASE.md`

If a new authentication requirement conflicts with this document, the conflict must be identified before changing the architecture.

---

# 45. Final Authentication Architecture

```text id="6v2n5d"
                 PCT LOGIN
                     │
                     ▼
              React Login.jsx
                     │
                     ▼
            authService.js
                     │
                     ▼
          POST /api/auth/login
                     │
                     ▼
           Express Auth Route
                     │
                     ▼
          authController.js
                     │
                     ▼
            authService.js
               /         \
              ▼           ▼
        MySQL User    Password Hash
              │
              ▼
        Create Session
              │
              ▼
       Secure HTTP Cookie
              │
              ▼
         Authenticated PCT
              │
       ┌──────┼──────┐
       ▼      ▼      ▼
     ADMIN  LEAD  DEVELOPER
```

**PCT Authentication Principle:**

> **The frontend displays authentication state; the backend owns authentication and authorization.**
