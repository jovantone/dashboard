# Architecture

## Overview

The dashboard is a server-rendered single-page app. Astro renders the HTML on the server, Alpine.js handles client-side interactivity, and a local SQLite file stores all data. There is no build-time static generation — every request hits the server and reads from the database.

## Tech stack

### Astro (server mode)

Astro runs in `output: 'server'` mode with the `@astrojs/node` adapter, producing a standalone Node.js server. This was chosen over a static site because the dashboard reads from a database and needs API routes.

Astro's `.astro` file format lets you write the server-side data fetching (frontmatter) and the HTML template in the same file with zero client-side JavaScript framework overhead. The HTML is sent fully rendered — there is no hydration step and no virtual DOM.

API routes live in `src/pages/api/` as plain TypeScript files exporting HTTP method handlers (`POST`, `PUT`, `DELETE`). Astro routes these automatically based on the file path.

### Alpine.js

Alpine.js provides reactive client-side behavior without a build step or component model. It is loaded from a CDN (`unpkg.com/alpinejs@3.14.8`).

A single `x-data="dashboard()"` component wraps the entire page. It manages:

- **Modal state** — six modals (add/edit link, add/rename category, add panel, three delete confirmations) controlled by boolean flags (`showModal`, `showCategoryModal`, etc.) and toggled with `x-show`
- **Form binding** — `x-model` binds form inputs to reactive state, `x-on:submit.prevent` handles submission
- **Dynamic text** — `x-text` swaps button/title labels based on whether you're adding or editing
- **Event handling** — `x-on:click` and `x-on:dblclick` wire up all button and header interactions
- **Focus management** — `x-ref` + `$nextTick` auto-focus the first input when a modal opens
- **Conditional rendering** — `x-if` hides the category dropdown when editing (vs. adding) a link
- **Transitions** — `x-transition` fades modals in and out

Alpine was chosen over React/Vue/Svelte because the interactivity is simple (show/hide modals, bind forms, fire fetches) and Alpine adds no build complexity.

### SortableJS

SortableJS handles drag-and-drop reordering for both categories and links. It is loaded from a CDN (`cdn.jsdelivr.net/npm/sortablejs@1.15.6`).

Categories are dragged by their header. Links are dragged by a grip handle (`⠿`). Links can be moved across categories. After each drop, the new order is sent to `/api/reorder` which batch-updates `sort_order` values in the database.

### libSQL (SQLite)

The database is a single SQLite file at `data/dashboard.db`, accessed via `@libsql/client`. libSQL is a fork of SQLite maintained by Turso that provides the same embedded file-based database with a modern async API.

There are three tables:

```
panels       → id, name, sort_order
categories   → id, panel_id (FK → panels), name, sort_order
links        → id, category_id (FK → categories), name, description, url, sort_order
```

All queries live in `src/lib/db.ts` as exported async functions. There is no ORM — queries are plain SQL strings passed to `db.execute()`.

SQLite was chosen because the app is single-user, runs locally, and a file database eliminates all infrastructure (no Postgres, no Docker, no connection strings).

### No bundler, no framework runtime

The client loads three scripts from CDNs (Alpine.js, SortableJS, htmx) and one inline `<script>` block that defines the `dashboard()` function. There is no Webpack, no Vite client bundle, no React runtime. Astro's `is:inline` directive keeps the scripts out of the module graph entirely.

htmx is loaded but currently unused in the markup — the CRUD operations are handled by Alpine's `fetch()` calls that receive HTML partials from the API and insert them with `insertAdjacentHTML()` / `outerHTML`.

## Data flow

### Page load

1. Astro's frontmatter runs on the server: reads panels, categories, and links from SQLite
2. The template renders the full HTML with all data baked in
3. The browser receives the complete page — no loading spinners, no client-side fetching
4. Alpine.js initializes: sets up SortableJS, BroadcastChannel, keyboard shortcuts

### CRUD operations

1. User clicks a button → Alpine opens a modal and populates the form
2. User submits → Alpine calls `fetch()` to the relevant API endpoint
3. The API route runs the SQL query and returns either HTML (links, categories) or JSON (panels)
4. Alpine inserts the returned HTML into the DOM or navigates to the new panel
5. A `BroadcastChannel` message tells other tabs to reload

The API routes return HTML partials (not JSON) for links and categories. This means the server controls the markup, and the client just slots it in. The partial includes Alpine directives (`x-on:click`, etc.) so the new elements are immediately interactive.

### Reordering

1. User drags a link or category → SortableJS updates the DOM
2. On drop, the new order of IDs is read from the DOM and sent to `/api/reorder`
3. The API batch-updates `sort_order` values using `db.batch()`
4. Other tabs are notified via BroadcastChannel

## Design decisions

**Server-rendered with sprinkles of JS** — The app ships zero JavaScript framework code. Alpine.js (~17KB) and SortableJS (~40KB) are the only runtime dependencies. The rest is plain HTML/CSS rendered by Astro.

**Single-file database** — SQLite keeps the app self-contained. There is nothing to install, configure, or connect to. The database file is created automatically by `db:setup`.

**HTML partials from API routes** — Instead of returning JSON and rendering on the client, the API routes return ready-made HTML. This keeps rendering logic on the server and avoids duplicating templates.

**No auth** — The dashboard is designed for local/personal use. There is no login, no sessions, no middleware.

**Monospace typography** — The UI uses JetBrains Mono (with Berkeley Mono as preferred if installed) for a terminal/ops aesthetic.

**CSS custom properties for theming** — Light and dark themes are implemented with CSS variables on `[data-theme]`. A script in `<head>` reads the saved preference before the first paint to prevent flash of wrong theme.

## CLI

`dashboard-cli.ts` is a Commander.js CLI that imports the same `db.ts` module used by the web app. It provides full CRUD plus export/import, with all output as JSON. This makes the dashboard programmable from scripts and AI agents.
