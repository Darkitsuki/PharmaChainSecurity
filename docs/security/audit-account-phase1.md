# Audit Log and account settings — phase 1

## Runtime access

- `/settings`: all three authenticated roles; only the current account is read or
  updated. Mutable fields are `fullName` and `phoneNumber`. Email, username,
  branch, role and active status are read-only. Unmapped mutation fields are rejected.
- `/security/audit-logs`: OWNER only, within the account's branch, after password
  reauthentication and OTP. Gmail delivery is disabled by default; enabling it
  requires explicit sender configuration.
- There is no fixed production OTP, test-code endpoint or frontend-only unlock.
  `IAuditOtpDelivery` can be replaced through DI; the fixture replacement is
  defined exclusively in the test project.

## API

| Method | Route under `/api/v1` | Access |
|---|---|---|
| GET / PUT | `/account/profile` | Current active account |
| POST | `/account/password` | Current password required |
| POST | `/security/audit-access/challenges` | OWNER, real password check |
| POST | `/security/audit-access/verify` | OWNER, valid single-use challenge and OTP |
| DELETE | `/security/audit-access` | OWNER; revoke sensitive session |
| GET | `/security/audit-logs` | OWNER + temporary grant |
| GET | `/security/audit-logs/statistics` | OWNER + temporary grant |
| GET | `/security/audit-logs/{id}` | OWNER + temporary grant + matching branch |

Audit reads require `X-Audit-Access`. The opaque grant is kept in page memory,
never localStorage or a URL. It is bound to user ID, branch and unique JWT `jti`,
expires within five minutes and cannot outlive the JWT. Challenges expire after
five minutes, allow at most five failed codes and cannot be replayed. Reauthentication,
OTP sends and code verification are limited to five attempts per account in each
five-minute window.
The challenge is bound to the current email address as well as user, branch and
JWT `jti`. Sensitive-session lock/logout revokes the binding; log in again before
obtaining another grant for that binding.

Filters: `startDate` inclusive / `endDate` exclusive UTC instants, `username`,
`eventType`, `outcome`, `search`, `page`, `pageSize`. Defaults cover seven UTC days;
custom ranges are bounded to 93 days, pages to 100 rows, and SQL parameters are bound.
The UI converts browser-local calendar dates to UTC. Unknown events are displayed
as recorded events, not automatically labelled successful. Statistics use the same
filters as the list.

New authentication and account audit timestamps are written as UTC, consistently
with purchase-order events. Existing timestamp-without-time-zone history is kept
unchanged; its original timezone cannot be inferred reliably from the stored value.

## Oracle and audit integrity

No schema, seed, migration or VPD policy is changed. Audit queries use both the
authenticated branch parameter and `SYS_CONTEXT('PHARMA_CTX','BRANCH_ID')` in Oracle.
NULL-branch rows and another branch's IDs are excluded. The inspected Local database
does not have a VPD policy on `AUDIT_LOGS`; this implementation does **not** claim
arbitrary direct SQL under the shared database credential is protected by audit VPD.

Existing login/logout and purchase-order events are reused, not duplicated.
Profile/password and employee create/status events are inserted in the same Oracle
transaction as their mutation. Failure to persist those events rolls back the
mutation. Login/logout audit failures return a safe 503; failed denial-audit writes
produce critical operational telemetry while access remains denied. Raw passwords,
OTP codes, JWTs and private keys are not event payloads. Agent/reason text is bounded
by UTF-8 bytes and common secret patterns are redacted. Existing `FailureReason`
sometimes contains purchase-order references, so the UI labels it content/reason.
No record update/delete API or UI exists; no before/after-value history is invented.

## Passwords and session compatibility

New passwords require 12–64 characters and at most 72 UTF-8 bytes for bcrypt.
Password mutation locks the account row and uses the existing password hasher.
JWTs contain a unique `jti` and an HMAC credential version derived from the stored
password hash and server signing key; the hash itself is never a claim. Every
authenticated request verifies account activity, branch, role and credential version
against Oracle. Password changes therefore invalidate old tokens across process
restarts without a new column. JWTs issued before this feature require fresh login.
This adds one short Oracle lookup per authenticated request and fails closed when
identity cannot be checked.

General logout keeps the existing client token-removal behavior. It revokes audit
access, but this phase does not claim persistent revocation of every ordinary JWT
merely because logout was clicked. Password-change revocation is separate and is
verified against Oracle. Sensitive grants/challenges are in bounded process memory;
restart discards them, so audit access fails closed.

## Gmail OTP configuration

The schema remains unchanged: no email-verification column or migration is used.
The backend sends only to the OWNER email returned from `USERS.Email`; the client
cannot supply or change the destination. The address is validated before sending
and checked again before granting access. Missing or malformed addresses fail
closed. The challenge response contains only a masked destination address.

Gmail uses `smtp.gmail.com:587` with STARTTLS and the platform's normal TLS
certificate validation. There is no plaintext or alternate-transport fallback.
For local Development, copy
`backend/PharmaSecure.WebApi/appsettings.Email.local.json.example` to
`backend/PharmaSecure.WebApi/appsettings.Email.local.json` and follow
[`EMAIL_OTP_LOCAL_SETUP.md`](./EMAIL_OTP_LOCAL_SETUP.md). The local file is
gitignored and loaded only in Development. User Secrets or environment variables
can override it. Production must use a secret manager or environment variables.
The six-digit code is generated server-side, expires after five minutes, is
single-use, and is delivered only after password reauthentication. A failed SMTP
send removes its pending challenge and never grants access.

SMTP delivery, challenges and grants are process-local. A multi-instance
deployment still requires a shared atomic TTL store before enabling this feature.

## Opt-in verification

Default unit tests never open Oracle. `Category=LocalOracle` requires
`PHARMA_LOCAL_INTEGRATION=1` and a private `PHARMA_TEST_CONNECTION` that is checked
for exactly `127.0.0.1:1521/FREEPDB1`, `PHARMASECURE_APP` and the expected PDB.
Tests create clearly marked `it_*` accounts and produce real authentication/audit
events; they do not change seed accounts or delete records.

`Category=LocalBrowser` additionally requires `PHARMA_BROWSER_TESTS=1`, Python
Playwright/Edge and a private evidence directory in `PHARMA_TEST_EVIDENCE`.
`PHARMA_PLAYWRIGHT_PATH` may reference an existing external installation. The test
assembly starts its own loopback Kestrel host with the fixture OTP delivery and
a separate Vite process on 3002, stopped after the test. Fixture OTP crosses only
parent/child stdin, never an HTTP endpoint, UI hint, configuration or log. Normal
configuration uses the unavailable provider unless Gmail SMTP is explicitly
enabled and fully configured. No test keys or credentials belong in Git.

## Remaining security work

No permanent email ownership state is stored in Oracle. Email changes remain
unsupported by account settings. The administrator remains responsible for keeping
each account email accurate; a successful OTP proves access only for that attempt.
Audit VPD, durable ordinary-session logout revocation
and deployment monitoring require their own security review; no claim is made
that these controls are complete.
