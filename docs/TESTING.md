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
1. **`src/app.test.ts`** (3 tests)
   - `GET /api/v1/health` returns status ok.
   - `GET /api/health` alias returns status ok.
   - `GET /api/v1/ready` reports database connection status (`connected`).
2. **`src/config/database.test.ts`** (1 test)
   - Verifies environment configuration and local development database URI.
3. **`tests/security.test.ts`** (4 tests)
   - Argon2id password hashing and verification.
   - Rejecting invalid passwords.
   - JWT access token signing, decoding, and expiration validation.
   - Cryptographic random token generation.
4. **`tests/integration.test.ts`** (13 tests)
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

### Frontend Tests (`frontend/tests/`)
1. **`tests/client.test.ts`** (3 tests)
   - Verification of API client service method bindings.
   - Client-side registration schema validation.
   - Client-side onboarding schema validation with skill arrays.

---

## 4. Current Test Verification Evidence

```text
 ✓ backend/src/config/database.test.ts (1 test)
 ✓ backend/tests/security.test.ts (4 tests)
 ✓ backend/src/app.test.ts (3 tests)
 ✓ backend/tests/integration.test.ts (13 tests)
 ✓ frontend/tests/client.test.ts (3 tests)

Total: 5 test files, 24 passed tests, 0 failures.
```
