# FlagLab - Flag Football Play Designer

## Overview

FlagLab is a production-quality flag football play designer web app for coaches. It features an SVG-based canvas play editor with draggable players and route drawing, a play library, a 29-play suggested catalog, animation engine, full playbooks organization (create/rename/delete, add/reorder plays, print), and a dashboard with stats.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + Wouter (routing) + Tailwind CSS + shadcn/ui
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **State management**: TanStack React Query
- **Charts**: Recharts (dashboard)
- **Build**: esbuild (API server bundle)

## Architecture

### Frontend (artifacts/flaglab)
- `src/App.tsx` — root with wouter router (routes: /, /library, /library/:id, /designer, /designer/:id, /suggested, /playbooks, /playbooks/:id, /settings)
- `src/pages/` — Dashboard, Library, LibraryDetail, Designer, SuggestedPlays, Settings, Playbooks, PlaybookDetail
- `src/components/designer/` — DesignerCanvas (SVG), DesignerSidebarLeft (roster), DesignerSidebarRight (properties), DesignerToolbar
- `src/components/layout/AppLayout.tsx` — sidebar navigation shell (Dashboard, Library, Playbooks, Designer, Suggested Plays, Settings)
- `src/components/PlayCard.tsx` — reusable play card for library and suggested plays
- `src/components/MiniField.tsx` — miniature SVG field preview in library cards
- `src/hooks/use-designer-state.ts` — reducer-based play editor state with undo/redo
- `src/hooks/use-play-animation.ts` — animation engine for route playback
- `src/lib/playbook-api.ts` — custom React Query hooks for playbook CRUD + play management (not generated)

### API Server (artifacts/api-server)
- `src/routes/plays.ts` — CRUD + duplicate endpoint
- `src/routes/playbooks.ts` — full CRUD for playbooks + manage plays within playbooks (add, remove, reorder)
- `src/routes/formations.ts` — read-only formations
- `src/routes/suggested-plays.ts` — catalog list + load-into-library endpoint
- `src/routes/dashboard.ts` — summary stats + recent plays + plays by formation

### Database Schema (lib/db/src/schema/)
- `plays.ts` — plays table with jsonb players/routes, tags array
- `playbooks.ts` — playbooks table (name, description, format, color)
- `playbook_plays.ts` — junction table (playbook_id, play_id, position) for many-to-many relationship
- `formations.ts` — formations table (seeded: 8 formations)
- `suggested_plays.ts` — suggested_plays table (seeded: 29 plays)

### Code Generation (lib/api-spec/)
- `openapi.yaml` — full API spec for all endpoints
- Generates: `lib/api-client-react/src/generated/api.ts` (React Query hooks), `lib/api-zod/src/generated/api.ts` (Zod schemas)
- **Note**: The generated Zod schemas in `lib/api-zod/src/generated/api.ts` have been manually updated to use `.nullish()` instead of `.optional()` for nullable DB fields to prevent ZodError on null values from PostgreSQL
- `lib/api-client-react/src/index.ts` exports `customFetch` in addition to generated hooks

## Key Design Decisions

- **SVG canvas** (not HTML5 canvas) for the play designer — enables React integration and vector rendering
- **Coordinate system**: Formations store players as percentages (0-100); the canvas uses SVG coordinates (FIELD_WIDTH=533, FIELD_HEIGHT=1200). The load-suggested-play endpoint converts from percentage to SVG coords
- **Dark mode default**: deep slate `222 47% 8%` background, green accent `142 71% 45%`; ThemeProvider supports dark/light toggle
- **Line of scrimmage**: fixed at SVG y=600 (50-yard line) in the designer
- **Playbooks**: many-to-many via `playbook_plays` junction table with `position` column for ordering; plays can exist in multiple playbooks

## Feature Set (as of 2026-04-01)

### Playbooks
- `/playbooks` page: card grid with format badge, play count, create/rename/duplicate/delete via dropdown
- `/playbooks/:id` page: ordered play list with mini SVG field preview, arrow-based reordering, remove-from-playbook
- **Duplicate Playbook**: `POST /api/playbooks/:id/duplicate` endpoint + `useDuplicatePlaybook` hook
- **Add Play dialog**: searchable picker, excludes already-added plays
- **Print layout**: cover page (team name, playbook name, TOC), 1 or 2 plays per page toggle, coaching notes, page number footer

