# PharmaSecure API Specifications

Complies with `.agents/rules/08-api-contract.md`.

## Contract Rules
- RESTful kebab-case URIs (`/api/v1/sale-orders`).
- RFC 7807 Problem Details for all validation and error responses.
- Bounded pagination on collection queries (`page`, `pageSize`, `totalCount`, `totalPages`).
- ISO 8601 UTC dates (`YYYY-MM-DDTHH:mm:ssZ`).
- Strict HTTP status code mapping (no 200 OK wrapping error payloads).
- Header `X-Correlation-ID` required or auto-assigned for distributed tracing.
