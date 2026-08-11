# PCT — Security System

**Project:** Permetheon Command Terminal
**Short Name:** PCT
**Production Domain:** `pct.permetheon.com`
**Stack:** React 18+, Tailwind CSS, Express.js, MySQL
**Document Type:** Security Specification
**Status:** Active Development
**Version:** 1.0

---

# 1. Purpose

This document defines the security requirements and security architecture for PCT.

PCT is an internal developer management and project operations system.

Security must protect:

```text
User Accounts
Authentication Data
Projects
Tasks
Developer Information
Reviews
Files
Activity Logs
Reports
Database
Server Configuration
Application Secrets
```

---

# 2. Core Security Principles

PCT follows these principles:

```text
1. Never trust the client.
2. Validate all server-side input.
3. Authenticate every protected request.
4. Authorize every protected action.
5. Enforce resource-level access.
6. Keep secrets server-side.
7. Never expose database credentials.
8. Minimize stored sensitive data.
9. Log important security events.
10. Fail securely.
```

---

# 3. Security Architecture

The security boundary is the Express backend.

```text
Browser
   ↓
React
   ↓
HTTPS
   ↓
Express.js
   ↓
Authentication
   ↓
Authorization
   ↓
Validation
   ↓
Controller
   ↓
Service
   ↓
MySQL
```

React is considered an untrusted client.

---

# 4. HTTPS

Production traffic must use HTTPS.

Production:

```text
https://pct.permetheon.com
```

HTTP traffic should redirect to HTTPS where supported by the Hostinger deployment.

Never transmit authentication credentials over plain HTTP.

---

# 5. Authentication

Authentication is responsible for establishing the identity of a user.

Protected API requests must identify an authenticated user.

Authentication requirements are defined in:

```text
AUTHENTICATION.md
```

Security requirements include:

```text
Password hashing
Secure session/token handling
Authentication expiration
Logout handling
Disabled-user enforcement
```

---

# 6. Password Security

Passwords must never be stored in plaintext.

Correct:

```text
User Password
     ↓
Secure Password Hash
     ↓
MySQL
```

Incorrect:

```text
User Password
     ↓
MySQL plaintext
```

Use a strong password hashing algorithm supported by the Node.js ecosystem.

Recommended options:

```text
Argon2id
bcrypt
```

Do not use:

```text
MD5
SHA1
Plain SHA256
Custom hashing algorithms
```

for password storage.

---

# 7. Password Requirements

PCT should enforce reasonable password requirements.

Recommended baseline:

```text
Minimum length: 8 characters
```

Longer passwords should be allowed.

Avoid unnecessarily restrictive composition rules unless required.

Passwords should never be logged.

---

# 8. Authentication Secrets

Secrets must never be committed to Git.

Examples:

```text
Database Password
Session Secret
JWT Secret
Encryption Keys
API Keys
SMTP Credentials
```

Use environment variables or the hosting provider's secure configuration system.

Example:

```text
.env
```

must not be committed.

---

# 9. Environment Variables

Production secrets should be provided through server environment configuration.

Example:

```env
NODE_ENV=production
DB_HOST=...
DB_USER=...
DB_PASSWORD=...
DB_NAME=...
AUTH_SECRET=...
```

Never expose server-only variables through the React frontend.

---

# 10. Frontend Environment Security

Anything bundled into React should be treated as public.

Never place:

```text
Database Password
Authentication Secret
Private Encryption Key
Server Secret
```

inside frontend environment variables.

If a value reaches the browser, assume the user can inspect it.

---

# 11. Authorization

Authentication answers:

> Who is this user?

Authorization answers:

> What is this user allowed to do?

PCT uses:

```text
Authentication
     ↓
Role
     ↓
Permission
     ↓
Resource Scope
```

Full permission rules are defined in:

```text
ROLE_PERMISSIONS.md
```

---

# 12. Backend Authorization

