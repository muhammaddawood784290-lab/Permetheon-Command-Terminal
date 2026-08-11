# PCT — File System Specification

**Project:** Permetheon Command Terminal
**Short Name:** PCT
**Domain:** `pct.permetheon.com`
**Storage Provider:** Hostinger Server Filesystem
**Database:** MySQL
**Document Type:** File Storage & Filesystem Specification
**Status:** Active
**Version:** 1.0

---

# 1. Purpose

This document defines how PCT stores, manages, uploads, accesses, and deletes files.

PCT uses the Hostinger server filesystem for physical file storage.

MySQL stores file metadata and relationships.

The system must keep physical file storage separate from database metadata.

---

# 2. Storage Architecture

The file architecture is:

```text
React Frontend
      │
      │ Multipart Upload
      ▼
Express.js Backend
      │
      ├──────────────► Hostinger Filesystem
      │                    │
      │                    └── Physical File
      │
      └──────────────► MySQL
                           │
                           └── File Metadata
```

The frontend never writes directly to the Hostinger filesystem.

---

# 3. Storage Principle

The core rule is:

> **Files live on the Hostinger filesystem. File metadata lives in MySQL.**

Example:

```text
Physical File:

/uploads/tasks/2026/08/abc123.zip
```

MySQL:

```text
original_name = project-files.zip
stored_name   = abc123.zip
file_path     = /uploads/tasks/2026/08/abc123.zip
mime_type     = application/zip
file_size     = 5242880
uploaded_by   = 15
entity_type   = TASK
entity_id     = 102
```

---

# 4. Storage Capacity

Hostinger currently provides approximately:

```text
50 GB
```

of available server disk space for the PCT environment.

The application should treat this as a finite resource.

Do not assume unlimited storage.

---

# 5. Root Upload Directory

Recommended root:

```text
/uploads/
```

The upload directory should be located outside the React frontend source/build structure.

Do not store user uploads inside:

```text
client/src/
client/public/
dist/
```

---

# 6. Recommended Folder Structure

Recommended production structure:

```text
/uploads/
│
├── tasks/
│   └── YYYY/
│       └── MM/
│           └── <file>
│
├── projects/
│   └── YYYY/
│       └── MM/
│           └── <file>
│
└── users/
    └── YYYY/
        └── MM/
            └── <file>
```

Example:

```text
/uploads/
├── tasks/
│   └── 2026/
│       └── 08/
│           ├── a83d9f21.zip
│           └── c81f2a91.pdf
│
└── projects/
    └── 2026/
        └── 08/
            └── design-assets.zip
```

---

# 7. Why Date-Based Folders

Date-based folders prevent thousands of files from accumulating inside a single directory.

Recommended structure:

```text
category
  /
year
  /
month
  /
file
```

Example:

```text
tasks/2026/08/file.zip
```

This keeps filesystem organization manageable.

---

# 8. File Categories

Initial file categories:

```text
TASK
PROJECT
USER
```

Additional categories should only be introduced when required by an actual feature.

---

# 9. Task Files

Task-related files should be stored under:

```text
/uploads/tasks/YYYY/MM/
```

Example:

```text
/uploads/tasks/2026/08/8a2f91.zip
```

These files are associated with a task through MySQL metadata.

---

# 10. Project Files

Project-level files should be stored under:

```text
/uploads/projects/YYYY/MM/
```

Example:

```text
/uploads/projects/2026/08/project-assets.zip
```

---

# 11. User Files

If user-specific file storage is required:

```text
/uploads/users/YYYY/MM/
```

User files must still be protected by authorization rules.

Do not assume that being logged in means access to every user file.

---

# 12. File Metadata

Every uploaded file should have a corresponding MySQL record.

Minimum metadata:

```text
id
original_name
stored_name
file_path
mime_type
file_size
uploaded_by
entity_type
entity_id
created_at
```

See:

```text
DATABASE.md
```

for the database schema.

---

# 13. Original Filename

Store the original filename for display purposes.

Example:

```text
original_name:
final-crm-build.zip
```

The original filename must NOT be trusted as the filesystem filename.

---

# 14. Stored Filename

