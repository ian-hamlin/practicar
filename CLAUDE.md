# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (http://localhost:5173)
npm run build     # Type-check and build for production (tsc -b && vite build)
npm run lint      # Run ESLint
npm run preview   # Preview production build
```

There is no test runner configured by default.

## MUI

Uses `@mui/material` (free MIT tier) with `@emotion/react`/`@emotion/styled` as the styling engine, plus `@mui/icons-material`.

**Only use free/MIT-licensed components** — no MUI X Pro or Premium components (DataGrid Pro, DateRangePicker, etc.). Free MUI X components (`@mui/x-data-grid`, `@mui/x-date-pickers` community editions) are fine if added.

## Architecture

Vite + React 18 + TypeScript project scaffolded with `create-vite@5 --template react-ts`.

- `src/main.tsx` — entry point, mounts `<App />` into `#root`
- `src/App.tsx` — root component
- `src/assets/` — static assets imported directly in components
- `index.html` — HTML shell; Vite uses it as the entry point
- `vite.config.ts` — Vite config using `@vitejs/plugin-react`
- `tsconfig.json` / `tsconfig.app.json` / `tsconfig.node.json` — composite TypeScript setup separating app and Node (config) code
- `eslint.config.js` — flat config ESLint with `typescript-eslint` and `eslint-plugin-react-hooks`
