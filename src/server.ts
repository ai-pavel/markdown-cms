import express from "express";
import type { NextFunction, Request, Response } from "express";
import type { PostStore } from "./content.js";
import type { SearchIndex } from "./search.js";
import { renderPost, renderPostList } from "./renderer.js";

function errorPage(heading: string, message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${heading}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 720px; margin: 2rem auto; padding: 0 1rem; line-height: 1.6; color: #333; }
    a { color: #2563eb; }
  </style>
</head>
<body>
  <h1>${heading}</h1>
  <p>${message}</p>
  <p><a href="/posts">&larr; All Posts</a></p>
</body>
</html>`;
}

export function createApp(store: PostStore, searchIndex: SearchIndex) {
  const app = express();

  // List all posts
  app.get("/posts", (_req, res) => {
    const posts = store.getAll();
    res.type("html").send(renderPostList(posts, "All Posts"));
  });

  // Search posts
  app.get("/search", (req, res) => {
    const q = (req.query.q as string) ?? "";
    if (!q.trim()) {
      res.type("html").send(renderPostList([], `Search results for ""`));
      return;
    }
    const results = searchIndex.search(q);
    res.type("html").send(renderPostList(results, `Search results for "${q}"`));
  });

  // Posts by tag
  app.get("/tags/:tag", (req, res) => {
    const tag = req.params.tag;
    const posts = store.getByTag(tag);
    res
      .type("html")
      .send(renderPostList(posts, `Posts tagged "${tag}"`));
  });

  // Single post by slug
  app.get("/posts/:slug", (req, res) => {
    const post = store.getBySlug(req.params.slug);
    if (!post) {
      res.status(404).type("html").send("<h1>Post not found</h1>");
      return;
    }
    res.type("html").send(renderPost(post));
  });

  // Root redirect
  app.get("/", (_req, res) => {
    res.redirect("/posts");
  });

  // Styled 404 for any unmatched route.
  app.use((_req, res) => {
    res
      .status(404)
      .type("html")
      .send(errorPage("Page not found", "The page you requested does not exist."));
  });

  // Error-handling middleware: return a styled 500 without leaking a stack trace.
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error("[server] unhandled error:", err);
    if (res.headersSent) return;
    res
      .status(500)
      .type("html")
      .send(errorPage("Internal Server Error", "Something went wrong while handling your request."));
  });

  return app;
}