Every protected operation must be authorized on the backend.

Example:

```text
PATCH /api/projects/:id
        ↓
Authenticate
        ↓
Check project.update
        ↓
Check Project Access
        ↓
Allow / Deny
```

Never rely only on React UI restrictions.

---

# 13. Resource-Level Authorization

A valid role does not automatically grant access to every resource.

Example:

```text
Developer
   ↓
task.view
   ↓
Task #500
   ↓
Does Developer have access?
   ↓
YES → Allow
NO  → Deny
```

This prevents ID-based access bypass.

---

# 14. IDOR Protection

PCT must protect against insecure direct object references.

Example attack:

```text
/api/projects/10
```

changing to:

```text
/api/projects/11
```

must not expose Project #11 unless the authenticated user is authorized to access it.

Every resource lookup must consider authorization.

---

# 15. Input Validation

All external input must be validated server-side.

Sources include:

```text
Request Body
URL Parameters
Query Parameters
Headers
Uploaded Files
```

Never assume frontend validation is sufficient.

---

# 16. Input Sanitization

User-controlled content must be handled safely.

Examples:

```text
Project Name
Task Title
Comments
Review Feedback
Descriptions
File Names
Search Queries
```

Do not blindly trust or execute user-provided content.

---

# 17. SQL Injection Protection

Never build SQL queries through unsafe string concatenation.

Unsafe:

```js
const query = "SELECT * FROM users WHERE id = " + req.params.id;
```

Use parameterized queries or the project's database abstraction layer.

Correct concept:

```text
User Input
   ↓
Parameterized Query
   ↓
MySQL
```

---

# 18. MySQL Security

MySQL credentials must remain server-side.

The database should not be directly accessible from the public React application.

Correct:

```text
Internet
   ↓
Express
   ↓
MySQL
```

Incorrect:

```text
Internet
   ↓
MySQL
```

---

# 19. Database User Permissions

The application's MySQL user should receive only the privileges required by PCT.

Avoid using a database root account for normal application queries.

Recommended principle:

```text
Application User
    ↓
Only Required Database Permissions
```

---

# 20. Database Credentials

Never store database credentials in:

```text
React files
JavaScript frontend bundles
Git repository
README.md
Documentation
Screenshots
Activity Logs
Error Messages
```

---

# 21. Error Handling

Production errors must not expose internal implementation details.

Never return:

```text
Database Password
SQL Queries
Filesystem Paths
Stack Traces
Environment Variables
Internal Credentials
```

to normal clients.

---

# 22. Production Error Response

Example:

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An unexpected error occurred."
  }
}
```

Detailed errors may be logged server-side.

---

# 23. Security Headers

Express should use appropriate HTTP security headers.

Recommended security middleware:

```text
Helmet
```

At minimum, evaluate:

```text
Content-Security-Policy
X-Content-Type-Options
Referrer-Policy
Strict-Transport-Security
X-Frame-Options
```

Configuration must remain compatible with the React application.

---

# 24. Content Security Policy

A Content Security Policy should be introduced where practical.

The policy should restrict:

```text
Scripts
Styles
Images
Fonts
Frames
Connections
```

Do not blindly copy a restrictive CSP that breaks the application.

Test CSP in production-like environments before enforcing it.

---

# 25. XSS Protection

PCT must protect against Cross-Site Scripting.

Avoid rendering untrusted HTML directly.

Dangerous patterns include:

```text
dangerouslySetInnerHTML
```

with unsanitized user content.

User-generated content should be escaped or sanitized before HTML rendering.

---

# 26. React Security

React reduces many common HTML injection risks by default.

However, developers must still avoid:

```text
Unsafe HTML injection
Untrusted URLs
Unsafe DOM manipulation
Client-side secret storage
```

---

# 27. CSRF Protection

CSRF requirements depend on the authentication mechanism.

If authentication uses cookie-based sessions, implement appropriate CSRF protection.

If using bearer tokens that are not automatically attached by the browser, CSRF exposure differs, but XSS and token theft remain important risks.

The chosen authentication strategy must be documented in:

```text
AUTHENTICATION.md
```

---

# 28. Session Security

If PCT uses cookie-based sessions:

Cookies should use appropriate flags:

```text
HttpOnly
Secure
SameSite
```

Example concept:

```text
HttpOnly = true
Secure = true
SameSite = Lax/Strict
```

Exact configuration should match the authentication architecture.

---

# 29. Token Security

If token-based authentication is used:

```text
Tokens must not be exposed unnecessarily.
```

Avoid storing long-lived sensitive tokens in insecure browser storage where possible.

Never place authentication secrets in URLs.

Bad:

```text
/panel?token=SECRET
```

---

# 30. Logout

Logout must invalidate the user's authentication state.

After logout:

```text
Protected API
      ↓
