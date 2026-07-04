# Markdown CMS

[![CI](https://github.com/pavel-genai/markdown-cms/actions/workflows/ci.yml/badge.svg)](https://github.com/pavel-genai/markdown-cms/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/pavel-genai/markdown-cms/branch/main/graph/badge.svg)](https://codecov.io/gh/pavel-genai/markdown-cms)

A flat-file content management system built with TypeScript and Node.js. Content is stored as Markdown files with YAML frontmatter and served as rendered HTML through an Express API.

## Features

- Markdown rendering with [marked](https://github.com/markedjs/marked)
- YAML frontmatter (title, date, tags, slug)
- Full-text search with inverted index
- Tag-based filtering
- File watcher for live preview
- Clean HTML output with minimal styling

## Getting Started

```bash
npm install
npm run dev
```

The server starts at `http://localhost:3000` by default.

## API Endpoints

| Endpoint | Description |
|---|---|
| `GET /posts` | List all posts |
| `GET /posts/:slug` | View a single post |
| `GET /search?q=query` | Full-text search |
| `GET /tags/:tag` | Filter posts by tag |

## Content

Add Markdown files to the `content/` directory with YAML frontmatter:

```markdown
---
title: My Post
date: "2026-01-01"
tags:
  - example
slug: my-post
---

Your content here.
```

The file watcher will automatically pick up changes.

## Project Structure

```
src/
  content.ts    - Markdown file loading and post store
  renderer.ts   - Markdown-to-HTML rendering
  search.ts     - Inverted index full-text search
  watcher.ts    - File system watcher for live reload
  server.ts     - Express HTTP API
  cli.ts        - CLI entry point
content/        - Sample Markdown posts
tests/          - Vitest test suite
```

## Scripts

- `npm run dev` - Start dev server with tsx
- `npm run build` - Compile TypeScript
- `npm start` - Run compiled output
- `npm test` - Run tests with vitest

## Configuration

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Server port |
| `CONTENT_DIR` | `./content` | Path to content directory |
