# SkillBarter-Next Testing Guide

## 1. Test Architecture

The testing strategy validates the system at multiple layers:
1. **Unit Tests**: Password hashing (Argon2id), JWT creation/verification, matching rules, Zod contract validation.
2. **API Integration Tests**: Supertest HTTP integration tests against Express with real MongoDB persistence via an isolated `mongodb-memory-server` instance.
3. **End-to-End Multi-User Journey**: Complete two-user reciprocal skill exchange flow from independent registration to final reviews and safety moderation.

---

## 2. Running Automated Tests

Run the full test suite across backend and frontend workspaces:

```bash
npm test
```

Or run tests per workspace:

```bash
# Run backend integration & unit tests
npm test -w backend

# Run frontend schema & client tests
npm test -w frontend
```

---

## 3. Test Suites & Coverage

### Backend Tests (`backend/tests/` and `backend/src/`)
1. **`src/app.test.ts`** (23 tests)
   - Health and readiness routes, secure headers, protected-route authorization, auth refresh/logout behavior, email verification-link safety, and shared session-time validation.
2. **`src/config/database.test.ts`** (1 test)
   - Verifies environment configuration and local development database URI.
3. **`src/config/env.test.ts`** (5 tests)
   - Validates distinct production JWT/admin secrets, minimum secret lengths, and rejects secret reuse.
4. **`tests/security.test.ts`** (4 tests)
   - Argon2id password hashing and verification.
   - Rejecting invalid passwords.
   - JWT access token signing, decoding, and expiration validation.
   - Cryptographic random token generation.
5. **`tests/integration.test.ts`** (13 tests)
   - **Step 1**: Independent registration of User A (Alice) and User B (Bob) with email verification.
   - **Step 2**: Login validation and credential rejection for incorrect credentials.
   - **Step 3**: Onboarding for User A (offering TypeScript, wanting Python) and User B (offering Python, wanting TypeScript).
   - **Step 4**: Discover matching engine computing 95% reciprocal compatibility.
   - **Step 5**: User A creating exchange proposal with User B.
   - **Step 6**: User B accepting exchange proposal.
   - **Step 7**: Proposing session times, conflict check, and session confirmation.
   - **Step 8**: Two-party authenticated private messaging thread.
   - **Step 9**: Mutual exchange completion confirmation and completed counts incrementation.
   - **Step 10**: Star review submission and reputation score recomputation.
   - **Step 11**: Community connections and public feed posts.
   - **Step 12**: Two-way blocking and moderation reporting.
   - **Step 13**: Secure admin bootstrapping, platform stats inspection, user moderation, and audit logs.

6. **`src/modules/users/users.service.test.ts`** (1 test)
   - Verifies onboarding preserves zero years of experience for offered and wanted skills.
7. **`src/modules/admin/admin.service.test.ts`** (3 tests)
   - Verifies literal search, oversized-search rejection, and safe pagination bounds.
8. **`src/modules/safety/block-enforcement.test.ts`** (1 test)
   - Verifies blocks prevent starting conversations and requesting connections.

### Frontend Tests (`frontend/tests/`)
1. **`tests/client.test.ts`** (5 tests)
   - Verifies API client exports and registration/onboarding schemas.
   - Verifies reserved search characters are URL-encoded for skills, matches, and admin search.
   - Verifies expired access tokens refresh once and retry the request.

---

## 4. Current Test Verification Evidence

Latest completed CI run before the deployment-template-only update:
- Backend: **8 test files, 51 passed tests, 0 failures**.
- Frontend: **1 test file, 5 passed tests, 0 failures**.
- Total: **56 passed tests, 0 failures**.

The CI workflow also runs workspace type checking, linting, dependency audit (blocking high/critical findings), and the full production build. Confirm the latest workflow run is green before releasing.
