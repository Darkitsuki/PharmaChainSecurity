---
trigger: always_on
---

# API Contract and Communication Standards

## 1. Purpose

This rule establishes authoritative API contract standards between clients (ReactJS web, Flutter mobile) and the ASP.NET Core backend for PharmaBranch.

It governs URI design, DTO schemas, status codes, error formatting, query conventions, and API versioning.

## 2. Client/Server API Boundary

The HTTP API is the public boundary of the server-side application:
- Client input is untrusted; all incoming payloads MUST be validated at the API boundary.
- Database entities MUST NOT be exposed directly as public API contracts.
- Presentation controllers MUST map between internal domain models and external DTOs.
- Clients MUST access backend capabilities strictly through published HTTP endpoints.

## 3. URI Conventions and Resource Naming

API endpoints MUST adhere to REST-style URI conventions:
- Paths MUST use lowercase kebab-case nouns: `/api/v1/sale-orders`.
- Collections use plural nouns (`/api/v1/medicines`); instances use IDs (`/api/v1/medicines/{id}`).
- Sub-resources MUST reflect ownership: `/api/v1/sale-orders/{id}/items`.
- CRUD verbs in paths are prohibited (`/api/v1/get-medicines` is forbidden).
- Non-resource actions SHOULD use action sub-paths: `POST /api/v1/sale-orders/{id}/cancel`.

## 4. HTTP Methods and Versioning Baseline

HTTP methods MUST follow standardized semantics:
- **`GET`:** Safe and idempotent retrieval; MUST NOT produce side effects.
- **`POST`:** Resource creation or action execution.
- **`PUT`:** Idempotent replacement of a resource.
- **`PATCH`:** Partial update of specified fields.
- **`DELETE`:** Idempotent deletion or soft deactivation.
- **Versioning:** URIs MUST include major versioning (`/api/v1/...`). Minor changes MUST be backward-compatible.

## 5. Request and Response DTOs

Data Transfer Objects (DTOs) MUST decouple clients from internal storage:
- Mutating endpoints MUST define dedicated Request DTOs.
- Read endpoints MUST return explicit Response DTOs.
- Request DTOs MUST accept only client-mutable fields, preventing mass assignment.
- Response DTOs MUST omit internal artifacts, persistence keys, and sensitive data.

## 6. Standard Response Structure

API responses MUST maintain consistent structure:
- Single resource reads return the resource representation directly or in a `data` envelope.
- Collection reads MUST return an item array alongside pagination metadata.
- Successful responses MUST NOT wrap errors within a `200 OK` status.
- Metadata (correlation IDs, timestamps) SHOULD appear in headers or standard envelopes.

## 7. Validation Contract and Error Model

Validation failures MUST produce structured, machine-readable errors:
- Validation errors MUST return `400 Bad Request` using an RFC 7807 Problem Details envelope.
- Responses MUST include:
  - `status`: HTTP status code.
  - `title` or `code`: Machine-readable error type.
  - `errors`: Map of property names to error messages.
- Error property names MUST match client DTO camelCase casing.

## 8. HTTP Status Codes and Error Semantics

HTTP status codes MUST reflect actual operational outcomes:
- **`200 OK`:** Successful read, update, or action with response body.
- **`201 Created`:** Resource creation; SHOULD include `Location` header.
- **`204 No Content`:** Successful mutation with empty body.
- **`400 Bad Request`:** Malformed syntax or validation failure.
- **`401 Unauthorized`:** Missing, invalid, or expired authentication token.
- **`403 Forbidden`:** Identity lacks permission or branch scope.
- **`404 Not Found`:** Resource missing or out of branch scope.
- **`409 Conflict`:** State conflict (duplicate code, concurrency race).
- **`422 Unprocessable`:** Valid request syntax violating business rules.
- **`500 Server Error`:** Unexpected server-side failure.

## 9. Pagination Standards

Collection endpoints MUST enforce bounded pagination:
- Unbounded collection queries are prohibited.
- Parameters MUST use `page` (1-indexed) and `pageSize`.
- The API MUST enforce maximum page size limits (max 100) with sensible defaults (20).
- Responses MUST include: `page`, `pageSize`, `totalCount`, and `totalPages`.

## 10. Filtering, Sorting, and Search

Collection querying MUST follow predictable patterns:
- **Filters:** Filters MUST match DTO property names (`?status=COMPLETED`).
- **Date ranges:** Range filters MUST use explicit bounds (`?startDate=...&endDate=...`).
- **Sorting:** Sorting MUST use `sortBy` and `sortOrder`. Allowed fields MUST be whitelisted.
- **Search:** Free-text searches MUST use `?q=...` or `?search=...`.

## 11. Date/Time and Monetary Representations

Temporal and financial attributes MUST follow strict formatting:
- **Timestamps:** MUST use ISO 8601 UTC format (`YYYY-MM-DDTHH:mm:ssZ`).
- **Dates only:** Date-only values MUST use `YYYY-MM-DD`.
- **Monetary values:** Prices and totals MUST use exact numeric formats (`DECIMAL`), never floats.
- Currency units SHOULD be standardized per tenant deployment.