Request
      ↓
Unauthorized
```

The frontend should also clear relevant authentication state.

---

# 31. Disabled Accounts

A disabled account must not be allowed to continue normal protected operations.

Example:

```text
User
 ↓
Status = DISABLED
 ↓
Protected Request
 ↓
Denied
```

Depending on the authentication architecture, active sessions may also need invalidation.

---

# 32. Brute Force Protection

Login endpoints should have protection against repeated failed authentication attempts.

Possible mechanisms:

```text
Rate Limiting
Temporary Lockout
Progressive Delay
Monitoring
```

Do not permanently lock accounts based solely on a small number of failed attempts.

---

# 33. Rate Limiting

Rate-limit sensitive endpoints.

Priority endpoints:

```text
POST /api/auth/login
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

Also consider rate limiting expensive APIs.

Normal application traffic should not be unnecessarily restricted.

---

# 34. Request Size Limits

Express should define reasonable request body limits.

Example:

```text
JSON requests
File uploads
Form submissions
```

Do not allow unlimited request bodies.

This reduces abuse and memory exhaustion risk.

---

# 35. File Upload Security

File uploads require special handling.

Validate:

```text
File Size
File Extension
MIME Type
File Name
Storage Location
```

Do not trust the extension alone.

---

# 36. File Name Security

Never directly use a user-provided filename as a server filesystem path.

Unsafe concept:

```text
/uploads/" + userFilename
```

Use generated or sanitized filenames.

---

# 37. Path Traversal Protection

Reject or safely normalize paths containing malicious traversal patterns.

Examples:

```text
../
..\ 
```

User-controlled input must never determine arbitrary server filesystem locations.

---

# 38. File Storage

PCT files are hosted within the available Hostinger storage environment.

The database should store file metadata/references rather than unnecessarily storing large binary data directly in MySQL.

Conceptual:

```text
MySQL
  ↓
File Metadata
  ↓
Server Storage
  ↓
Authorized Access
```

Actual storage implementation must follow `FILE_SYSTEM.md`.

---

# 39. Private Files

Internal project files should not automatically become public static assets.

If a file requires authorization:

```text
User
 ↓
Authenticated Request
 ↓
Permission Check
 ↓
File Access
```

Do not expose sensitive files through predictable public URLs.

---

# 40. Activity Logging

Important actions should be recorded.

Examples:

```text
Login
Logout
Failed Login
Project Creation
Project Update
Task Assignment
Task Status Change
Review Approval
Revision Request
Role Change
User Disable
File Deletion
```

Detailed activity behavior is defined in:

```text
ACTIVITY_LOG.md
```

---

# 41. Security Event Logging

Security-sensitive events should include useful metadata.

Example:

```text
Event:
Failed Login

Record:
User Identifier
IP Address where appropriate
Timestamp
Result
```

Do not log passwords or authentication secrets.

---

# 42. Log Security

Logs may contain operationally sensitive information.

Protect them from:

