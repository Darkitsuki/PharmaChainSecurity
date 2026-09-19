---
trigger: always_on
---

# PharmaBranch Architecture

## 1. Architecture Baseline

PharmaBranch follows a Client-Server architecture.

Target architecture:

Client
→ Backend API
→ Application / Business
→ Infrastructure / Persistence
→ SQL Server

Target technologies:
- ReactJS Web
- Flutter / Dart Mobile
- ASP.NET Core / .NET 8
- Microsoft SQL Server
- REST API over HTTPS

These are approved technology targets.

Specific libraries are not mandatory unless they are physically present in the workspace or explicitly approved.

Do not assume EF Core, Dapper, Redux, Riverpod, BLoC, MediatR, or other libraries exist without evidence.

---

## 2. Greenfield Rule

Documentation does not prove implementation.

Never claim that a component exists because it is:
- described in requirements;
- shown in an ERD;
- mentioned in documentation;
- listed as a target technology;
- represented only by a folder.

Implementation claims require physical evidence such as:
- source files;
- project files;
- configuration;
- database scripts;
- tests;
- executable configuration.

If evidence is absent, describe the component as planned, target, or not implemented.

---

## 3. Client Layer

ReactJS and Flutter are client applications.

Clients communicate with the backend through HTTPS APIs.

Clients are responsible for:
- presentation;
- user interaction;
- local UI state;
- presentation validation;
- API communication;
- displaying authorized functionality.

Clients MUST NOT:
- connect directly to SQL Server;
- contain authoritative business rules;
- make final authorization decisions;
- determine trusted branch identity;
- store server secrets;
- contain private signing keys;
- bypass backend validation.

Frontend visibility is a UX mechanism, not a security boundary.

---

## 4. Backend Layer

The backend is the authoritative server-side application.

Logical layers:

### API / Presentation

Responsible for:
- HTTP endpoints;
- request/response models;
- authentication context;
- authorization enforcement;
- input validation;
- HTTP status mapping.

Controllers/endpoints should remain thin.

### Application / Business

Responsible for:
- use cases;
- business rules;
- workflows;
- domain validation;
- orchestration;
- transaction boundaries.

Business logic must not depend on UI behavior.

### Infrastructure / Persistence

Responsible for:
- SQL Server access;
- repositories/data access;
- external services;
- persistence implementation;
- database communication.

### Database

Responsible for:
- persistent data;
- relational integrity;
- constraints;
- indexes;
- transactions;
- RLS where required;
- audit persistence.

---

## 5. Dependency Direction

The preferred dependency direction is:

API
→ Application
→ Infrastructure
→ Database

Rules:

- API may depend on Application.
- Application may depend on defined abstractions.
- Infrastructure implements persistence/integration responsibilities.
- Database is accessed only through approved backend persistence components.
- Lower layers must not depend on presentation/UI layers.
- Client applications must not depend on database implementation details.

Avoid circular dependencies between layers.

---

## 6. API Boundary

The backend API is the boundary between clients and server-side application logic.

API operations must:
- receive untrusted client input;
- validate requests;
- establish authenticated context;
- perform authorization;
- establish resource/branch scope;
- invoke application operations;
- return defined responses.

Client data must never automatically become trusted business state.

Do not trust client-provided:
- user role;
- branch ID;
- ownership;
- price;
- inventory quantity;
- approval state;
- payment state.

---

## 7. Authentication Boundary

Authentication establishes the identity of the caller.

Authentication must be handled by the backend.

The client may store and transmit authentication information according to the approved authentication design, but it is never the authority for identity.

Do not use:
- hidden UI elements;
- localStorage flags;
- client-side role checks;
- client-provided identity;
- client-provided branch identity

as proof of authentication.

Authentication and authorization are separate responsibilities.

---

## 8. Authorization Boundary

Authorization establishes what an authenticated identity may perform.

Authorization must be enforced server-side.

The architecture must support authorization based on:
- identity;
- role/permission;
- branch;
- operation;
- target resource;
- ownership;
- business state.

Prevent:
- vertical privilege escalation;
- horizontal privilege escalation;
- IDOR/BOLA;
- unauthorized state transitions;
- cross-branch access.

Detailed security controls are governed by `03-security.md`.

---

## 9. Branch Context

`CHI_NHANH` is the central organizational boundary.

The expected branch-security flow is:

Identity
→ User
→ Branch
→ Backend Authorization
→ Database Security Context
→ SQL Server RLS / scoped query
→ Result

Branch identity must originate from trusted server-side authentication context.

A client must not be able to switch branches merely by changing a request parameter.

Branch isolation must be enforced server-side.

