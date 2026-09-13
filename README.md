# FlexCore Web

> Frontend for **FlexCore**, a gym management platform. Built with React 19, TypeScript, Ant Design 6, TanStack Query and Vite.

## Tech Stack

- **React 19 + TypeScript** — type-safe UI
- **Vite 8** — fast dev server and optimized builds
- **Ant Design 6** — component library (RTL support for Arabic)
- **TanStack Query v5** — server state, caching, retries and invalidation
- **React Router v7** — lazy-loaded routes + auth guards
- **Axios** — HTTP client with JWT interceptor and refresh-token rotation

## Getting Started

```bash
npm install
npm run dev
```

The dev server runs on `http://localhost:5173`. API requests are proxied to the backend via the Vite dev proxy (`/api` → `http://localhost:8080`), so no CORS configuration is needed locally.

### Environment

| Variable | Default | Description |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `/api/v1` | Backend base URL (override for production) |

## Features

- **Auth**: login / register with JWT access + rotating refresh tokens; protected routes via `RequireAuth`
- **Dashboard**: summary of subscriptions, bookings, payments and PT sessions (auto-loaded with TanStack Query)
- **Roles & Permissions**: per-role permission gating (`RequirePermission`)
- **RTL + i18n**: full Arabic/English support with `dayjs` locale switching
- **Localized errors**: the backend returns stable `messageKey` + arguments, resolved through the client i18n dictionary

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start dev server |
| `npm run build` | Type-check (`tsc -b`) + production build |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run Oxlint |

## Project Structure

```
src/
  api/          # Axios client, endpoints, types
  auth/         # AuthContext, RequireAuth, token storage
  components/   # Shared UI components
  i18n/         # Localization + RTL
  layout/       # App layout & navigation
  pages/        # Route-level pages (admin, member, reports, ...)
```

## Related

- Backend: [sief-elmenshawi/flexCore-Gym](https://github.com/sief-elmenshawi/flexCore-Gym)