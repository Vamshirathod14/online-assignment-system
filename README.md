# Online Assignment & Examination System — CoreSoft

A full-stack MERN application for managing assignments, examinations, and coding assessments.

## Tech Stack

- **Client:** React 18, Vite, Tailwind CSS 3, Monaco Editor
- **Server:** Node.js, Express 4, MongoDB (Mongoose), JWT

## Environment Setup

The frontend uses [Vite environment files](https://vitejs.dev/guide/env-and-mode) to configure the backend API URL per environment.

### Files

| File | Loaded When | Purpose |
|---|---|---|
| `client/.env.development` | `npm run dev` | Local development — points to `http://localhost:5000/api` |
| `client/.env.production` | `npm run build` | Production build — points to the deployed Render backend |
| `client/.env.local` | Always (gitignored) | Personal overrides — never committed |

### Variable

```
VITE_API_URL=<backend-api-base-url>
```

Used in `client/src/services/api.js` as the axios `baseURL`.

### Usage

```bash
# Development (local backend on port 5000)
cd client && npm run dev

# Production build (uses .env.production)
cd client && npm run build
```

> **Do NOT hardcode backend URLs in source files.** Always use `import.meta.env.VITE_API_URL`.

## Project Structure

```
online-assignment-system/
├── client/          # Vite + React frontend
│   ├── .env.development
│   ├── .env.production
│   └── src/
├── server/          # Express + MongoDB backend
│   ├── .env         # Secrets (gitignored)
│   └── src/
└── .env.example     # Server env template
```
