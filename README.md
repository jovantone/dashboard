npm # Dashboard

A personal ops dashboard for organizing links into panels and categories. Built with Astro, Alpine.js, and SQLite (via libSQL).

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- npm

## Setup

Install dependencies and initialize the database:

```sh
npm install
npm run db:setup
```

`db:setup` creates a SQLite database at `data/dashboard.db` with two starter panels (Work and Life) and a handful of example links. You can delete or rename these from the UI.

## Development

```sh
npm run dev
```

The app starts at `http://localhost:4321`.

## Production build

```sh
npm run build
node dist/server/entry.mjs
```

The Astro server adapter produces a standalone Node server.

## Project structure

```
├── src/
│   ├── layouts/Layout.astro    # Shell: head, global styles, scripts
│   ├── lib/db.ts               # Database client and all queries
│   └── pages/
│       ├── index.astro         # Main dashboard page
│       └── api/
│           ├── links.ts        # CRUD for links
│           ├── categories.ts   # CRUD for categories
│           ├── panels.ts       # CRUD for panels
│           └── reorder.ts      # Drag-and-drop reordering
├── db/
│   ├── setup.ts                # Database schema + seed data
│   └── migrate-panels.ts       # One-time migration script
├── dashboard-cli.ts            # CLI tool for managing data
├── public/favicon.svg
├── astro.config.mjs
├── tsconfig.json
└── package.json
```

## CLI

The dashboard includes a CLI for managing panels, categories, and links from the terminal. All output is JSON.

```sh
npm run cli -- panel list
npm run cli -- link add --category-id 3 --name "GitHub" --url "https://github.com"
npm run cli -- export --file backup.json
npm run cli -- import --file backup.json
```

See [CLI.md](CLI.md) for full documentation.

## Features

- **Panels** — top-level tabs to separate different contexts (Work, Life, etc.)
- **Categories** — group links within a panel
- **Links** — bookmarks with a name, description, and URL
- **Drag and drop** — reorder links within/across categories, reorder categories
- **Light/Dark/System theme** — toggles and persists via localStorage
- **Cross-tab sync** — changes in one tab auto-reload other tabs via BroadcastChannel
- **Keyboard shortcuts** — press 1–9 to switch panels
- **Auto-close** — tabs expire after 3 minutes of inactivity
- **Export/Import** — back up and restore all data as JSON via the CLI
