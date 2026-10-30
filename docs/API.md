# SkillBarter-Next API Documentation

All endpoints are versioned under `/api/v1` (with backward-compatible `/api` aliases for core routes).

## Base Envelopes

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [{ "field": "email", "message": "Invalid email format" }]
  }
}
```

---

## 1. System & Health

- `GET /api/v1/health` — Application health check (Public)
- `GET /api/v1/ready` — MongoDB readiness check (Public; reports `connected` / `disconnected` without leaking credentials)

---

## 2. Authentication (`/api/v1/auth`)

- `POST /register` — Register a new account (`email`, `password`, `displayName`). Rate limited.
- `POST /login` — Sign in and receive access/refresh tokens. Rate limited.
- `POST /logout` — Clear session cookies.
- `GET /me` — Retrieve current authenticated user (Bearer token or cookie required).
- `POST /verify-email` — Verify email via single-use expiring token.
- `POST /forgot-password` — Request password reset token. Rate limited.
- `POST /reset-password` — Set new password using reset token. Rate limited.
- `POST /change-password` — Change password for authenticated user (`currentPassword`, `newPassword`).
- `POST /refresh` — Refresh access token using refresh token.

---

## 3. Users & Profiles (`/api/v1/users`)

- `POST /onboarding` — Complete multi-step onboarding (`displayName`, `bio`, `location`, `offeredSkills`, `wantedSkills`, `preferredSessionFormat`, `availability`).
- `GET /:id` — Retrieve public profile and skills for a user (respects privacy settings and blocking).
- `PATCH /profile` — Update authenticated user's profile information.

---

## 4. Skills (`/api/v1/skills`)

- `GET /` — Browse canonical skills catalog (`category`, `search`, `page`, `limit`).
- `POST /` — Propose a new skill in the catalog.
- `GET /user` — List authenticated user's offered and wanted skills.
- `POST /user` — Add a skill to authenticated user's profile (`type: offered | wanted`, `proficiency`, `yearsExperience`, `description`).
- `PATCH /user/:id` — Update proficiency or description for a user-skill.
- `DELETE /user/:id` — Remove a skill from authenticated user's profile.

---

## 5. Discover & Matching (`/api/v1/matches`)

- `GET /discover` — Discover complementary skill matches.
  - Queries: `category`, `search`, `format`, `page`, `limit`.
  - Returns: Compatibility percentage (e.g. 95%), reciprocal match flag, explanation, `theyTeachYouLearn` and `youTeachTheyLearn` lists.
  - Automatically excludes self and two-way blocked users.

---

## 6. Exchanges (`/api/v1/exchanges`)

- `POST /` — Create an exchange request (`recipientId`, `offeredSkillId`, `wantedSkillId`, `proposalDescription`).
- `GET /` — List authenticated user's exchanges (`status` filter optional).
- `GET /:id` — Get exchange details (restricted to participants).
- `PATCH /:id/status` — Transition exchange status (`ACCEPTED`, `REJECTED`, `CANCELLED`).
- `POST /:id/complete` — Confirm completion (mutual confirmation advances status to `COMPLETED`).
- `POST /:id/dispute` — Raise dispute with reason.

### Sessions & Scheduling (`/api/v1/exchanges/:id/sessions`)
- `POST /` — Propose a session time (`title`, `startTime`, `endTime`, `meetingLink`, `notes`). Detects conflicts.
- `GET /` — List scheduled sessions for the exchange.
- `PATCH /:sessionId` — Update session status (`CONFIRMED`, `CANCELLED`, `COMPLETED`).

---

## 7. Messaging (`/api/v1/messages`)

- `GET /conversations` — List user's conversations with last message and unread count.
- `POST /conversations` — Get or create conversation with peer.
- `GET /conversations/:conversationId` — Retrieve paginated messages (marks unread as read).
- `POST /conversations/:conversationId` — Send private message to participant (enforces blocking restrictions).

---

## 8. Notifications (`/api/v1/notifications`)

- `GET /` — List notifications for authenticated user.
- `GET /unread-count` — Count of unread notifications.
- `PATCH /:id/read` — Mark notification as read.
- `POST /mark-all-read` — Mark all notifications as read.

---

## 9. Reviews (`/api/v1/reviews`)

- `POST /` — Submit rating (1-5) and comment for completed exchange (prevents self and duplicate reviews).
- `GET /user/:userId` — Retrieve reviews received by a user.

---

## 10. Community & Connections (`/api/v1/community`)

- `POST /connections` — Send connection request.
- `PATCH /connections/:id/accept` — Accept connection request.
- `DELETE /connections/:id` — Remove or reject connection.
- `GET /connections` — List connections (`status: PENDING | ACCEPTED`).
- `POST /posts` — Publish community post (`title`, `content`, `tags`).
- `GET /posts` — Browse community feed (paginated).
- `DELETE /posts/:id` — Delete post (author or admin only).

---

## 11. Safety (`/api/v1/safety`)

- `POST /block` — Block a user (`userId`, `reason`).
- `DELETE /block/:userId` — Unblock a user.
- `GET /blocked` — List users blocked by authenticated user.
- `POST /report` — Submit moderation report (`targetType: user | message | review | community_post`, `targetId`, `reason`, `description`).

---

## 12. Administration (`/api/v1/admin`)

- `POST /bootstrap` — Secure initial admin bootstrap using access key.
- `GET /stats` — Overall platform metrics (admin only).
- `GET /users` — Paginated user directory with role and suspension filters (admin only).
- `PATCH /users/:id` — Suspend, restore, or modify user roles (admin only; writes to AuditLog).
- `GET /reports` — Review moderation reports (admin only).
- `PATCH /reports/:id` — Resolve or dismiss report, optional account suspension (admin only).
- `GET /audit-logs` — Audit trail of administrative actions (admin only).

---

## 13. Analytics (`/api/v1/analytics`)

- `POST /track` — Record analytics event.
- `GET /summary` — Aggregated event metrics (admin only).
