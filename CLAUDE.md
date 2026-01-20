# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NoteX is a React SPA for collaborative content management and knowledge sharing with team-based organization, role-based access control, and social features.

**Tech Stack:** React 19 + TypeScript 5.9 + Vite 7 + React Query + React Router DOM 7 + Tailwind CSS 4

## Common Commands

```bash
npm run dev      # Start Vite dev server with HMR
npm run build    # TypeScript compile + Vite production build
npm run lint     # ESLint check
npm run preview  # Preview production build locally
```

## Architecture

### State Management
- **Server state:** React Query (`@tanstack/react-query`) - all data fetching goes through custom hooks in `src/hooks/`
- **Auth state:** React Context (`AuthContext`) with localStorage persistence
- Query keys follow hierarchical structure for cache invalidation (e.g., `['posts']`, `['posts', id]`)

### API Layer (`src/api/`)
- `axios.ts` - Configured axios instance with bearer token injection and refresh token handling on 401
- Modular API modules export typed functions (postsApi, usersApi, etc.)
- Base URL from `VITE_API_URL` environment variable

### Routing (`src/router/`)
- `ProtectedRoute` - Redirects unauthenticated users to `/login`
- `AdminRoute` - Requires `isSuperAdmin` role
- `AuthLayout` - Redirects authenticated users away from login

### Component Organization
- `src/components/common/` - Reusable UI (Button, Input, Modal, Loading, Avatar)
- `src/components/layout/` - Layout shells (MainLayout, AuthLayout, Header, Sidebar)
- `src/components/posts/` - Post-specific components (PostCard, PostList)
- `src/pages/` - Route-level page components
- `src/pages/admin/` - Admin-only pages

### Data Flow Pattern
```
Page → Custom Hook (useXxx) → React Query → API Module → Backend
```

## Key Types

**Post enums** (`src/types/post.types.ts`):
- `PostStatus`: Draft=0, Published=1, Archived=2
- `PostVisibility`: Team=0, Unit=1, Company=2

**User roles**: superAdmin, teamLead, unitManager (checked in `AuthProvider`)

## Environment Variables

```
VITE_API_URL   # Backend API base URL (default: https://localhost:7088/api)
VITE_APP_NAME  # Application name (default: "NoteX")
```

## Notes

- UI text is in Turkish
- Admin role check in AuthProvider has temporary hardcoded email check
- Response interceptor globally redirects to login on 401 errors