The backend should generate a unique safe filename.

Example:

```text
original:
final-crm-build.zip

stored:
f9a71d3c-final-crm-build.zip
```

or:

```text
stored:
f9a71d3c.zip
```

The exact naming implementation may vary.

The stored filename must prevent collisions.

---

# 15. Filename Security

Never directly use a user-provided filename as a filesystem path.

Reject or sanitize dangerous values such as:

```text
../../file
../../../etc/passwd
..\..\file
```

Path traversal must be prevented.

---

# 16. File Upload Flow

Standard upload flow:

```text
Developer
    ↓
Select File
    ↓
React
    ↓
POST /api/files
    ↓
Authentication
    ↓
Authorization
    ↓
Input Validation
    ↓
File Validation
    ↓
Generate Safe Filename
    ↓
Create Storage Directory
    ↓
Write File
    ↓
Create MySQL Metadata
    ↓
Create Activity Log
    ↓
Return File Metadata
```

---

# 17. Upload Authentication

File uploads require authentication.

Unauthenticated upload attempts must be rejected.

Example:

```text
POST /api/files
        ↓
No Session
        ↓
401 Unauthorized
```

---

# 18. Upload Authorization

Authentication alone is not enough.

The backend must verify that the authenticated user is allowed to upload files to the target entity.

Example:

```text
Developer
   ↓
Upload to Task #102
   ↓
Does developer have access to Task #102?
   ↓
YES → Upload
NO  → 403
```

---

# 19. File Size Validation

The backend must enforce file size limits.

The exact limit should be configured through environment/configuration rather than hardcoded throughout the application.

Example:

```env
MAX_FILE_SIZE_MB=100
```

The actual production value can be adjusted according to Hostinger resources and business requirements.

---

# 20. MIME Type Validation

The backend should validate the uploaded file's MIME type.

Do not rely exclusively on the filename extension.

Example:

```text
filename:
document.pdf

MIME:
application/pdf
```

Both should be reasonably consistent.

---

# 21. File Extension Validation

Where required, validate allowed extensions.

Example allowed types may include:

```text
.pdf
.zip
.rar
.png
.jpg
.jpeg
.webp
.doc
.docx
.xls
.xlsx
.csv
.txt
```

The final allowed list should be based on actual PCT requirements.

Do not allow executable/server-side files unless explicitly required.

---

# 22. Dangerous File Types

By default, do not allow arbitrary executable/server-side files such as:

```text
.php
.exe
.sh
.bat
.cmd
.ps1
```

unless a specific controlled feature requires them.

Uploaded files must never be allowed to become executable server code.

---

# 23. Upload Directory Security

The upload directory must not allow uploaded files to execute as server-side code.

Hostinger/server configuration should be checked to ensure appropriate execution restrictions.

---

# 24. File Path Storage

MySQL should store a relative application path rather than an absolute server filesystem path whenever practical.

Preferred:

```text
/uploads/tasks/2026/08/a83d9f21.zip
```

Avoid storing:

```text
/home/username/domains/example.com/public_html/uploads/...
```

unless the implementation specifically requires it.

This makes deployment paths easier to change.

---

# 25. File Access Flow

A protected file access flow should be:

```text
User
 ↓
React
 ↓
GET /api/files/:id
 ↓
Authentication
 ↓
Authorization
 ↓
Load File Metadata
 ↓
Verify Entity Access
 ↓
Locate File
 ↓
Stream / Return File
```

---

# 26. File Access Security

Never allow users to request arbitrary filesystem paths.

Incorrect:

```text
GET /api/files?path=/uploads/anything.zip
```

Preferred:

```text
GET /api/files/123
```

The backend resolves file ID → metadata → filesystem path.

---

# 27. File ID as Access Reference

The application should use the database file ID as the primary application-level file reference.

Example:

```text
File ID:
123

Path:
uploads/tasks/2026/08/a83d9f.zip
```

Users should not need to know the internal filesystem structure.

---

# 28. Download Behavior

If a file is downloadable, the backend should:

1. Authenticate the user.
2. Verify authorization.
3. Retrieve metadata.
4. Verify physical file exists.
5. Stream/download the file.
6. Return an appropriate content type.

