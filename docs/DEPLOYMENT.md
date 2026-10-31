# SkillBarter-Next Deployment Guide

## 1. Production Architecture Requirements
SkillBarter-Next is designed for cloud or containerized deployment:
- **Frontend**: Vercel, AWS Amplify, Docker, or Node.js hosting.
- **Backend**: Railway, Render, AWS ECS, Fly.io, or a standard Linux VM.
- **Database**: MongoDB Atlas or a self-hosted MongoDB replica set with TLS.
- **Transactional email**: Resend API with a verified sender domain.

## 2. Backend Deployment with Render

A repository Blueprint is provided at `render.yaml`. In Render, create a new Blueprint instance and select this repository's `development` branch for a non-production validation deployment. The manifest builds the shared package and Express backend, starts the API workspace, and checks `/api/v1/ready`.

Before the service can become ready, set the prompted environment values in Render:
- `FRONTEND_URL`: the exact frontend origin (no trailing path).
- `PUBLIC_API_URL`: the public API origin ending in `/api/v1`.
- `MONGODB_URI`: a dedicated SkillBarter-Next database, not the legacy database.
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and `ADMIN_BOOTSTRAP_SECRET`: three independent random secrets of at least 32 characters.
- `RESEND_API_KEY` and `EMAIL_FROM`: valid Resend credentials and a verified sender.

The manifest deliberately marks secrets as unsynchronized values. Do not paste credentials into Git or commit them to `.env`. Configure the frontend's `NEXT_PUBLIC_API_URL` in its Vercel project to the deployed API URL. Keep this as a preview/staging deployment until the end-to-end checklist below passes.

## 3. Frontend Deployment with Vercel

Create or reuse a Vercel project connected specifically to `aithavignesh/SkillBarter-Next`; do not reuse the legacy `skill-barter` projects unless their Git connection is explicitly confirmed to point at this repository. Configure the monorepo build so the shared workspace is built before the frontend (`npm run build -w shared && npm run build -w frontend`) and set `NEXT_PUBLIC_API_URL` to the Render API base URL ending in `/api/v1`. Verify the project is building the intended branch before assigning any production domain.

## 4. Environment Variables

Configure these in the hosting provider's secret/environment settings. Never commit real credentials.

| Variable | Required in production | Description | Example |
| :--- | :---: | :--- | :--- |
| `NODE_ENV` | Yes | Runtime environment | `production` |
| `PORT` | Yes | Express API listening port | `4000` |
| `FRONTEND_URL` | Yes | Frontend origin used for CORS and password-reset links | `https://app.example.com` |
| `PUBLIC_API_URL` | Yes | Public API base URL, including `/api/v1` | `https://api.example.com/api/v1` |
| `NEXT_PUBLIC_API_URL` | Yes | Public API base URL used by the frontend | `https://api.example.com/api/v1` |
| `MONGODB_URI` | Yes | MongoDB Atlas connection URI for the new SkillBarter-Next database | `mongodb+srv://<user>:<password>@<cluster>/<database>` |
| `JWT_ACCESS_SECRET` | Yes | Unique high-entropy access-token secret (32+ characters) | Set as a secret |
| `JWT_REFRESH_SECRET` | Yes | Different high-entropy refresh-token secret (32+ characters) | Set as a secret |
| `ADMIN_BOOTSTRAP_SECRET` | Yes | Separate one-time administrator bootstrap secret (32+ characters); never reuse a JWT secret | Set as a secret |
| `RESEND_API_KEY` | Yes | Resend API key stored as a secret | Set as a secret |
| `EMAIL_FROM` | Yes | Sender identity on a domain verified in Resend | `SkillBarter <noreply@yourdomain.com>` |
| `ACCESS_TOKEN_TTL` | No | Access-token lifetime | `15m` |
| `REFRESH_TOKEN_TTL` | No | Refresh-token lifetime | `7d` |

Production startup now fails fast if the MongoDB URI, both JWT secrets, or Resend sender credentials are missing. The JWT secrets and `ADMIN_BOOTSTRAP_SECRET` must each be at least 32 characters. The admin bootstrap secret must be distinct from both JWT secrets. Do not use the development defaults in production.

## 5. Resend Setup
1. Create a Resend account and verify a domain you control.
2. Create an API key with email-send permissions.
3. Set `RESEND_API_KEY` and `EMAIL_FROM` in the backend hosting environment.
4. Set `PUBLIC_API_URL` to the public backend URL ending in `/api/v1`.
5. Set `FRONTEND_URL` and `NEXT_PUBLIC_API_URL` to the deployed frontend and backend URLs.
6. Deploy the backend and test registration, email verification, and password reset using an inbox you control.

The API sends verification emails with a 24-hour link and password-reset emails with a one-hour link. Provider keys are never exposed to the frontend. In non-production environments, tokens remain available to the existing development/test flows.

## 6. Production Hardening Checklist
1. **HTTPS & Cookie Security**: In production, auth cookies are `Secure=true`, `SameSite=strict`, and `HttpOnly=true`.
2. **CORS Restrictions**: Express restricts allowed CORS origins to `FRONTEND_URL` with credentials enabled.
3. **Sensitive Logs**: Request logging strips password, token, authorization, and cookie values.
4. **Rate Limiting**: Global rate limiting is enabled, with dedicated limits on authentication and password-reset routes.
5. **Admin Bootstrapping**: Bootstrap the first administrator using the documented secure key only after deployment and secret configuration.
6. **Database Isolation**: Use a dedicated MongoDB Atlas database for SkillBarter-Next. Do not point it at the legacy SkillBarter database.
7. **Backups & Access**: Enable managed backups, restrict network access, use a least-privilege database user, and keep credentials in the host's secret manager.
8. **Final Validation**: Verify `GET /api/v1/health` and `GET /api/v1/ready`, then run end-to-end auth and exchange smoke tests.
