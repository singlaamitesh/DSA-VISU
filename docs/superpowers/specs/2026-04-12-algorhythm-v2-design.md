# Algorhythm V2 — Design Spec

## Overview

Rebuild Algorhythm from an n8n/Supabase-dependent question submission tool into a standalone, portfolio-grade interactive algorithm visualizer with a hybrid approach: built-in DOM-based visualizations for 12 common algorithms + AI-powered custom visualization generation via OpenRouter (Gemini 2.5 Flash).

**Goal:** Portfolio piece targeting Modern SaaS aesthetic (Linear/Vercel quality).

## Architecture

### Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 18 + TypeScript + Vite 5 | SPA framework |
| Styling | Tailwind CSS 3 + Framer Motion | Design system + animations |
| State | Zustand | Global state (auth, visualizer, history) |
| Auth | Firebase Auth (Spark/free) | Email/password + Google OAuth |
| Database | Firebase Firestore (free tier) | User data, AI generation history, preferences |
| AI Proxy | Netlify Functions | Server-side OpenRouter calls |
| AI Model | OpenRouter → google/gemini-2.5-flash | Custom HTML visualization generation |
| Deployment | Netlify | Static hosting + serverless functions |
| Icons | Lucide React | Consistent icon set |
| Toasts | react-hot-toast | Notifications |
| Code Highlighting | PrismJS | Syntax highlighting in code panel |

### System Flow

```
User selects algorithm → Built-in Mode:
  Algorithm generator yields steps → Zustand store → Framer Motion renders DOM elements

User types custom prompt → AI Custom Mode:
  Browser → Netlify Function → OpenRouter (gemini-2.5-flash) → HTML response
  → Sandboxed iframe render → Save to Firestore history
```

### Zustand Stores

**authStore:**
- `user: FirebaseUser | null`
- `loading: boolean`
- `signIn(email, password)`, `signUp(email, password, name)`, `signOut()`, `signInWithGoogle()`

**visualizerStore:**
- `algorithm: AlgorithmConfig | null` — selected algorithm
- `data: number[] | GraphData | DPTableData` — input data
- `steps: AnimationStep[]` — pre-computed from generator
- `currentStep: number`
- `speed: number` (1-100, maps to ms delay)
- `isPlaying: boolean`
- `play()`, `pause()`, `stepForward()`, `stepBackward()`, `reset()`, `setSpeed()`

**historyStore:**
- `generations: AIGeneration[]` — from Firestore
- `loadHistory()`, `saveGeneration()`, `deleteGeneration()`

## Pages

### 1. Home (`/`)

Public. Landing page.

- Hero section with animated gradient background and a live mini sorting visualization running in a loop (bubble sort on ~15 bars)
- Two CTAs: "Try Visualizer" (→ `/visualizer`) and "Browse Algorithms" (→ `/algorithms`)
- Features grid: 3 cards — "Built-in Visualizer", "AI-Powered Custom", "Save & Share"
- Algorithm showcase: horizontal scroll of algorithm cards by category
- Stats bar: "12+ Algorithms • 4 Categories • Instant Visualization"
- Minimal footer with GitHub link

### 2. Visualizer (`/visualizer`) — Core Feature

Public for built-in mode. Auth required for AI custom mode.

**Two modes via tab toggle at top:**

**Built-in Mode:**
- Left panel: Algorithm selector (categorized dropdown/list), input configurator (array size slider + random/custom values for sorting/search; node/edge editor for graph; weight/capacity inputs for DP), speed control slider, playback controls (play/pause, step forward, step back, reset)
- Center: Main visualization area — DOM elements animated with Framer Motion:
  - Sorting: colored bars with height proportional to value, bars animate position on swap
  - Searching: array cells with highlight states (current, found, eliminated)
  - Graph: circles (nodes) with lines (edges), positioned via simple force layout, color-coded by visit state
  - DP: grid/table cells that fill in as the algorithm progresses
- Right panel: Code display with PrismJS syntax highlighting, current executing line highlighted, step counter ("Step 12 of 45"), time/space complexity badges
- Bottom: Step explanation text updating per animation frame