## 12. Nullability and Field Serialization

Field serialization MUST maintain unambiguous semantic meaning:
- `null` MUST represent the explicit absence of a value.
- In `PATCH` requests, omitted fields represent "no change"; explicit `null` represents "cleared".
- JSON properties MUST use camelCase serialization.
- Empty collections MUST serialize as `[]`, never `null`.

## 13. Idempotency Contract and Retry Semantics

Operations prone to retry MUST provide idempotency:
- Order creation, payments, and invoice submission SHOULD accept an `Idempotency-Key` header.
- The server MUST cache responses for processed keys and return the cached outcome on retry.
- Concurrent requests with identical keys MUST yield `409 Conflict` or execute safely.
- Duplicate requests MUST NOT produce duplicate business effects.

## 14. Correlation and Request Tracing

Requests and responses MUST support operational tracing:
- Requests SHOULD supply an `X-Correlation-ID` header; the server MUST generate one if absent.
- Correlation IDs MUST be returned in response headers and written to server logs.
- Error payloads MUST reference the correlation ID to assist troubleshooting without leaking internals.

## 15. Branch Scope and Tenant Protection in API Contracts

API contracts MUST conform to tenant isolation:
- Client parameters MUST NOT establish authoritative branch context.
- Client-supplied `branchId` MUST be treated as an untrusted resource ID and validated.
- Cross-branch access MUST return `404 Not Found` or `403 Forbidden` without leaking state.
- Collection responses MUST remain strictly scoped to the caller's authorized branch.

## 16. Sensitive Data Protection and Error Masking

API responses MUST NOT expose internal technical or secret data:
- Production errors MUST NEVER expose stack traces, SQL strings, connection data, or file paths.
- Responses MUST NOT expose password hashes, private keys, or security tokens.
- Column-Level Security (CLS) MUST be reflected in DTOs; unauthorized columns MUST be omitted.

## 17. API Evolution and Compatibility

Contract changes MUST maintain client compatibility:
- **Non-breaking:** Adding optional request fields or new response properties is permitted.
- **Breaking:** Removing fields, renaming properties, or changing types requires a new major version (`/api/v2/...`).
- Deprecated endpoints SHOULD provide `Deprecation` and `Sunset` headers prior to retirement.

## 18. API Documentation and Testing Contract

API contracts MUST be verifiable and documented:
- Contracts SHOULD be documented using OpenAPI / Swagger reflecting runtime DTOs.
- Automated API test suites MUST verify:
  - Input validation (valid payloads pass; invalid yield structured 400).
  - Auth rejection (unauthenticated yields 401; unauthorized yields 403).
  - Branch isolation (cross-branch access yields 404/403).
- Schema drift between client models and backend DTOs MUST fail build validation.

## 19. Greenfield and Evidence-First Verification

Implementation claims require physical evidence:
- Documentation or Swagger specs do NOT prove physical implementation.
- Endpoints MUST be classified based on physical code:
  - `IMPLEMENTED`: Controller, endpoint, DTOs, and passing tests present.
  - `PARTIALLY IMPLEMENTED`: Endpoint exists but contract diverged or lacks validation.
  - `NOT VERIFIED`: Documented in specifications but lacking endpoint code.
  - `NOT IMPLEMENTED`: Required by architecture but absent in codebase.
- Claims of API implementation require inspectable code and route tests.

## 20. Rule Boundaries

- **`08-api-contract.md`:** API contracts, URIs, DTOs, and HTTP status codes.
- **`07-database-integrity.md`:** Relational consistency, keys, and DB constraints.
- **`06-branch-isolation.md`:** Multi-branch tenant data isolation boundaries and RLS.
- **`05-authorization.md`:** Runtime authorization gating and IDOR protection.
- **`04-rbac.md`:** Role definitions and permission matrix models.
- **`03-security.md`:** Authentication, JWT tokens, encryption, and threat defense.
- **`02-architecture-quality.md`:** Transactions, concurrency, and operational quality.
- **`01-architecture.md` & `00-project-governance.md`:** Layering and governance.

## 21. API Contract Invariants

Mandatory API contract invariants:
1. Client input is untrusted; all endpoints MUST validate request DTOs.
2. Internal database entities MUST NOT be exposed as public API contracts.
3. URIs MUST use kebab-case nouns; CRUD verbs in paths are prohibited.
4. HTTP status codes MUST reflect actual outcomes; errors cannot return 200.
5. Validation failures MUST return machine-readable problem details.
6. Collection queries MUST enforce bounded pagination.
7. Dates MUST use ISO 8601 UTC; financial values MUST use exact numeric formats.
8. Client-supplied branch IDs MUST NOT establish authorization scope.
9. Production responses MUST NEVER expose stack traces, SQL, or secrets.
10. Contract claims MUST be backed by physical implementation evidence.