Detailed branch security requirements belong to the security rules.

---

## 10. Business Module Boundaries

Expected modules include:

- Identity / Authentication
- Branch Management
- User / Role / Permission
- Medicine Catalog
- Inventory
- Procurement
- Sales
- Orders
- Invoicing
- Payments
- Returns
- Digital Signature
- Audit
- Reporting
- Backup / Recovery
- Monitoring

Each module should have clear responsibility.

Modules should communicate through defined application operations.

Avoid allowing unrelated modules to directly manipulate each other's persistence state.

---

## 11. Business Logic Placement

Authoritative business rules belong to the backend.

Examples:
- medicine selling rules;
- inventory availability;
- stock deduction;
- return conditions;
- invoice generation;
- price validation;
- payment transitions;
- approval rules;
- branch restrictions;
- role restrictions.

Frontend logic may improve user experience but must not be the only enforcement point.

---

## 12. Database Boundary

SQL Server is the authoritative persistence layer.

Critical integrity should be protected through appropriate database mechanisms, including:

- primary keys;
- foreign keys;
- unique constraints;
- CHECK constraints;
- indexes;
- transactions;
- RLS where required.

Only approved backend persistence components may access SQL Server.

Clients must never connect directly to the database.

Database schemas must not automatically become public API contracts.

---

## 13. Data Access Boundary

Database access must use parameterized commands or another approved safe data-access mechanism.

Never concatenate untrusted input into SQL statements.

Persistence logic belongs in the Infrastructure/Data Access boundary.

Application code should not contain uncontrolled database access scattered throughout business modules.

The selected ORM, micro-ORM, or database library must be based on project evidence and explicit technology decisions.

---

## 14. Configuration Boundary

Environment-specific configuration must remain outside hard-coded application logic where practical.

Sensitive configuration includes:
- database credentials;
- authentication secrets;
- API credentials;
- encryption keys;
- signing keys.

Secrets must not be embedded in ReactJS or Flutter applications.

Production secrets must not be committed to source control.

---

## 15. Architecture Verification

Before declaring architecture complete, verify:

- Client/server boundary
- Backend layers
- API boundary
- Database boundary
- Dependency direction
- Authentication boundary
- Authorization boundary
- Branch boundary
- Module boundaries
- Data-access boundary
- Configuration boundary

Physical evidence is required.

A folder, document, diagram, or planned component does not prove implementation.

---

## 16. Architecture Change Control

Before introducing a new framework, persistence technology, state-management library, authentication mechanism, or major architectural pattern:

1. inspect the workspace;
2. identify existing dependencies;
3. explain the reason;
4. identify affected layers;
5. evaluate compatibility;
6. evaluate security impact;
7. update architecture documentation when required;
8. verify the implementation.

Do not introduce technology merely because it is commonly used elsewhere.

---

## 17. Technology Selection

Approved technology targets:

- ReactJS
- Flutter / Dart
- ASP.NET Core / .NET 8
- Microsoft SQL Server

Specific libraries remain implementation choices unless physically present or explicitly approved.

Do not mandate:

- EF Core;
- Dapper;
- Redux;
- Riverpod;
- BLoC;
- MediatR;
- a specific JWT library;
- a specific testing framework.

Technology choices must consider:
- project requirements;
- existing implementation;
- security;
- maintainability;
- compatibility;
- team/project constraints.

---

## 18. Greenfield Implementation

When implementation begins, the preferred order is:

1. Solution/project structure
2. Database foundation
3. Backend foundation
4. Authentication
5. Authorization/RBAC
6. Branch isolation
7. Core business modules
8. ReactJS Web
9. Flutter Mobile
10. Testing
11. Monitoring
12. Backup/recovery
13. Deployment

The order may change when dependencies require it, but architectural boundaries must remain valid.

---

## 19. Architecture Conflict Rule

If implementation conflicts with this architecture:

STOP and report the conflict before making unrelated changes.

Examples:

Client directly accesses SQL Server
→ STOP

Business logic exists only in frontend
→ STOP

API bypasses the Application layer without justification
→ STOP

Database access is scattered through presentation code
→ STOP

Client determines trusted branch identity
→ STOP

Lower layers depend on UI layers
→ STOP

Do not silently work around architectural violations.

---

## 20. Final Architecture Principle

Maintain:

Client
→ API
→ Application
→ Infrastructure
→ SQL Server

The client presents and requests.

The API protects the boundary.

The Application layer owns business operations.

Infrastructure owns persistence and integrations.

SQL Server owns authoritative persistent data and database integrity.

When uncertain:

Inspect evidence first.
Do not guess.
Do not bypass architectural boundaries.