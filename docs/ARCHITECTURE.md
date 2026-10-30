# Architecture

## Initial boundaries

- `frontend`: Next.js App Router UI; it communicates with the backend through HTTP APIs.
- `backend`: Express API, business rules, authentication, and persistence.
- `shared`: Zod contracts and TypeScript types safe to share between frontend and backend.
- MongoDB is accessed only from the backend through Mongoose.

## Rules

1. Never expose database credentials, signing secrets, or provider secrets to the browser.
2. Validate all untrusted request input at the API boundary.
3. Use explicit DTOs; never serialize password hashes or internal security fields.
4. Enforce authorization on the server, not only in the UI.
5. Keep production and staging databases separate.
6. Do not import existing user data until the source schema and data handling are approved.
7. Implement features end-to-end with unit and integration tests.

## Planned domain modules

Identity and accounts; profiles; skills; discovery and matching; exchange lifecycle; scheduling; messaging; notifications; reviews and trust; community; moderation; administration; analytics.