**AI Custom Mode (auth required):**
- Prompt textarea with placeholder examples
- "Generate Visualization" button
- Loading state with skeleton/shimmer
- Result rendered in `<iframe sandbox="allow-scripts">` — no access to parent DOM
- Download HTML button, copy-to-clipboard
- History of past generations (from Firestore) with preview/delete

**URL parameters:** `/visualizer?algorithm=bubbleSort&data=5,3,8,1,9` for deep-linking and sharing.

### 3. Algorithms Catalog (`/algorithms`)

Public. Replaces the static Problems page.

- Category tabs: Sorting | Searching | Graph | Dynamic Programming
- Algorithm cards: name, difficulty badge (Easy/Medium/Hard), time+space complexity, category badge, brief description, mini animated preview (optional stretch goal), "Visualize →" button linking to `/visualizer?algorithm=<id>`
- Search input + difficulty filter dropdown
- Algorithm count is dynamic from the registry

### 4. Dashboard (`/dashboard`)

Auth required.

- Account overview: name, email, sign out button
- Stats: total built-in visualizations run (local counter), AI generations used, favorite algorithm
- AI generation history table: prompt preview, date, preview/download/delete actions
- Preferences: default animation speed, preferred code language display

### 5. Login (`/login`)

Public.

- Glassmorphism card centered on page
- Email + password fields with icons
- "Sign in with Google" button (Firebase Google OAuth)
- Forgot password link (Firebase password reset email)
- Link to signup
- Redirects to return URL after login (stored in query param)

### 6. Signup (`/signup`)

Public.

- Same glassmorphism card style
- Name + email + password + confirm password
- Terms checkbox
- Google OAuth button
- Link to login
- Firebase sends confirmation email

## Algorithm Implementation

### Generator Pattern

Each algorithm is a generator function implementing the `AlgorithmGenerator` interface:

```typescript
interface AnimationStep {
  type: 'compare' | 'swap' | 'visit' | 'fill' | 'highlight' | 'done';
  indices: number[];
  data: number[] | GraphData | DPTableData;
  codeLine: number;
  explanation: string;
  metadata?: Record<string, unknown>;
}

interface AlgorithmConfig {
  id: string;
  name: string;
  category: 'sorting' | 'searching' | 'graph' | 'dp';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  timeComplexity: string;
  spaceComplexity: string;
  description: string;
  code: string; // source code for display
  defaultInput: unknown;
  generator: (...args: any[]) => Generator<AnimationStep>;
}
```

The visualizer pre-computes all steps by exhausting the generator, stores them in `visualizerStore.steps`, then plays through them at user-controlled speed. This enables step-backward (just decrement index) without re-running the algorithm.

### Algorithms (12 total)

**Sorting (5):**
- Bubble Sort (Easy) — O(n²) / O(1)
- Selection Sort (Easy) — O(n²) / O(1)
- Insertion Sort (Easy) — O(n²) / O(1)
- Merge Sort (Medium) — O(n log n) / O(n)
- Quick Sort (Medium) — O(n log n) avg / O(log n)

**Searching (2):**
- Linear Search (Easy) — O(n) / O(1)
- Binary Search (Easy) — O(log n) / O(1)

**Graph (3):**
- BFS (Medium) — O(V+E) / O(V)
- DFS (Medium) — O(V+E) / O(V)
- Dijkstra's (Hard) — O(V²) / O(V)

**Dynamic Programming (2):**
- Fibonacci (Easy) — O(n) / O(n)
- 0/1 Knapsack (Medium) — O(nW) / O(nW)

### Algorithm Registry

`src/algorithms/registry.ts` exports a flat array of `AlgorithmConfig` objects. The catalog page and algorithm selector read from this registry. Adding a new algorithm = adding one file + one registry entry.

## OpenRouter / Gemini Integration

### Netlify Function: `netlify/functions/generate-visualization.ts`

