---
trigger: always_on
---

# PharmaBranch Project Governance

## 1. Project Context

This project is a multi-branch pharmacy management system.

Technology baseline:

- Web: ReactJS
- Mobile: Flutter / Dart
- Backend: C# / .NET 8 / ASP.NET Core
- Database: Microsoft SQL Server
- Architecture: Client-Server / N-Tier
- Authentication: JWT
- Authorization: RBAC
- Database isolation: Row-Level Security (RLS)
- Sensitive data protection: Column-Level Security (CLS)
- Transactions: ACID
- Concurrency control: SQL Server transaction and locking mechanisms

Core business domains:

- Identity & Security
- Branch / Organization
- Drug Catalog
- Inventory
- Procurement
- Sales
- Payment
- Returns
- Digital Signature
- Audit Logging
- Backup & Recovery
- Monitoring & Load Testing

## 2. General Engineering Rules

- Prefer existing project architecture over introducing new frameworks.
- Do not rewrite working modules without evidence.
- Do not introduce dependencies unless they are necessary.
- Do not change public API contracts without checking all consumers.
- Do not change database schema without checking the ERD and existing dependencies.
- Do not modify unrelated modules when implementing a feature.
- Keep changes minimal and traceable.
- Preserve existing naming conventions unless there is a documented reason to change them.

## 3. Evidence First

Before modifying code:

1. Inspect the relevant files.
2. Identify the current implementation.
3. Trace dependencies.
4. Identify affected API/database/frontend layers.
5. State assumptions when evidence is incomplete.

Never claim that an issue exists only because the code "looks wrong".

## 4. Scope Control

If a problem is discovered outside the requested task:

- Do not silently fix it.
- Report it separately.
- Explain its impact.
- Wait for explicit approval before modifying it.

## 5. Database Safety

Before changing SQL Server schema:

- Check the current schema.
- Check foreign keys.
- Check indexes.
- Check constraints.
- Check triggers.
- Check stored procedures/functions if applicable.
- Check RLS policies.
- Check CLS/security configuration.
- Check application queries using the affected objects.

Never casually change:

- Primary key types
- Foreign key types
- Table names
- Column names
- Relationships
- RLS policies
- Security predicates

## 6. Security

Security must be enforced server-side.

Never rely only on:

- Frontend route guards
- Hidden buttons
- Disabled UI controls
- Client-side role checks

Authorization must be verified at the API/backend layer.

Branch isolation must not rely only on frontend filtering.

## 7. Branch Isolation

The authenticated user's branch context is security-sensitive.

Trace:

JWT
→ User
→ Branch
→ Backend authorization
→ Database session/context
→ SQL Server RLS
→ Query result

Cross-branch access must be denied.

## 8. RBAC

The system has three primary roles:

- Sales Staff
- Warehouse Staff
- Pharmacy Owner / Manager

Role permissions must be enforced consistently across:

- UI
- API
- Backend service
- Database access

## 9. Transaction and Concurrency

Inventory-changing operations must preserve transactional integrity.

Pay special attention to:

- Concurrent sales
- Inventory deduction
- Returns
- Stock receiving
- Payment
- Invoice creation
- Race conditions
- Lost updates
- Deadlocks
- Rollback behavior

Never remove transaction or locking logic merely to simplify code.

## 10. Auditability

Sensitive operations should be traceable.

Examples:

- Login failures
- Authorization failures
- Price changes
- Inventory changes
- Invoice creation
- Returns
- Sensitive data access
- Administrative operations

## 11. Verification

"Build succeeded" does not mean "feature is correct".

Verification should consider:

- Compilation
- Unit tests
- Integration tests
- API behavior
- Authorization
- Database behavior
- Transaction behavior
- Cross-branch isolation
- Regression impact

## 12. Conflict Handling

If these conflict:

ERD vs database schema
→ STOP and report.

API contract vs frontend usage
→ STOP and report.

Security requirement vs implementation
→ STOP and report.

Existing architecture vs proposed redesign
→ Prefer existing architecture unless redesign is explicitly requested.