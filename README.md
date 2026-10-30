# SkillBarter Next

A clean rebuild of SkillBarter using the required application stack:

- **Frontend:** Next.js, React, TypeScript, Tailwind CSS
- **Backend:** Node.js, Express, TypeScript
- **Database:** MongoDB with Mongoose
- **Validation:** Zod
- **Testing:** Vitest and API integration tests

## Repository strategy

Application development happens on `development`. Keep `main` stable; merge only after review and passing checks. This repository is independent of the original SkillBarter repository and its migration branch.

## Planned workspace

```text
frontend/   Next.js application
backend/    Express API
shared/     shared schemas and types
 docs/      architecture and implementation notes
```

## Status

Project initialization. No production services, credentials, or existing user data are included. Configure local environment variables from `.env.example` before running services.

## Development

The root workspace scripts and app packages will be added in the first implementation commit on `development`.
