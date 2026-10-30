# SkillBarter-Next

SkillBarter-Next is a modern full-stack web application connecting individuals who want to exchange skills fairly without money. A developer can teach Python in exchange for another user's frontend design mentoring, spoken language practice, or data analysis expertise.

## Technology Stack

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons
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

# Automated integration and unit tests (24 passing tests)
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
