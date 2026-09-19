# PharmaSecure Architecture Documentation

## Architectural Model: Client-Server N-Tier
```
React Web / Flutter Mobile
           ↓ HTTPS / REST API
PharmaSecure.WebApi
           ↓
PharmaSecure.Application
           ↓
PharmaSecure.Domain
           ↑
PharmaSecure.Infrastructure
           ↓
Microsoft SQL Server
```

## Layer Responsibilities
- **Domain**: Pure business entities, value objects, domain enums, aggregate roots. Independent of frameworks, ORMs, and UI.
- **Application**: Use cases, DTOs, interfaces, business orchestration, and Result pattern.
- **Infrastructure**: Persistence, database access, external integrations, security context extraction.
- **WebApi**: Composition root, controllers, routing, middleware (CorrelationId, BranchContext), and HTTP status code mappings.

Refer to `.agents/rules/01-architecture.md` for full architectural baseline.