---

# 29. Missing Physical File

If MySQL contains metadata but the physical file no longer exists:

```text
MySQL:
File exists

Filesystem:
File missing
```

The backend should return a controlled error.

Do not expose raw filesystem errors.

Example:

```text
File is currently unavailable.
```

Such inconsistencies should be logged for administrative investigation.

---

# 30. Orphaned Files

An orphaned file is a physical file with no corresponding valid database metadata.

Example:

```text
Filesystem:
abc123.zip

MySQL:
No record
```

The application should avoid creating orphaned files.

Periodic cleanup/administrative tooling may be added later.

---

# 31. Orphaned Database Records

The opposite situation may also occur:

```text
MySQL:
File record exists

Filesystem:
File missing
```

The application should detect this when the file is requested.

Do not silently recreate missing files.

---

# 32. Upload Failure Handling

If physical file storage succeeds but database insertion fails:

```text
Filesystem Write
       ↓
Database Failure
```

The backend should attempt to clean up the newly created physical file.

Goal:

```text
No orphaned file
```

---

# 33. Database Failure Handling

If the database record is created but the physical file operation fails, the metadata record should not remain as a valid uploaded file.

Use an appropriate transaction/cleanup strategy.

---

# 34. File Replacement

If a feature allows replacing a file:

```text
Old File
   ↓
Upload New File
   ↓
Validate New File
   ↓
Store New File
   ↓
Update Metadata
   ↓
Remove Old File
```

Do not delete the old physical file before the replacement has been safely stored.

---

# 35. File Deletion

File deletion requires authorization.

Flow:

```text
Delete Request
 ↓
Authenticate
 ↓
Authorize
 ↓
Load Metadata
 ↓
Delete Physical File
 ↓
Delete / Archive Metadata
 ↓
Create Activity
```

The exact database deletion/archiving behavior must follow `DATABASE.md`.

---

# 36. Developer File Permissions

A developer should normally be able to access files attached to:

```text
Tasks they are authorized to access
Projects they are authorized to access
```

A developer must not access arbitrary files simply by knowing a file ID.

---

# 37. Admin File Permissions

Admins may have broader access according to the authorization system.

Even administrators should access files through controlled application routes rather than arbitrary filesystem paths.

---

# 38. Team Lead File Permissions

Team leads should have access to files belonging to projects/tasks within their authorized scope.

The backend must enforce this.

---

# 39. File Activity Logging

Important file actions should generate activity logs.

Examples:

```text
FILE_UPLOADED
FILE_DOWNLOADED
FILE_DELETED
FILE_REPLACED
```

Follow:

```text
ACTIVITY_LOG.md
```

---

# 40. File Notifications

File uploads do not automatically require notifications.

Notifications should be generated only where the business workflow requires them.

Example:

```text
Developer uploads final build
       ↓
Task submitted for review
       ↓
Reviewer notification
```

The notification belongs to the task workflow, not simply the filesystem operation.

---

# 41. File Metadata Updates

The following metadata should generally be immutable after upload:

```text
stored_name
file_path
file_size
mime_type
uploaded_by
created_at
```

Fields such as display/original name may be editable if the feature supports it.

---

# 42. File Naming Collision Prevention

The system must prevent collisions.

Never assume:

```text
final.zip
```

is unique.

Use a generated identifier.

Recommended approaches:

```text
UUID
Cryptographically random identifier
Database ID + random suffix
```

---

# 43. Directory Creation

The backend should create required date/category directories automatically if they do not exist.

Example:

```text
/uploads/tasks/2026/08/
```

should be created automatically when needed.

Do not require manual directory creation for every upload.

---

# 44. Filesystem Permissions

The Node.js process must have only the filesystem permissions required to:

```text
Read approved files
Create upload directories
Write uploaded files
Delete files when authorized
```

Do not give the application unnecessary server-wide permissions.

---

# 45. Public vs Private Files

By default, PCT uploads should be treated as:

```text
PRIVATE
```

unless a feature explicitly defines a file as public.

Private files should be accessed through authorization-controlled backend logic.