```text
Public Access
Unauthorized Users
Frontend Exposure
Git Repository Exposure
```

Logs should have controlled retention.

---

# 43. Authentication Logging

Recommended events:

```text
Successful Login
Failed Login
Logout
Disabled Account Attempt
Password Change
Password Reset
Role Change
```

---

# 44. Authorization Failure Logging

Where appropriate, record repeated or meaningful authorization failures.

Example:

```text
Developer attempted unauthorized project access.
```

Do not flood logs with meaningless repeated events.

---

# 45. CORS

CORS must be configured deliberately.

Production should allow only trusted origins.

Expected primary frontend:

```text
https://pct.permetheon.com
```

Do not use unrestricted production configuration such as:

```text
Access-Control-Allow-Origin: *
```

when credentials or sensitive APIs are involved.

---

# 46. API Exposure

Only required API routes should be exposed.

Do not expose:

```text
Database Management APIs
Debug APIs
Internal Admin APIs
Development Test Endpoints
```

in production unless explicitly required and secured.

---

# 47. Debug Mode

Production must not run with development debugging enabled.

Example:

```env
NODE_ENV=production
```

Avoid returning development stack traces to users.

---

# 48. Dependency Security

Dependencies must be kept reasonably updated.

Regularly review:

```text
npm audit
```

and dependency updates.

Do not blindly update major versions in production without testing.

---

# 49. Package Minimization

Only install dependencies that are actually required.

Avoid unnecessary packages because every dependency increases the application's attack surface.

---

# 50. Environment Separation

Development and production environments should use separate credentials/configuration.

Never use production database credentials for local development unless absolutely necessary.

---

# 51. Git Security

Never commit:

```text
.env
.env.production
Database Credentials
API Keys
Private Keys
Authentication Secrets
Uploaded Private Files
```

Use:

```text
.gitignore
```

appropriately.

---

# 52. Secret Rotation

If a secret is accidentally exposed:

```text
1. Revoke/rotate the secret.
2. Update server configuration.
3. Remove exposed copies where possible.
4. Review access logs.
5. Determine whether unauthorized access occurred.
```

Do not simply delete the secret from the latest Git commit and assume it is safe.

---

# 53. Access Control for Admin

Admin accounts have high privileges.

Recommended practices:

```text
Use strong passwords
Use unique credentials
Avoid shared Admin accounts
Review Admin access periodically
Log sensitive Admin actions
```

---

# 54. No Shared Accounts

Each developer should have an individual PCT account.

Avoid:

```text
developer@permetheon.com
```

being shared by multiple people as one login.

Individual accounts provide:

```text
Accountability
Activity Tracking
Permission Control
Security Auditing
```

---

# 55. Principle of Least Privilege

Users should receive the minimum access necessary.

Example:

```text
Developer
    ↓
Assigned Project
    ↓
Assigned Task
```

not:

```text
Developer
    ↓
Everything in PCT
```

---

# 56. Privilege Escalation Prevention

Users must not be able to escalate privileges through:

```text
Modified API Requests
Modified Request Bodies
Frontend DevTools
Changed User IDs
Changed Role Values
Manipulated URLs
```

Example:

```json
{
  "role": "ADMIN"
}
```

must not allow a Developer to become Admin.

---

# 57. Mass Assignment Protection

Do not blindly update database records from `req.body`.

Unsafe:

```js
User.update(req.body);
```

Only explicitly allowed fields should be accepted.

Example:

```text
name
email
status
```

while sensitive fields such as:

```text
role
password_hash
```

must have separate authorization and validation paths.

---

# 58. API Parameter Security

Validate:

```text
IDs
Pagination
Sorting
Filtering
Search
Status
Role
Dates
```

Use allowlists where possible.

---

# 59. Search Security

Search functionality must not allow raw SQL fragments.

Example:

```text
/api/tasks?search=test
```

must be safely parameterized.

---

# 60. Database Error Exposure

