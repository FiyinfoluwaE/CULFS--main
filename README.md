# CULFS — Covenant University Lost & Found System

This repository contains CULFS, a modern lost-and-found web application built as a school project for a Data Management course. The project demonstrates a full-stack design using a TypeScript + React frontend (Vite) and a Python Flask backend. It focuses on clean data flows, safe administrative operations, and responsive UI updates using React Query.

---

## 🎥 Demo Video

Watch a short walkthrough of CULFS in action:

https://github.com/user-attachments/assets/8c4fbb1a-c6e1-4938-8de0-f91bd8073106

_(Click the link above to view the demo hosted on GitHub.)_

---

## Contents

- `src/` — Frontend source (React + TypeScript + Vite)
- `backend/` — Flask backend and database schema
- `public/` — Static assets
- `package.json` / `requirements.txt` — dependency manifests for frontend and backend

## Goals & context

- Built for an academic Data Management project to demonstrate practical handling of user-submitted records, inventory changes, and simple administrative workflows.
- Emphasizes correctness, safe destructive operations (admin gating), and a clear separation of frontend and backend responsibilities.

## Key user-facing functionality

- Student: report lost items, view and manage their reported items, receive notifications when matches are found.
- Staff: report lost items on behalf of users, access departmental lost & found updates, and view departmental inventory.
- Admin: view system-wide stats, manage found/lost inventories, match found items to reports, send notifications, archive or delete records (administrative actions are gated and audited).

## Top programming features and architecture highlights

1. Centralized API helper and environment-driven backend URL

- `src/lib/api.ts` reads `VITE_API_URL` at build/runtime and normalizes the base path so the frontend can be deployed separately from the backend without creating duplicated `/api/api/...` paths.
- All frontend fetches use the helper to ensure consistent base URLs and CORS-friendly requests.

2. React Query for data fetching and cache invalidation

- The app uses `@tanstack/react-query` to handle reads (`useQuery`) and writes (`useMutation`).
- Cache keys are used consistently (examples: `['foundItems']`, `['lostItems']`, `['reportedItems', userId]`, `['notifications', userId]`).
- After mutations the UI updates by invalidating affected queries rather than doing full-page reloads. This demonstrates modern, reactive client-side data flows suitable for a data management course project.

3. Secure admin operations and backend gating

- Sensitive admin endpoints are protected by a server-side `ADMIN_SETUP_KEY` environment variable. This prevents accidental or automated destructive operations in production.
- Backend endpoints check for dependents before destructive actions where appropriate.

4. TypeScript-first frontend with typed responses

- The frontend uses TypeScript and includes response interfaces for key endpoints (e.g., stats, department updates) to illustrate typed data handling and to reduce runtime errors.
- The project includes deliberate typing and defensive checks when interacting with potentially variable API responses.

5. Componentized UI and reusable primitives

- UI components follow a modular pattern in `src/components/` (auth, dashboard, forms, ui primitives). This keeps presentation and logic separated and makes the project easy to extend.

6. Small but realistic backend

- Backend is written in Flask and demonstrates simple CRUD operations, data validation, and a migration-friendly database schema (see `backend/db.sql`). It is intentionally lightweight so it can be run locally for testing or deployed to a simple host.

## Development setup

- Frontend (Node + Vite)

  1. Install dependencies: `npm install`
  2. Run dev server: `npm run dev`
  3. Build for production: `npm run build`

- Backend (Python + Flask)
  1. Create and activate a Python virtual environment
     ```bash
     python -m venv venv
     source venv/bin/activate
     ```
  2. Install requirements: `pip install -r backend/requirements.txt`
  3. Set environment variables and run the app (see `backend/README.md` for DB init and details)

## Key environment variables

- `VITE_API_URL` — URL where the backend API is reachable (do not include trailing `/api` — the frontend normalizes this). Example: `https://culfs-backend.example.com`
- `ADMIN_SETUP_KEY` — a secret value required for sensitive admin operations on the backend. Set this only in secure environments (staging/production) and never commit to the repo.

## Developer notes and considerations

- API normalization: the frontend intentionally strips trailing `/api` from `VITE_API_URL` so calls like `apiFetch('/api/route')` don’t produce `.../api/api/route` when the environment already includes `/api`.
- Migrations to React Query: the codebase recently migrated many components to `useQuery`/`useMutation` to eliminate full-page reloads after writes. This is a recommended pattern for data-driven apps.
- Typing: most endpoints now return structured types; a final pass to remove remaining `any` casts and tighten response interfaces is advisable before production.
- Admin safety: before running destructive admin flows on a hosted environment, ensure `ADMIN_SETUP_KEY` is set and you understand the backend checks that prevent accidental data loss.

## Testing & validation

- Type-check the frontend: `npx tsc --noEmit`
- Linting: `npm run lint` (project includes ESLint config)
- Build: `npm run build`
