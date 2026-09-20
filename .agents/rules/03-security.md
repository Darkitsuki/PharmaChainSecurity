---
trigger: always_on
---

# PharmaBranch Security Rules

## 1. Security Baseline

This project is a multi-branch pharmacy management system.

Security must be enforced across:

- Client
- API
- Backend
- Database

The frontend is never considered a trusted security boundary.

Never rely solely on:

- Hidden UI elements
- Disabled buttons
- Client-side role checks
- Client-side branch filters
- Frontend route guards

Authorization must be enforced server-side.

Database-level isolation must protect branch data independently of the frontend.

---

## 2. Authentication

Authentication is based on JWT.

Before implementing or modifying authenticated functionality, trace:

Request
→ Authentication middleware
→ Token validation
→ User identity
→ Claims
→ Authorization
→ Branch context

Verify:

- Token validation
- Token expiration
- Signature validation
- User identity
- Role claims
- Branch claims/context
- Authentication failure behavior

Never trust:

- userId supplied by the client
- branchId supplied by the client
- role supplied by the client

when those values can be derived from the authenticated identity.

---

## 3. Authorization

Authorization must be enforced at the backend/API layer.

Use RBAC consistently.

Primary roles:

- SALES
- WAREHOUSE
- OWNER / MANAGER

Before allowing a protected operation, verify:

1. User is authenticated.
2. User has the required role/permission.
3. User belongs to the required branch.
4. The requested resource belongs to the authorized branch.
5. The operation is valid for the current business state.

Never assume:

"User can see the button"
means
"User is authorized."

---

## 4. RBAC Security

RBAC must be evaluated server-side.

For every protected endpoint identify:

- Required role
- Required permission
- Allowed operation
- Resource ownership
- Branch scope
- Failure response

Check for:

- Missing authorization
- Incorrect role checks
- Privilege escalation
- Horizontal privilege escalation
- Vertical privilege escalation
- IDOR / BOLA
- Mass assignment
- Client-controlled authorization parameters

A user must not gain additional privileges by modifying:

- URL parameters
- Request body
- Query parameters
- Headers
- JWT-like client data
- Hidden form fields

---

## 5. Branch Isolation

Branch isolation is a mandatory security boundary.

The authenticated user must be associated with a branch.

Trace branch context through the complete request:

JWT
→ User
→ Branch
→ Backend Authorization
→ Database Context
→ SQL Server RLS
→ Query
→ Result

Never rely only on:

WHERE branch_id = client_supplied_value

when the branch identifier is security-sensitive.

The server must derive or validate branch context from the authenticated identity.

Cross-branch access must be denied.

Examples that must be protected:

- Users
- Drugs
- Drug batches
- Inventory
- Warehouses
- Purchase orders
- Sales invoices
- Invoice items
- Returns
- Payments
- Expenses
- Audit logs
- Other branch-scoped entities

---

## 6. Oracle Virtual Private Database (VPD / Row-Level Security)

Oracle VPD is part of the database security boundary.

When modifying branch-scoped database objects, inspect:

- Security policies (`DBMS_RLS.ADD_POLICY`)
- Function predicates
- Statement types (`SELECT`, `INSERT`, `UPDATE`, `DELETE`)
- Application context (`SYS_CONTEXT`)
- Stored procedures, packages and functions
- Views
- Queries
- Transactions

Do not disable, bypass, or weaken VPD policies merely to make an operation work.

If application behavior conflicts with VPD:

STOP.

Report the conflict before changing the security policy.

---

## 7. Column-Level Security & Oracle Data Redaction

Sensitive information must receive appropriate database-level protection (such as Oracle Data Redaction `DBMS_REDACT` for masking sensitive revenues/salaries).

Examples include:

- Personal information
- Contact information
- Sensitive employee information
- Financial information
- Authentication/security-related information

Before modifying sensitive columns, check:

- Encryption requirements
- Access permissions
- Application usage
- Database roles
- Views
- Stored procedures
- Audit requirements

Do not expose sensitive columns through APIs unless the operation is explicitly authorized.

---

## 8. API Security

Every protected API endpoint must be reviewed for:

- Authentication
- Authorization
- Branch isolation
- Input validation
- Output filtering
- Resource ownership
- IDOR/BOLA
- Mass assignment
- Injection
- Sensitive data exposure
- Error handling
- Rate limiting where appropriate

Never assume an endpoint is secure because the frontend only calls it from an authorized screen.

Direct HTTP requests must also be secure.

---

## 9. Input Validation

Treat all external input as untrusted.

Validate:

- Path parameters
- Query parameters
- Request bodies
- Headers
- File uploads
- Search terms
- Pagination
- Sorting fields
- IDs
- Quantities
- Prices
- Dates
- Status values

Do not trust client-side validation as the security boundary.

Validate business rules on the server.

---

## 10. SQL Injection

Use parameterized queries.

Never construct SQL by directly concatenating untrusted input.

When reviewing database access, inspect:

- Parameter binding
- Dynamic SQL
- Stored procedures
- Query builders
- Filters
- Sorting
- Search
- Pagination

Dynamic SQL requires explicit review.

---

## 11. Sensitive Data Exposure

API responses must contain only the data required by the caller.

Check for accidental exposure of:

- Password hashes
- Authentication tokens
- Security secrets
- Internal identifiers
- Sensitive employee information
- Financial information
- Database information
- Internal exception details

Never return secrets in:

- API responses
- Logs
- Frontend state
- Browser storage
- URLs
- Error messages

---

## 12. Password and Credential Security

Never store plaintext passwords.

Never log:

- Passwords
- JWTs
- Refresh tokens
- API keys
- Private keys
- Database passwords
- Encryption keys

Secrets must not be hard-coded into source code.

Use appropriate configuration/secret management mechanisms.

---

## 13. Digital Signature Security

Invoice digital signatures are security-sensitive.

When implementing or modifying digital signatures, verify:

- Canonical invoice representation
- Hash generation
- SHA-256 usage where specified
- Private key protection
- Signature generation
- Signature storage
- Signature verification
- Tamper detection

The system must distinguish:

Valid signature
from
Invalid signature
from
Missing signature.

Never expose private signing keys to:

- Browser
- Mobile client
- API response
- Logs
- Git repository

---

## 14. Audit Logging

Security-sensitive operations should be auditable.

At minimum consider:

- Login success
- Login failure
- Authorization failure
- Role/permission changes
- User changes
- Price changes
- Inventory changes
- Invoice creation
- Invoice modification
- Returns
- Sensitive data access
- Administrative operations
- Security configuration changes

Audit logs should preserve enough information to reconstruct the event.

Do not allow ordinary users to silently modify or delete security audit records.

---

## 15. Transaction and Security Boundaries

Security-sensitive operations must preserve transactional consistency.

For operations involving:

- Inventory
- Sales
- Returns
- Payments
- Invoices
- Stock receiving

verify:

- Transaction boundary
- Isolation level
- Locking
- Rollback behavior
- Concurrency behavior

Do not weaken transaction isolation or remove locking without evidence that the change is safe.

---

## 16. Error Handling

Do not expose internal implementation details to clients.

Avoid returning:

- SQL statements
- Stack traces
- Database connection details
- File paths
- Internal class names
- Secrets
- Infrastructure information

Errors should be:

- Safe
- Consistent
- Traceable through server-side logs

---

## 17. Security Review Method

For security-related tasks, follow:

Discovery
→ Evidence
→ Trace
→ Finding
→ Risk Assessment
→ Fix
→ Verification

Do not immediately modify code after discovering a potential vulnerability.

First establish evidence.

---

## 18. Read-Only Security Audit

When the task is explicitly an audit or review:

READ ONLY.

Do not modify:

- Source code
- Database schema
- Configuration
- Security policies
- RLS
- Data
- Tests

The audit must produce evidence.

Each finding should identify:

- File
- Class
- Method
- Endpoint
- Database object
- Relevant code/configuration
- Security impact
- Severity
- Confidence
- Recommended remediation

---

## 19. Security Finding Classification

Use:

- CRITICAL
- HIGH
- MEDIUM
- LOW
- INFORMATIONAL

Distinguish:

- Confirmed
- Likely
- Potential
- Needs Verification

Do not label a vulnerability as confirmed without sufficient evidence.

---

## 20. Security Changes Require Verification

After implementing a security fix, verify:

- Positive authorization case
- Negative authorization case
- Cross-role access
- Cross-branch access
- Direct API access
- Invalid input
- Database enforcement
- Regression behavior

"Build succeeded" is not sufficient evidence that a security issue is fixed.

---

## 21. Security Conflict Rule

If any proposed change conflicts with:

- Authentication
- Authorization
- RBAC
- Branch isolation
- RLS
- CLS
- Audit logging
- Digital signature
- Secret protection

STOP and report the conflict.

Do not silently weaken the security boundary.

---

## 22. Security Priority

When engineering convenience conflicts with security:

Security takes priority.

When performance conflicts with security:

Do not weaken security without documented evidence and explicit approval.

When frontend convenience conflicts with backend authorization:

Backend authorization takes priority.

When application behavior conflicts with database RLS:

Do not bypass RLS silently.