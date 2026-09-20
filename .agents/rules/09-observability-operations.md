---
trigger: always_on
---

# Observability and Operations

## 1. Purpose

This rule establishes runtime observability, monitoring, and operational reliability standards for PharmaBranch.

It governs structured logging, request tracing, health checks, dependency metrics, operational alerting, and recovery verification.

## 2. Operational Logging vs. Business Audit Boundary

Operational logs and business audit records serve distinct operational purposes:
- **Operational Logs:** Ephemeral diagnostic telemetry (traces, errors, metrics) for troubleshooting and system health.
- **Business Audit Records (`NHAT_KY_KIEM_TOAN`):** Authoritative, immutable relational records documenting business actions.
- Operational logs MUST NOT be treated as authoritative business audit records.
- Business audit records MUST NOT be commingled into volatile logging sinks.

## 3. Structured Application Logging

Server and client diagnostics MUST be emitted as structured telemetry:
- Backend log events SHOULD serialize as structured key-value pairs or JSON.
- Entries SHOULD capture: UTC timestamp, severity (`Trace` to `Critical`), correlation ID, environment, and category.
- Log message templates MUST use parameterized format strings, preserving queryable property values.

## 4. Sensitive Data Masking and Log Hygiene

Logs MUST NOT become a source of data leakage:
- Telemetry MUST NEVER capture passwords, tokens, private keys, payment secrets, or database credentials.
- PII and Column-Level Security (CLS) attributes MUST be masked or omitted.
- Request and response body logging MUST be disabled in production or filtered through sanitization masks.
- Log sinks MUST enforce restricted administrative access controls.

## 5. Correlation Identifiers and Request Tracing

Requests traversing the system MUST maintain end-to-end trace correlation:
- Inbound HTTP requests SHOULD supply or receive an `X-Correlation-ID` header.
- The backend MUST propagate the correlation ID across asynchronous execution contexts, outbound calls, and log scopes.
- Client applications (ReactJS, Flutter) SHOULD display correlation IDs upon unhandled errors.
- Correlation IDs MUST link API requests, database queries, operational logs, and error responses.

## 6. Health Checks: Liveness and Readiness

The system MUST expose standard HTTP health endpoints:
- **Liveness (`/health/live`):** Verifies process availability. Failure indicates an unrecoverable state requiring restart.
- **Readiness (`/health/ready`):** Verifies application readiness by validating critical dependencies (Oracle Database connectivity).
- Health checks MUST NOT execute expensive queries that degrade database performance.
- Internal connection strings and infrastructure secrets MUST NOT be exposed in health responses.

## 7. Operational Metrics and Latency Monitoring

Runtime performance indicators MUST be measurable across operational boundaries:
- The backend SHOULD collect dimensional metrics for request throughput, latency distributions (p50, p95, p99), and active connections.
- Endpoints exceeding latency thresholds MUST trigger diagnostic tracing.
- Metrics pipelines MUST NOT use unbounded user inputs as metric dimensions.

## 8. Error-Rate and Failure Monitoring

Application errors MUST be observable, classified, and tracked:
- Server-side 5xx responses, unhandled exceptions, and worker faults MUST increment error-rate counters.
- Transient errors (timeouts, transient deadlocks) MUST be differentiated from fatal domain violations.
- Sudden surges in error rates (e.g., > 1% over rolling 5-minute windows) MUST trigger high-priority alerts.

## 9. Database Connectivity and Dependency Observability

Oracle Database interactions represent critical operations requiring explicit monitoring:
- Connection pool exhaustion, transient connection failures, and timeout spikes MUST be logged as distinct events.
- Long-running SQL commands exceeding duration thresholds SHOULD be logged without sensitive parameters.
- If database connectivity is lost, the application MUST fail closed, mark readiness checks unhealthy, and alert operators.

## 10. Security Incident Telemetry: Authentication and Authorization

Security anomalies MUST be measurable to detect brute-force and privilege escalation attempts:
- Authentication failures (invalid credentials, expired tokens, bad signatures) MUST increment security telemetry counters.
- Repeated authentication failures from a single IP or identity SHOULD be detectable and alertable.
- Authorization rejections (HTTP 403 Forbidden, role mismatches) MUST be logged with actor, target resource, action, and correlation ID.

## 11. Tenant Security Monitoring: Cross-Branch Access Anomalies

Attempts to violate branch data isolation MUST generate immediate security telemetry:
- Any request attempting to access or mutate records outside authorized branch scope MUST trigger a security warning event.
- Client injection of mismatched `branchId` parameters MUST be captured with caller identity and timestamp.
- Cross-branch violation events MUST NOT leak target branch record contents or existence into logs or error responses.

## 12. Operational Alerting and Operational Alert Priority