### Play Tagging & Categorization
- Tags stored as `TagDefinition[]` in localStorage via `useSettings()` (`lib/settings.ts`)
- Color-coded tag badges on PlayCard, LibraryDetail, Designer sidebar
- Library filter panel: filter by mode, format, and tag
- Tag Manager in Settings: add/rename/delete tags with color picker
- Designer sidebar: add tags from presets + custom input, remove tags from play

### Dashboard Enhancements
- Quick Actions bar (New Play, New Playbook, Browse Suggested)
- Play Composition bar chart (Recharts) showing plays by format and mode
- Plays by Tag section showing tag distribution
- Recent Plays clickable (navigate to `/library/:id`)

### Play Designer Enhancements
- Formation templates dropdown (5v5: Spread, Trips, Bunch, Empty; 7v7: Pro Set, Shotgun, Trips TE, I-Form) — hardcoded presets in DesignerToolbar.tsx
- Text annotations: click-to-place overlay text labels (stored in localStorage by play ID)
- Snap-to-grid toggle (20-unit grid), visual grid lines on canvas
- Duplicate play button: `POST /api/plays/:id/duplicate`
- Route color picker in right sidebar + wavy route style option
- Role color quick-assign buttons for players

### API Routes Summary
- `POST /api/plays/:id/duplicate` — clone a play
- `POST /api/playbooks/:id/duplicate` — clone a playbook
- `GET|POST /api/playbooks/:id/plays` — list/add plays in playbook
- `DELETE /api/playbooks/:id/plays/:playId` — remove from playbook
- `PUT /api/playbooks/:id/plays/reorder` — reorder by playIds array

## Structure

```
artifacts/
├── api-server/               # Express API server
│   └── src/
│       ├── routes/           # plays, playbooks, formations, suggested-plays, dashboard
│       └── lib/seed-data.ts  # seed data definitions
└── flaglab/                  # React + Vite frontend
    └── src/
        ├── pages/            # Dashboard, Library, LibraryDetail, Designer, SuggestedPlays, Settings, Playbooks, PlaybookDetail
        ├── components/       # AppLayout, PlayCard, MiniField, designer/*
        ├── hooks/            # use-designer-state, use-play-animation
        └── lib/              # playbook-api.ts (custom React Query hooks)
lib/
├── api-spec/                 # OpenAPI spec + Orval codegen config
├── api-client-react/         # Generated React Query hooks + customFetch export
├── api-zod/                  # Generated Zod schemas (manually patched for .nullish())
└── db/                       # Drizzle ORM schema + DB connection
    └── src/schema/           # plays, playbooks, playbook_plays, formations, suggested_plays
```

## Seeded Data

- **Formations**: 8 (form-5v5-spread, form-5v5-trips, form-5v5-ace, form-5v5-man, form-7v7-pro, form-7v7-trips-te, form-7v7-cover2, form-7v7-blitz)
- **Playbooks**: 3 (pb-red-zone: Red Zone Package 5v5, pb-base-offense: Base Offense 5v5, pb-7v7-offense: 7v7 Offensive Playbook)
- **Suggested Plays**: 29 (offensive 5v5, offensive 7v7, defensive plays)

## Commands

- `pnpm --filter @workspace/api-server run dev` — API server dev (rebuilds on start)
- `pnpm --filter @workspace/flaglab run dev` — Vite frontend dev server
- `pnpm --filter @workspace/db run push` — sync DB schema
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API client + Zod schemas (re-apply .nullish() patches after)
- `pnpm run typecheck` — full monorepo type check

## API Server Notes (Express 5)

- Use `/*splat` for wildcard routes
- All async handlers return `Promise<void>`, end with `res.status(n).json(data); return;`
- Do NOT use `console.log` — use `req.log` or the pino singleton logger
- CORS and JSON body parsing in `src/app.ts`
- All routes mounted under `/api` prefix
- Inline zod validation in routes using `import { z } from "zod/v4"` (zod is a direct dependency of api-server)
