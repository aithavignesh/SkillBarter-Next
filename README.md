# SkillBarter-Next

SkillBarter-Next is a modern full-stack web application connecting individuals who want to exchange skills fairly without money. A developer can teach Python in exchange for another user's frontend design mentoring, spoken language practice, or data analysis expertise.

## Technology Stack

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons
- **Backend:** Node.js, Express.js, TypeScript, REST API
- **Database:** MongoDB, Mongoose ODM with schema validations and compound indexes
- **Validation & Contracts:** Zod shared contracts package (`@skillbarter/shared`)
- **Security:** Argon2id password hashing, JWT access and refresh sessions, Helmet, CORS with credentials, sensitive log redaction
- **Testing:** Vitest test runner, Supertest API integration tests, in-memory MongoDB test server (`mongodb-memory-server`)

---

## Workspace Structure

```text
SkillBarter-Next/
├── frontend/             # Next.js App Router frontend application
│   ├── src/app/          # 23 functional pages and dynamic routes
│   ├── src/components/   # Reusable UI components (Navbar, Footer, Modals)
│   ├── src/context/      # React Authentication context and state
│   ├── src/services/     # Centralized type-safe API client
│   └── tests/            # Frontend unit and client tests
├── backend/              # Express REST API service
│   ├── src/config/       # Environment parsing & database connection
│   ├── src/middleware/   # Auth, role check, request logging, error handling
│   ├── src/models/       # 15 Mongoose data models with strict schemas & indexes
│   ├── src/modules/      # Modular domains (auth, users, skills, matches, exchanges, messages, notifications, reviews, community, safety, admin, analytics)
│   └── tests/            # Comprehensive Supertest end-to-end integration test suite
├── shared/               # Shared TypeScript types and Zod validation schemas
├── docs/                 # Architectural, database, API, and testing documentation
└── .github/workflows/    # Continuous integration verification
```

---

## Prerequisites

- **Node.js:** `>= 20.11.0` (Node 22 recommended)
- **npm:** `>= 10.2.0`
- **MongoDB:** MongoDB 6.0+ or MongoDB Atlas (for local dev; automated tests use isolated in-memory MongoDB)

---

## Getting Started

### 1. Clone & Switch to Development Branch

```bash
git clone https://github.com/aithavignesh/SkillBarter-Next.git
cd SkillBarter-Next
git checkout development
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
# On Windows PowerShell
Copy-Item .env.example .env
```

Review default values:
- `PORT=4000`
- `FRONTEND_URL=http://localhost:3000`
- `MONGODB_URI=mongodb://127.0.0.1:27017/skillbarter_next`
- `JWT_ACCESS_SECRET=your-secure-access-secret`
- `JWT_REFRESH_SECRET=your-secure-refresh-secret`

### 4. Build Shared Contracts

```bash
npm run build -w shared
```

### 5. Start Local Development

Run both the Express backend and Next.js frontend concurrently:

```bash
npm run dev
```

Or run each service individually:

```bash
# Backend API (runs on http://localhost:4000)
npm run dev:api

# Frontend Web Application (runs on http://localhost:3000)
npm run dev:web
```

---

## Verification & Testing

Run all checks:

```bash
# Type checking across all workspaces
npm run typecheck

# Linting
npm run lint

# Automated integration and unit tests
npm test

# Full production build (shared, backend, frontend)
npm run build
```

---

## Health and Readiness Endpoints

- Application Health: `GET /api/v1/health`
- Database Readiness: `GET /api/v1/ready`

---

## Repository Branch Policy

- All ongoing implementation occurs on the `development` branch.
- The `main` branch is protected and untouched.
- The original SkillBarter legacy repository and its database remain completely untouched.

## Staging Deployment Checklist (Render + Vercel)

The backend is intentionally fail-closed in production. Configure real values in the hosting provider's secret/environment settings; never commit secrets or use placeholder values.

### Required backend environment

Set these on the Render backend service:

- `NODE_ENV=production`
- `FRONTEND_URL`: the deployed frontend origin (HTTPS, without a trailing slash)
- `PUBLIC_API_URL`: the public backend origin (HTTPS, without a trailing slash)
- `MONGODB_URI`: the MongoDB Atlas connection string for the staging database
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `ADMIN_BOOTSTRAP_SECRET`: separate, strong secrets of at least 32 characters; do not reuse values
- `RESEND_API_KEY`: a real Resend API key
- `EMAIL_FROM`: a sender identity verified with the email provider, for example `SkillBarter <noreply@your-verified-domain.example>` only after replacing the example domain with a verified one

Do not set `EMAIL_DISABLED=true` in production. Email verification and password recovery depend on the configured email provider. If the backend exits with a message that `RESEND_API_KEY` or `EMAIL_FROM` must be explicitly configured, fix the hosting environment with real credentials rather than weakening validation.

### Render health check

Configure the Render web service health-check path as `/api/v1/ready`. This endpoint checks database readiness; `/api/v1/health` is the liveness endpoint. The service settings in the Render dashboard must match the `healthCheckPath` in `render.yaml`.

### Release verification

After deploying, verify in order:

1. The Render deploy reaches **Live** and application logs show no startup/configuration errors.
2. `GET /api/v1/health` returns a healthy response.
3. `GET /api/v1/ready` returns success only when MongoDB is connected.
4. Register a staging test account and confirm the verification email is delivered.
5. Verify the account, log in, refresh the session, and test password recovery.
6. Run the two-user exchange flow through request, acceptance, scheduling, messaging, completion, and review.
7. Run the repository CI checks: `npm run check`.

Do not mark the migration production-ready based on a successful frontend build alone. Backend startup, database readiness, email delivery, and the critical user journey must also be verified.