Operational notifications MUST be categorized using Operational Alert Priority:
- **P1:** Urgent operational condition requiring immediate attention (e.g., complete outage, database unreachable, persistent transaction rollbacks).
- **P2:** Significant operational condition requiring timely attention (e.g., elevated error rates, latency degradation, transient database timeouts).
- **P3:** Informational or lower-priority operational condition (e.g., deployment completed, scheduled backup completed, routine node restart).

Operational Alert Priority is distinct from Security Finding Severity:
- P1, P2, and P3 represent Operational Alert Priority only and MUST NOT be interpreted as security finding severity.
- Security finding severity (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`, `INFORMATIONAL`) remains owned and defined exclusively by `03-security.md`.
- Operational alert priority and security finding severity are independent dimensions; no automatic mapping (such as P1 = CRITICAL) exists.
- Alert definitions MUST avoid alert fatigue through debouncing and rolling evaluation windows.

## 13. Deployment Verification and Health Gating

Deployment pipelines MUST verify application health prior to routing operational traffic:
- Post-deployment verification MUST confirm `/health/live` and `/health/ready` endpoints return HTTP 200 OK.
- Smoke tests MUST verify database connectivity, migration status, and basic API routing.
- If verification fails, traffic routing MUST halt and automated rollback procedures MUST execute.

## 14. Backup Monitoring and Verification

Database backups MUST be monitored and verifiable:
- Automated backup routines (full, differential, transaction log) MUST emit success and failure telemetry.
- Failure of a scheduled backup job MUST trigger a high-priority operational alert (P1).
- Backup metadata (timestamp, file size, checksum, completion status) MUST be recorded in an operational log.
- Unmonitored backups MUST NOT be presumed successful.

## 15. Recovery and Disaster Restoration Testing

Data recovery capabilities MUST be verified through periodic operational drills:
- Backup archives MUST be restored to an isolated test environment to verify database consistency.
- Restoration testing MUST verify that restored databases pass Oracle Database integrity checks (`DBMS_HM`).
- Recovery Time Objective (RTO) and Recovery Point Objective (RPO) measurements MUST be documented during exercises.
- A backup that has never been restored and verified MUST NOT be considered recoverable.

## 16. Incident Evidence and Diagnostic Artifacts

Incident resolution requires verifiable diagnostic artifacts:
- During operational incidents, relevant logs, metrics snapshots, and correlation traces MUST be preserved for analysis.
- Crash dumps and diagnostic traces MUST be stored in secure, access-controlled repositories.
- Diagnostic artifacts MUST be sanitized of sensitive credentials before archival.

## 17. Greenfield and Evidence-First Verification

Implementation claims require physical evidence:
- Documentation or architectural diagrams do NOT prove monitoring is active.
- Telemetry capabilities MUST be classified based on physical code:
  - `IMPLEMENTED`: Verified logging sinks, health endpoints, or alert rules present.
  - `PARTIALLY IMPLEMENTED`: Basic logging present but missing correlation or health checks.
  - `NOT VERIFIED`: Documented in specifications but lacking physical configuration.
  - `NOT IMPLEMENTED`: Required by architecture but absent in the codebase.
- Claims require inspectable configuration files, logger invocations, or health registrations.

## 18. Rule Boundaries

Responsibilities are partitioned as follows:
- **`09-observability-operations.md`:** Runtime telemetry, health checks, alerts, and recovery.
- **`08-api-contract.md`:** HTTP contracts, URIs, DTOs, and error models.
- **`07-database-integrity.md`:** Relational integrity, constraints, keys, and migrations.
- **`06-branch-isolation.md`:** Multi-branch tenant data isolation boundaries and RLS.
- **`05-authorization.md`:** Runtime authorization enforcement and IDOR defense.
- **`04-rbac.md`:** Role definitions and permission matrix models.
- **`03-security.md`:** Authentication, credential defense, and security audit policies.
- **`02-architecture-quality.md`:** Transaction boundaries and concurrency controls.
- **`01-architecture.md` & `00-project-governance.md`:** System layering and engineering governance.

## 19. Operational Observability Invariants

Mandatory operational observability invariants:
1. Logs MUST NEVER capture passwords, tokens, private keys, or credentials.
2. Operational diagnostic logs MUST remain distinct from business audit records.
3. Inbound API requests SHOULD carry a traceable correlation identifier.
4. Health checks MUST distinguish process liveness from dependency readiness.
5. Critical database connectivity failures MUST be immediately observable.
6. Repeated auth failures and cross-branch violations MUST emit telemetry.
7. Monitoring tools MUST NOT expose internal secrets on dashboards or logs.
8. Backup completion MUST be actively monitored; silent failures are prohibited.
9. Database restoration MUST be periodically verified; unverified backups are untrusted.
10. Observability claims MUST be supported by physical implementation evidence.