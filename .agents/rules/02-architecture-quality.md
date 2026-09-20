---
trigger: always_on
---

# PharmaBranch Architecture Quality Rules

## 1. Purpose

This rule defines architectural requirements for:

- transactions;
- concurrency;
- auditability;
- digital-signature boundaries;
- testing;
- observability;
- configuration safety;
- verification;
- architecture quality.

The main architecture structure is defined in `01-architecture.md`.

Security-specific requirements are defined in `03-security.md`.

---

## 2. Transaction Boundaries

Operations modifying related business data require appropriate transaction boundaries.

Examples:
- creating an order and order items;
- inventory deduction;
- invoice creation;
- processing returns;
- recording stock movements;
- payment state changes.

A failure in an atomic business operation must not leave inconsistent partial state.

Transactions should be:
- explicit;
- as short as practical;
- limited to the required database work.

Avoid unnecessary network calls or long-running operations inside database transactions.

---

## 3. Inventory Transactions

Inventory is a concurrency-sensitive business area.

Operations such as:
- selling medicine;
- receiving stock;
- returning medicine;
- adjusting stock;
- transferring stock

must preserve inventory consistency.

Inventory quantity changes and corresponding transaction records must follow a defined atomic operation.

Do not update stock independently from its required transaction record when both must remain consistent.

---

## 4. Concurrency Control

The implementation must consider:

- race conditions;
- lost updates;
- duplicate requests;
- overselling;
- concurrent stock changes;
- concurrent returns;
- concurrent payment operations;
- invalid state transitions.

Use appropriate mechanisms such as:
- Oracle Database transaction isolation;
- locking;
- optimistic concurrency;
- unique constraints;
- atomic updates;
- idempotency controls.

The mechanism must be selected according to the actual business operation.

A read followed by UPDATE is not automatically safe against concurrent modification.

---

## 5. Idempotency

Operations that may be retried must consider duplicate execution.

Examples:
- order creation;
- payment requests;
- external payment callbacks;
- inventory operations;
- other non-idempotent API requests.

Where required, use an idempotency key or equivalent server-side mechanism.

Duplicate requests must not create duplicate business effects.

Idempotency must be enforced by the backend and, where necessary, supported by database constraints.

Do not rely only on disabling a frontend button.

---

## 6. State Transitions

Business entities with lifecycle states must use explicit transition rules.

Examples:
- order;
- payment;
- return;
- procurement;
- approval;
- invoice.

Do not allow arbitrary state changes through generic update endpoints.

Each transition should verify:
- current state;
- caller permission;
- branch scope;
- business conditions;
- transaction requirements.

Invalid transitions must be rejected.

---

## 7. Digital Signature Boundary

Digital signatures are server-side responsibilities.

Private signing keys must:
- remain server-side;
- never be sent to clients;
- never appear in API responses;
- never be committed to source control;
- never be written to logs.

Documents requiring signatures must use a defined canonical representation before hashing/signing.

Where SHA-256 is required, calculate the hash from the defined canonical content.

Signature verification must occur through a trusted server-side component.

---

## 8. Auditability

Security-sensitive and business-critical operations should generate immutable audit records.

Examples:
- authentication failures;
- role/permission changes;
- price changes;
- inventory adjustments;
- sales;
- returns;
- invoice operations;
- payment changes;
- approvals;
- digital-signature operations;
- security configuration changes.

Audit records should contain sufficient context, such as:
- actor;
- action;
- resource;
- branch;
- timestamp;
- result;
- correlation/request ID.

Audit data must not contain:
- passwords;
- authentication tokens;
- private keys;
- database credentials;
- unnecessary sensitive information.

---

## 9. Audit Integrity

Audit records should be protected against unauthorized modification.

Application features must not provide ordinary users with unrestricted ability to:
- alter historical audit records;
- delete audit history;
- rewrite event timestamps;
- change the original actor.

Audit retention and archival policies should be defined separately when required.

---

## 10. Testing Architecture

Testing must verify architectural boundaries, not only UI behavior.

### API Tests

Verify:
- authentication;
- authorization;
- input validation;
- error handling;
- API contracts.

### Authorization Tests

Test combinations of:
- role;
- action;
- resource;
- branch.

### Database Tests

Verify:
- constraints;
- branch isolation;
- RLS where implemented;
- transaction behavior;
- concurrency behavior.

### Business Tests

Verify critical flows:
- purchase;
- inventory deduction;
- invoice;
- payment;
- return;
- approval;
- digital signature.

---

## 11. Negative Testing

Critical security and business controls require negative tests.

Examples:

Unauthorized user
→ request rejected

Wrong role
→ request rejected

Wrong branch
→ request rejected

Invalid state transition
→ request rejected

Insufficient stock
→ operation rejected

