# Monitoring and Operations Foundation

Complies with `09-observability-operations.md` and Graduation Thesis Section 4.4 (Giám sát và Vận hành).

## 1. Observability Invariants
1. **Health Probes**:
   - `/health/live` (Liveness - process health)
   - `/health/ready` (Readiness - verifies Oracle Database connectivity and fail-closed state)
2. **Request Tracing**:
   - `X-Correlation-ID` header propagated across client (React/Flutter), API (`CorrelationIdMiddleware`), and database calls.
3. **Operational Alert Priorities**:
   - **P1**: Urgent operational condition (complete outage, database unreachable, readiness probe failed).
   - **P2**: Significant operational condition (elevated HTTP 5xx error rate > 5%, high CPU/memory > 80% for 2m).
   - **P3**: Informational / routine operations (backup completed, scheduled batch).
4. **Security Incident Telemetry**:
   - Repeated authentication failures and cross-branch access violations are logged and alerted.
   - Logs NEVER capture sensitive credentials, private keys, passwords, or PII.

---

## 2. Monitoring Configuration Files
- **`prometheus.yml`**:
  - Scrapes metrics from `pharma-webapi` (`/metrics`) and readiness probe (`/health/ready`).
  - Evaluates alert rules defined in `alert_rules.yml`.
- **`alert_rules.yml`**:
  - `DatabaseReadinessProbeFailed` (P1): Fires if database connectivity fails for > 30s.
  - `HighApiErrorRate` (P2): Fires if HTTP 5xx error rate exceeds 5% in a 5-minute rolling window.
  - `HighCpuOrMemoryUsage` (P2): Fires if CPU or memory usage exceeds 80% for > 2 minutes.
- **`alertmanager.yml`**:
  - Routes alerts by severity (`P1` routed to on-call incident team, `P2` routed to operations team).
  - Webhooks and SMTP credentials are provided exclusively via environment variables (`SMTP_AUTH_PASSWORD`, `OPS_WEBHOOK_URL`, etc.). Zero hardcoded secrets.

---

## 3. Running with Docker Compose
To launch the monitoring stack alongside the backend:
```bash
docker compose -f deploy/docker/docker-compose.yml up -d prometheus alertmanager
```
Verify targets in Prometheus dashboard: `http://localhost:9090/targets`