Never return raw MySQL errors to the browser.

Bad:

```text
ER_DUP_ENTRY: Duplicate entry ...
```

unless intentionally transformed into a safe application error.

Good:

```text
A project with this identifier already exists.
```

Detailed database error may remain in server logs.

---

# 61. Security Headers and Cookies

Production configuration should review:

```text
HTTPS
HSTS
Secure Cookies
HttpOnly Cookies
SameSite Cookies
CSP
X-Content-Type-Options
Referrer-Policy
Frame Protection
```

---

# 62. Clickjacking Protection

PCT should not normally be embedded inside another website.

Use appropriate frame protection through security headers.

---

# 63. Sensitive Data Minimization

Only store information required for PCT functionality.

Avoid collecting unnecessary:

```text
Personal Information
Authentication Information
Private Data
```

---

# 64. API Response Minimization

API responses should return only required fields.

Do not return:

```text
password_hash
internal secrets
authentication tokens
unnecessary private fields
```

Example:

```text
GET /api/users
```

should not expose password hashes even though they exist in the database.

---

# 65. Password Reset Security

If password reset is implemented:

```text
Reset Tokens
```

must be:

```text
Random
Short-lived
Single-use
Stored securely
```

Do not reveal whether an email/account exists through overly specific responses if that creates an account-enumeration risk.

---

# 66. Account Enumeration

Authentication-related endpoints should avoid unnecessarily revealing sensitive account existence information.

Example:

Instead of:

```text
This email does not exist.
```

use a neutral response where appropriate:

```text
If the account exists, further instructions will be provided.
```

---

# 67. Session Expiration

Authentication sessions/tokens should have an appropriate lifetime.

Long-lived authentication should not be used without a clear reason.

The exact timeout must follow:

```text
AUTHENTICATION.md
```

---

# 68. Concurrent Sessions

PCT V1 does not require a complex session management dashboard unless needed.

Future versions may support:

```text
Active Sessions
Logout All Devices
Session History
```

---

# 69. Production Database Backups

The MySQL database should have a reliable backup strategy through the hosting environment or approved backup process.

Backups should be protected with the same security expectations as production data.

---

# 70. Backup Security

Backups must not be publicly accessible.

Do not place database dumps inside publicly served frontend directories.

Never commit:

```text
*.sql
database dumps
production backups
```

to the source repository unless explicitly sanitized and intended.

---

# 71. Deployment Security

Before production deployment:

```text
[ ] HTTPS enabled
[ ] Production environment configured
[ ] Secrets configured server-side
[ ] Debug disabled
[ ] Database credentials protected
[ ] CORS configured
[ ] Security headers enabled
[ ] Rate limiting enabled where required
[ ] Authentication tested
[ ] Authorization tested
[ ] File access tested
[ ] Error responses sanitized
```

---

# 72. Hostinger Security

PCT is deployed on Hostinger.

The application should use:

```text
HTTPS
Server-side environment variables
Node.js application runtime
MySQL
Protected server configuration
```

Hostinger's control panel credentials must not be stored inside the application repository.

---

# 73. Production File Permissions

Server-side application files should use appropriate filesystem permissions.

Avoid making application directories writable by unnecessary processes or publicly writable.

---

# 74. Public Directory Security

Only intentionally public assets should be directly accessible.

Do not expose:

```text
.env
server source
database backups
logs
configuration files
private uploads
```

through the web server.

---

# 75. API Security Testing

Before production:

```text
[ ] Test unauthenticated API requests
[ ] Test invalid authentication
[ ] Test disabled users
[ ] Test wrong role
[ ] Test wrong project
[ ] Test wrong task
[ ] Test manipulated IDs
[ ] Test unauthorized file access
[ ] Test mass assignment
[ ] Test SQL injection inputs
[ ] Test XSS payloads
[ ] Test oversized requests
[ ] Test rate limits
```

---

