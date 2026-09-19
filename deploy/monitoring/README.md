# Monitoring and Operations Foundation

Complies with `09-observability-operations.md`.

## Observability Invariants
1. Health Probes:
   - `/health/live` (Liveness)
   - `/health/ready` (Readiness)
2. Request Tracing:
   - `X-Correlation-ID` header propagated across client, API, and database calls.
3. Alert Priorities:
   - P1: Urgent operational condition (complete outage, database unreachable).
   - P2: Significant operational condition (elevated error rate, latency degradation).
   - P3: Informational / routine operations.
4. Security Incident Telemetry:
   - Repeated authentication failures and cross-branch access attempts are tracked and alerted.
   - Logs NEVER capture sensitive credentials, tokens, or PII.
