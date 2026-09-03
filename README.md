# System Design Arena

Practice system design interviews the way they actually work — by drawing, defending your choices, and getting grilled on what you missed.

**Live:** [system-design-arena-frontend.vercel.app](https://system-design-arena-frontend.vercel.app)

---

## Two Ways to Practice

### Canvas Mode
Pick a challenge, drag components onto a canvas, wire them up, and evaluate. The engine doesn't just check if the right components exist — it traverses the graph, validates directed data flows, detects anti-patterns, and scores you on component presence, connection correctness, and topology cleanliness. Six challenges: URL Shortener, Rate Limiter, Twitter Feed, Uber, YouTube, WhatsApp.

### AI Interview Mode
A Gemini-powered interviewer that reads your actual diagram. Not a chatbot that ignores what you drew — it receives a serialized snapshot of your canvas on every submission, computes a diff of what changed since the last message, and asks questions grounded in your specific design. It won't ask about failure modes while you're still sketching — it follows a 5-phase state machine that gates topic progression based on your diagram state and turn count.

---

## How the AI Interview Works

The interviewer receives a serialized snapshot of your canvas on every submission — nodes, edges, and a computed diff of what changed since your last message. Phase progression is gated on diagram state: the session won't leave `OPENING` until you actually submit a design, and each subsequent phase (`HLD_SUBMITTED` → `DEEP_DIVE` → `SCALING` → `CONCLUSION`) has its own system prompt persona that shifts the interviewer's focus accordingly.

At `CONCLUSION`, the rubric evaluator scores four dimensions — Scalability, Reliability, Correctness, Depth — against the last 14 messages of the actual conversation and the final diagram snapshot. Each dimension is evaluated via a separate Gemini call (staggered 300ms apart to respect free-tier rate limits), then combined into a weighted aggregate score rendered as a radar chart.

The canvas itself is a separate free-form ReactFlow surface (distinct from the structured Canvas Mode palette) that exposes `getSnapshot()` via `useImperativeHandle` for on-demand state reads.

**Reference architecture injection:** 15 canonical system design reference architectures are matched by keyword to the interview topic and injected as a hidden interviewer briefing — no vector DB needed for a 15-document corpus.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, React 18, Tailwind CSS, TypeScript |
| Canvas | @xyflow/react (ReactFlow) |
| State | Zustand, TanStack React Query |
| Backend | NestJS 11, TypeScript |
| ORM | Prisma 7 |
| Database | PostgreSQL 16 |
| Cache | Redis 7 (ioredis) |
| AI | Google Gemini 1.5 Flash |
| Auth | JWT + Google OAuth 2.0 (Passport) |
| Monorepo | pnpm workspaces, Turborepo |
| Infra | Docker Compose (local), Render (backend), Vercel (frontend) |

---

## Evaluation Engine (Canvas Mode)

The engine builds an `ArchitectureGraph` from the diagram and runs two layers of analysis:

**Graph traversal** — BFS/DFS primitives: `canReach`, `pathPassesThrough`, `appearsBeforeInFlow`, `getUnreachableFromClient`, `hasUnexpectedCycle`. These power every rule below.

**Rules** — Two categories:
- *Anti-patterns*: missing or misused components (`no_cache`, `no_load_balancer`, `direct_db_access_from_client`, etc.). Severity escalates to HIGH when the component is in the prompt's expected set.
- *Topology rules*: structural errors (`WRONG_DIRECTION_*`, `SPURIOUS_CONNECTION_*`, `UNREACHABLE_NODE_*`, `LB_WRONG_ORDER`, `GATEWAY_NOT_ENTRY`). Derived automatically from each prompt's `expectedConnections` list — no hardcoded rules per diagram type.

**Scoring** — Additive model: 40pts for component presence, 40pts for correct directed connections, 20pt clean topology bonus. Deductions for violations on top.

Each of the 6 prompts ships with `expectedPatterns`, `expectedConnections` (directed pairs), `componentRoles`, and prompt-specific anti-pattern overrides.

---

## Project Structure

```
system-design-platform/
├── apps/
│   ├── backend/          NestJS API — port 3001
│   │   ├── src/
│   │   │   ├── ai-interview/   Gemini module: phase machine, rubric evaluator, prompt builder, diagram diff
│   │   │   ├── evaluation/     Rule-based evaluation engine (graph traversal + anti-patterns)
│   │   │   ├── auth/           Google OAuth + JWT strategies
│   │   │   └── ...             users, sessions, diagrams, prompts modules
│   │   └── prisma/             Schema (8 models), migrations, seed
│   └── frontend/         Next.js app — port 3000
│       └── src/
│           ├── app/            Routes: (auth), dashboard, practice, ai-interview/[sessionId]
│           ├── components/     practice/, ai-interview/, shared/
│           ├── hooks/          usePractice, useAIInterview
│           └── store/          Zustand stores
└── packages/
    ├── shared-types/     TypeScript interfaces shared across apps
    ├── ui/               Shared UI components (Tailwind)
    └── eslint-config/    Shared ESLint rules
```

---

## Running Locally

**Prerequisites:** Node 20+, pnpm, Docker

```bash
git clone https://github.com/geet2003/system-design-arena
cd system-design-arena/system-design-platform
pnpm install
docker compose up -d

# copy and fill env files
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env.local

# migrate + seed
pnpm --filter @sds/backend prisma:migrate
pnpm --filter @sds/backend prisma:seed

pnpm dev
# → frontend: localhost:3000  |  backend: localhost:3001
```

### Backend env vars (`apps/backend/.env`)

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_HOST` / `REDIS_PORT` | Redis connection |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | 32+ character secrets |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | From Google Cloud Console |
| `GOOGLE_CALLBACK_URL` | `http://localhost:3001/api/auth/google/callback` |
| `GEMINI_API_KEY` | From [aistudio.google.com](https://aistudio.google.com) |
| `CORS_ORIGIN` | `http://localhost:3000` |

### Frontend env vars (`apps/frontend/.env.local`)

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001/api` |

> **Note (Prisma 7 + pnpm):** After any `pnpm install` or schema change, regenerate the client: `pnpm --filter @sds/backend generate`

---

## Deployment

| Service | Platform | Notes |
|---|---|---|
| Frontend | Vercel | Root dir: `system-design-platform/apps/frontend` |
| Backend | Render | Root dir: `system-design-platform/apps/backend` |
| Database | Render (PostgreSQL) | Free tier |
| Cache | Redis Cloud / Render | Set `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` |

Set all backend env vars in your Render service's environment tab. Set `NEXT_PUBLIC_API_URL` to your Render backend URL in Vercel.
