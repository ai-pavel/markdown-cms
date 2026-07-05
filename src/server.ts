import express from "express";
import type { PostStore } from "./content.js";
import type { SearchIndex } from "./search.js";
import { renderPost, renderPostList } from "./renderer.js";

/**
 * Read a single-value string from an Express query parameter.
 *
 * Express parses a repeated parameter (e.g. `?q=a&q=b`) into an array and a
 * nested one (e.g. `?q[x]=1`) into an object, so an unchecked `as string`
 * cast is a runtime lie. This coerces arrays to their first string element
 * and anything else to `""`, so callers can safely use string methods.
 */
function singleQueryParam(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    const first = value[0];
    return typeof first === "string" ? first : "";
  }
  return "";
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
    const q = singleQueryParam(req.query.q);
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

  return app;
}
