# Battlechain Docs

Documentation site for [Battlechain](https://cyfrin.io) — Cyfrin's PvP security-focused blockchain where smart contracts face open exploitation in a live arena before production deployment.

## Getting Started

### Prerequisites

- Node.js 18+
- npm (or your preferred package manager)

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

The `prebuild` step automatically generates the search index from MDX content.

## Project Structure

```
app/                  # Next.js App Router pages & API routes
components/           # React components (layout, MDX, search, theme)
config/               # Documentation config (docs.json)
content/              # MDX documentation files
lib/                  # Utilities (navigation, search, MDX, theme)
public/               # Static assets (images, logos, search index)
scripts/              # Build scripts (search index generation)
types/                # TypeScript type definitions
```

## Writing Documentation

Documentation lives in the `content/` directory as `.mdx` files. Each file supports frontmatter:

```mdx
---
title: "Page Title"
description: "Page description"
---

Your content here.
```

### Available MDX Components

- `Card` / `CardGroup` — Feature cards and grid layouts
- `CodeGroup` — Tabbed code blocks
- `Accordion` / `Expandable` — Collapsible content sections
- `Callouts` — Info, warning, and tip callouts
- `Steps` — Step-by-step instructions
- `Latex` — LaTeX math rendering

### Navigation

Navigation structure is configured in `config/docs.json`.

## Scripts

| Script          | Description                                             |
| --------------- | ------------------------------------------------------- |
| `npm run dev`   | Start development server                                |
| `npm run build` | Build for production (includes search index generation) |
| `npm start`     | Start production server                                 |
| `npm run lint`  | Run ESLint                                              |