# 76. Frontend Security Testing

Verify:

```text
[ ] Protected pages cannot be accessed while logged out
[ ] Unauthorized navigation is blocked
[ ] Sensitive data is not stored in frontend source
[ ] API credentials are not exposed
[ ] User-generated HTML is sanitized
[ ] Error messages do not expose internals
```

---

# 77. Security Checklist Before Release

```text
Authentication
[ ] Password hashing
[ ] Secure authentication state
[ ] Logout
[ ] Disabled account handling
[ ] Session expiration

Authorization
[ ] RBAC
[ ] Permission middleware
[ ] Resource-level authorization
[ ] Admin protection
[ ] Privilege escalation prevention

Database
[ ] Parameterized queries
[ ] Restricted DB user
[ ] Credentials protected
[ ] Backups secured

API
[ ] Input validation
[ ] Rate limiting
[ ] Request limits
[ ] CORS
[ ] Error sanitization

Frontend
[ ] XSS protection
[ ] No secrets
[ ] Protected routes
[ ] Safe file handling

Files
[ ] Upload validation
[ ] Size limits
[ ] Safe filenames
[ ] Private file authorization

Infrastructure
[ ] HTTPS
[ ] Secure headers
[ ] Production configuration
[ ] Debug disabled

Logging
[ ] Security events
[ ] Activity events
[ ] No passwords/secrets in logs
```

---

# 78. Incident Response

If a security incident occurs:

```text
1. Identify the issue.
2. Contain affected access.
3. Rotate compromised credentials.
4. Disable affected accounts if necessary.
5. Review activity and server logs.
6. Identify affected data/resources.
7. Patch the vulnerability.
8. Test the fix.
9. Restore normal access.
10. Document the incident.
```

---

# 79. Security Documentation

Security-related implementation must remain synchronized with:

```text
AUTHENTICATION.md
ROLE_PERMISSIONS.md
API.md
DATABASE.md
FILE_SYSTEM.md
ACTIVITY_LOG.md
ARCHITECTURE.md
DEVELOPMENT.md
```

Any security architecture change should update the relevant documentation.

---

# 80. Security Change Process

For any security-sensitive feature:

```text
Requirement
   ↓
Threat Consideration
   ↓
Authentication Requirement
   ↓
Permission Requirement
   ↓
Input Validation
   ↓
Implementation
   ↓
Security Testing
   ↓
Documentation
   ↓
Production Deployment
```

---

# 81. Definition of Done

PCT security implementation is considered complete when:

```text
[ ] Authentication is secure
[ ] Passwords are hashed
[ ] Protected routes require authentication
[ ] Backend authorization is enforced
[ ] Resource-level access is enforced
[ ] SQL injection protections exist
[ ] Input validation exists
[ ] XSS risks are controlled
[ ] CORS is configured
[ ] Security headers are configured
[ ] Rate limiting exists for sensitive endpoints
[ ] File uploads are validated
[ ] Private files are protected
[ ] Secrets are server-side
[ ] Production errors are sanitized
[ ] Activity/security logging exists
[ ] Database credentials are protected
[ ] Backups are protected
[ ] Security tests pass
[ ] Production deployment is hardened
```

---

# 82. Final Security Model

PCT follows:

```text
                    INTERNET
                        │
                       HTTPS
                        │
                        ▼
                    React App
                        │
                        ▼
                  Express.js API
                        │
              ┌─────────┴─────────┐
              │                   │
       Authentication       Input Validation
              │                   │
              └─────────┬─────────┘
                        │
                   Authorization
                        │
               Role + Permission
                        │
                 Resource Scope
                        │
                        ▼
                    Services
                        │
                Parameterized DB
                        │
                        ▼
                     MySQL
```

The fundamental rule is:

> **The browser is never trusted. Express.js is the security boundary, and every protected operation must be authenticated, authorized, validated, and scoped before reaching MySQL or private server resources.**