---

# 46. Public Files

If a future feature requires public files:

```text
PUBLIC
```

must be an explicit property/behavior.

Do not make all files public simply because serving them directly is easier.

---

# 47. Storage Configuration

Filesystem paths should be configurable.

Example:

```env
UPLOAD_ROOT=/path/to/uploads
MAX_FILE_SIZE_MB=100
```

The actual production path should be configured on Hostinger.

Do not hardcode environment-specific absolute paths into application logic.

---

# 48. Environment Separation

Development and production uploads must not accidentally share the same directory.

Example:

```text
Development:
/uploads-dev/

Production:
/uploads/
```

The exact paths may differ.

---

# 49. File URL Handling

Do not permanently store environment-specific public URLs in the database.

Prefer storing:

```text
file_path
```

and generating the appropriate access URL when required.

---

# 50. File Streaming

Large files should preferably be streamed rather than fully loaded into server memory.

Avoid patterns that load very large files entirely into RAM.

Preferred concept:

```text
Filesystem
    ↓
Read Stream
    ↓
HTTP Response
    ↓
Client
```

---

# 51. File Upload Memory Usage

Uploads should be handled with appropriate streaming/disk-based middleware where possible.

Avoid unnecessarily storing large uploads entirely in memory.

---

# 52. Storage Monitoring

The application should eventually provide visibility into storage usage.

Potential future metrics:

```text
Total Storage
Used Storage
Remaining Storage
Files Count
Largest Files
```

This is not required for the initial implementation unless explicitly requested.

---

# 53. Storage Warning

Because storage is limited, the system should eventually support configurable warning thresholds.

Example:

```text
80% → Warning
90% → Critical
95% → Emergency
```

Do not implement automatic deletion merely because a threshold is reached.

---

# 54. No Automatic Destructive Cleanup

The system must never automatically delete user files simply to free storage unless a clearly documented retention policy exists.

Storage management should be explicit and auditable.

---

# 55. File Retention

Initial policy:

```text
Keep files indefinitely
```

unless they are explicitly deleted by an authorized user or an approved retention policy is introduced.

---

# 56. File Backup

Filesystem backups should be handled through the hosting/backup strategy.

Application-level file backups are not part of the initial PCT implementation.

Do not store duplicate copies of every uploaded file inside MySQL.

---

# 57. Database and Filesystem Consistency

The application should aim to maintain:

```text
One valid database metadata record
        +
One corresponding physical file
```

for every active uploaded file.

---

# 58. File Upload Atomicity

A file upload should conceptually behave as one operation:

```text
Validate
   ↓
Store physical file
   ↓
Store metadata
   ↓
Activity
```

If a later step fails, the system should clean up where practical.

---

# 59. File Security Checklist

Before production:

```text
[ ] Authentication required
[ ] Authorization required
[ ] Path traversal prevented
[ ] Safe filenames generated
[ ] File size validated
[ ] MIME type validated
[ ] Extension validated
[ ] Dangerous file types blocked
[ ] Upload directory protected
[ ] Arbitrary filesystem access blocked
[ ] Sensitive files not publicly exposed
[ ] Database metadata validated
[ ] Errors do not expose server paths
```

---

# 60. File API

Initial API structure may include:

```text
POST   /api/files
GET    /api/files/:id
DELETE /api/files/:id
```

Additional endpoints may be introduced as required.

All file APIs must follow:

```text
API.md
```

---

# 61. Upload Request

Conceptual request:

```text
POST /api/files
Content-Type: multipart/form-data
```

Possible fields:

```text
file
entity_type
entity_id
```

The backend must validate the entity and the user's access to it.

---

# 62. Upload Response

Conceptual response:

```json
{
  "success": true,
  "data": {
    "id": 123,
    "original_name": "project.zip",
    "file_size": 5242880,
    "mime_type": "application/zip"
  }
}
```

Do not expose unnecessary internal filesystem information to the frontend.

---

# 63. File Access Response

For protected files, the API may return the file directly as a stream rather than returning a permanent public URL.

The exact implementation should depend on security requirements.

---

# 64. File Module Structure

Recommended backend structure:

```text
server/
├── routes/
│   └── fileRoutes.js
│
├── controllers/
│   └── fileController.js
│
├── services/
│   └── fileService.js
│
├── middleware/
│   └── uploadMiddleware.js
│
└── utils/
    └── fileUtils.js
```

Actual project structure may be adjusted to match existing conventions.

---

# 65. Frontend File Components

Recommended frontend structure:

```text
client/src/
├── components/
│   └── files/
│       ├── FileUpload.jsx
│       ├── FileList.jsx
│       ├── FileItem.jsx
│       └── FilePreview.jsx
│
└── services/
    └── fileService.js
```

A preview component should only be implemented for supported file types.

---

# 66. File Upload UI

The upload UI should provide:

```text
Select File
Upload Progress
Success State
Error State
File Name
File Size
```

Do not show a fake upload percentage.

If actual progress tracking is not implemented, use a normal loading state instead.

---

# 67. File Upload Validation UX

Frontend may provide early validation:

```text
File too large
Unsupported file type
No file selected
```

However, backend validation remains mandatory.

---

# 68. Duplicate Files

The system does not need to prevent duplicate content initially.

Two files with the same name may exist if they have different generated storage identifiers.

Example:

```text
project.zip
project.zip
```

can both exist as separate records.

---

# 69. File Versioning

Full version control is NOT required initially.

If a file needs replacement:

```text
New Upload
```

may create a new file record or replace the existing record depending on the feature.

Do not implement a complex versioning system unless required.

---

# 70. Archive Files

ZIP/RAR archives may be uploaded as project/task files where permitted.

The system should store the archive as a file.

Do not automatically extract uploaded archives unless a feature specifically requires it.

---

# 71. Malware Scanning

Automatic malware scanning is NOT part of the initial implementation unless a suitable server-side security solution is explicitly introduced.

File type and upload security controls remain mandatory.

---

# 72. File Preview

Preview support is optional.

Possible preview types:

```text
Images
PDF
Text
```

Large/unsupported files should provide a download/access action instead.

---

# 73. File System and Database Responsibilities

### Hostinger Filesystem

Responsible for:

```text
Actual binary files
Directory structure
Physical storage
```

### MySQL

Responsible for:

```text
File metadata
Ownership
Relationships
Access context
Timestamps
```

### Express.js

Responsible for:

```text
Upload
Validation
Authorization
Filesystem operations
Metadata operations
Download
Deletion
```

### React

Responsible for:

```text
File selection
Upload UI
Progress/loading state
File listing
User interactions
```

---

# 74. What React Must NOT Do

React must not:

```text
Access filesystem directly
Store database credentials
Write files to Hostinger directly
Decide authorization
Construct arbitrary server paths
Trust file permissions supplied by the client
```

---

# 75. What Express Must NOT Do

Express must not:

```text
Trust frontend authorization
Allow arbitrary filesystem paths
Expose database credentials
Expose internal server paths unnecessarily
Allow unrestricted file types
Load huge files entirely into memory without reason
```

---

# 76. File System Completion Criteria

The file system implementation is complete when:

```text
[ ] Files upload successfully
[ ] Files are stored on Hostinger
[ ] Metadata is stored in MySQL
[ ] Safe filenames are generated
[ ] Date/category directories work
[ ] File size validation works
[ ] MIME/extension validation works
[ ] Dangerous file types are blocked
[ ] Authentication is enforced
[ ] Authorization is enforced
[ ] Files can be accessed securely
[ ] Unauthorized file access is blocked
[ ] File deletion works where permitted
[ ] Activity logs are created
[ ] Upload failures are cleaned up
[ ] Missing physical files are handled
[ ] No arbitrary filesystem paths are accepted
[ ] Production storage path is environment-configured
[ ] Large files do not unnecessarily consume server memory
```

---

# 77. Final File System Principle

> **PCT stores physical files on Hostinger and uses MySQL as the metadata and ownership layer. Every file operation must pass through Express.js, where authentication, authorization, validation, and filesystem security are enforced.**

The filesystem should remain simple, secure, predictable, and compatible with the available Hostinger storage.