Duplicate request
→ duplicate business effect prevented

Concurrent stock modification
→ consistency preserved

Tests should verify both rejection and resulting data state.

---

## 12. End-to-End Verification

Critical workflows should be verified across layers:

Client
→ API
→ Application
→ Infrastructure
→ Database

Examples:
- customer purchase;
- employee sale;
- inventory deduction;
- invoice generation;
- payment;
- return.

A passing frontend test does not prove backend authorization, database isolation, transaction correctness, or concurrency safety.

---

## 13. Observability

The production architecture should provide observability for:

- application errors;
- authentication failures;
- authorization failures;
- database failures;
- transaction failures;
- concurrency failures;
- performance problems;
- critical business operations.

Use correlation/request identifiers where useful to trace one operation across layers.

---

## 14. Logging Rules

Logs must not expose:

- passwords;
- authentication tokens;
- database credentials;
- private signing keys;
- encryption keys;
- unnecessary sensitive information.

Logs should contain enough context for troubleshooting without exposing protected data.

Security failures should be distinguishable from normal business errors.

---

## 15. Error Handling

API errors must not expose internal implementation details.

Do not return:
- SQL statements;
- database credentials;
- stack traces in production;
- internal file paths;
- private configuration;
- sensitive infrastructure information.

Errors should provide useful client-facing information while keeping internal diagnostics server-side.

---

## 16. Performance Boundaries

Performance optimization must preserve correctness and security.

Do not optimize by:
- bypassing authorization;
- bypassing transactions;
- bypassing database constraints;
- disabling audit requirements;
- exposing database access to clients.

Investigate evidence before changing architecture for performance.

Measure before optimizing where practical.

---

## 17. Backup and Recovery

Critical database data requires an explicit backup and recovery strategy.

The implementation should define:
- backup frequency;
- retention;
- storage location;
- recovery procedure;
- recovery verification.

A backup that has never been restored/tested must not be assumed to be recoverable.

Backup credentials and storage access must be protected.

---

## 18. Deployment Quality

Deployment architecture must preserve the same boundaries as development.

Production deployment must not:
- expose Oracle Database directly to clients;
- expose private signing keys;
- expose secrets in frontend bundles;
- disable required authorization;
- bypass branch isolation;
- disable audit logging without explicit approval.

Environment-specific configuration must be handled separately from source code.

---

## 19. Architecture Verification

Before considering an implementation complete, verify:

### Structure
- client/server boundary;
- layer boundaries;
- dependency direction;
- API boundary;
- database boundary.

### Correctness
- transaction boundaries;
- concurrency controls;
- state transitions;
- idempotency;
- database integrity.

### Security
- authentication;
- authorization;
- branch isolation;
- sensitive data protection;
- digital-signature protection.

### Audit
- critical event logging;
- audit integrity;
- log safety.

### Quality
- unit tests;
- integration tests;
- API tests;
- negative tests;
- end-to-end tests.

### Operations
- error handling;
- observability;
- backup/recovery;
- deployment configuration.

Physical evidence is required for implementation claims.

---

## 20. Evidence-First Quality Rule

Evidence > assumption.

Before changing implementation:

1. inspect relevant files;
2. trace dependencies;
3. identify current behavior;
4. identify expected behavior;
5. determine the gap;
6. make the smallest appropriate change;
7. verify the result.

Do not infer implementation from naming alone.

Do not modify unrelated components.

---

## 21. Read-Only Audit Rule

When a task is explicitly READ ONLY:

- do not modify source code;
- do not modify database schema;
- do not modify configuration;
- do not modify tests;
- do not create migration files;
- do not silently fix findings.

Instead:

1. inspect;
2. collect evidence;
3. trace dependencies;
4. reproduce or validate where possible;
5. classify the finding;
6. report the evidence;
7. state uncertainty when evidence is incomplete.

---

## 22. Architecture Change Rule

Changes to transactions, persistence, authentication, authorization, branch isolation, signing, audit, or deployment architecture require explicit review.

Before changing:

- identify affected layers;
- identify affected modules;
- identify security implications;
- identify data implications;
- identify transaction implications;
- identify testing requirements.

After changing:

- verify affected boundaries;
- run relevant tests;
- inspect resulting configuration;
- confirm no architectural boundary was bypassed.

---

## 23. Final Quality Principle

Correctness comes before convenience.

Security comes before UI behavior.

Database integrity comes before optimistic assumptions.

Transactions protect atomic business operations.

Concurrency controls protect shared mutable state.

Auditability preserves accountability.

Testing must verify both success and failure paths.

Observability must support diagnosis without exposing secrets.

When evidence is insufficient:

Do not guess.
Inspect first.
State uncertainty.
Verify before declaring completion.