- Accepts POST with `{ prompt: string }` body
- Validates auth token (Firebase ID token in Authorization header) using Firebase Admin SDK (`firebase-admin` package, initialized with `FIREBASE_SERVICE_ACCOUNT` env var)
- Rate limits: max 10 generations per user per day (checked against Firestore counter via Admin SDK)
- Calls OpenRouter API:
  ```
  POST https://openrouter.ai/api/v1/chat/completions
  Headers:
    Authorization: Bearer $OPENROUTER_API_KEY
    Content-Type: application/json
  Body:
    model: "google/gemini-2.5-flash"
    messages:
      - system: VISUALIZATION_SYSTEM_PROMPT
      - user: <user's prompt>
  ```
- `VISUALIZATION_SYSTEM_PROMPT` instructs Gemini to generate a complete, self-contained HTML file with inline CSS and JS that creates an interactive algorithm visualization. The prompt specifies: must be a single HTML file, must include animation controls (play/pause/step), must use clean modern styling, must include code display.
- Returns `{ html: string }` to the frontend
- Frontend renders in `<iframe sandbox="allow-scripts" srcdoc={html}>` — sandboxed, no parent DOM access
- Saves generation to Firestore: `{ userId, prompt, html, createdAt }`

### Environment Variables

```
# Firebase (client-side, VITE_ prefix)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# OpenRouter (server-side only, Netlify Function)
OPENROUTER_API_KEY=

# Firebase Admin (server-side only, Netlify Function — for token verification)
FIREBASE_SERVICE_ACCOUNT=<base64-encoded service account JSON>
```

## Access Control

| Page | Auth Required | Notes |
|------|--------------|-------|
| Home | No | Public landing |
| Visualizer (built-in) | No | Core feature, public |
| Visualizer (AI custom) | Yes | Requires login, rate limited |
| Algorithms Catalog | No | Public reference |
| Dashboard | Yes | User's history and settings |
| Login | No | Redirect if already authed |
| Signup | No | Redirect if already authed |

Implemented via `<ProtectedRoute>` wrapper component that checks `authStore.user` and redirects to `/login?redirect=<current_path>`. After login, redirects back to the original page.

## Design System

### Visual Identity
- Dark theme: slate-900 base with subtle gradients
- Glassmorphism: `bg-white/5 backdrop-blur-xl border border-white/10`
- Accent gradient: blue-500 → green-500 (keep existing brand)
- Typography: Inter font family (already loaded)
- Animations: Framer Motion for page transitions, element entrances, and visualization rendering

### Component Library (src/components/UI/)
- **Button** — primary/secondary/outline/ghost variants, sizes sm/md/lg
- **Card** — glassmorphism container with optional hover glow
- **Badge** — difficulty (Easy/Medium/Hard color-coded), category badges
- **Tabs** — animated underline indicator, used for category switching and mode toggle
- **Slider** — speed control, styled to match theme
- **Modal** — for confirmations and previews
- **CodeBlock** — PrismJS wrapper with line highlighting support

## File Changes Summary

### New Files (~40)
- 10 visualizer components
- 12 algorithm implementations + types + registry
- 3 Zustand stores
- 6 UI components (Card, Badge, Tabs, Slider, Modal, CodeBlock)
- 2 lib files (firebase.ts, openrouter.ts)
- 1 hook (useVisualizer.ts)
- 1 component (ProtectedRoute, Footer)
- 1 Netlify Function
- 1 .env.example

### Modified Files (~12)
- App.tsx — new routes, remove Supabase imports
- main.tsx — remove Supabase validation, add Firebase init
- index.css — updated animations and utilities
- Header.tsx — updated nav links, Firebase auth
- Layout.tsx — cleaner particle system, Framer Motion page transitions
- Button.tsx — add ghost variant, Framer Motion hover
- useAuth.ts — rewrite for Firebase
- constants.ts — Firebase + OpenRouter config
- validation.ts — update env var checks
- Home.tsx, Login.tsx, Signup.tsx — rework with new design system
- Visualizer.tsx, Dashboard.tsx — full rewrite
- package.json — dependency changes
- .env.example — new env vars
- netlify.toml — add functions directory config
- tailwind.config.js — extended animations

### Deleted Files/Dirs
- `src/lib/supabase.ts`
- `src/lib/n8nTrigger.ts`
- `supabase/` (entire directory — functions + migrations)
- `src/pages/Problems.tsx` (replaced by Algorithms.tsx)
