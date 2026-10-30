# SkillBarter-Next Deployment Guide

## 1. Production Architecture Requirements

SkillBarter-Next is designed for cloud or containerized deployment:
- **Frontend**: Deployable on Vercel, AWS Amplify, Docker, or Node.js hosting.
- **Backend**: Deployable on Railway, Render, AWS ECS, Fly.io, or standard Linux VM.
- **Database**: MongoDB Atlas or self-hosted MongoDB replica set with TLS.

---

## 2. Environment Variables

| Variable | Required | Description | Example |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | Yes | Runtime environment | `production` |
| `PORT` | Yes | Express API listening port | `4000` |
| `FRONTEND_URL` | Yes | Allowed CORS origin for frontend | `https://skillbarter.example.com` |
| `NEXT_PUBLIC_API_URL` | Yes | Public API base URL used by frontend | `https://api.skillbarter.example.com/api/v1` |
| `MONGODB_URI` | Yes | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/skillbarter_next` |
| `JWT_ACCESS_SECRET` | Yes | High-entropy random secret for access tokens | Long random secret (32+ chars) |
| `JWT_REFRESH_SECRET` | Yes | High-entropy random secret for refresh tokens | Long random secret (32+ chars) |
| `ACCESS_TOKEN_TTL` | Optional | Lifetime of short-lived access token | `15m` |
| `REFRESH_TOKEN_TTL` | Optional | Lifetime of refresh token | `7d` |

---

## 3. Production Hardening Checklist

1. **HTTPS & Cookie Security**: In production (`NODE_ENV=production`), auth cookies (`accessToken`, `refreshToken`) automatically have `Secure=true`, `SameSite=strict`, and `HttpOnly=true`.
2. **CORS Restrictions**: Express restricts allowed CORS origins strictly to `FRONTEND_URL` with credentials enabled.
3. **Sensitive Logs**: The request logger automatically strips password, token, authorization, and cookie values from output logs.
4. **Rate Limiting**: Global rate limiting of 200 req/min per IP, with dedicated strict rate limiters of 25 req/15min on authentication and password reset routes.
5. **Admin Bootstrapping**: Initial platform administrator is safely bootstrapped using a secure key via `POST /api/v1/admin/bootstrap`.
