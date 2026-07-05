import { marked } from "marked";
import type { Post } from "./content.js";

export function renderMarkdown(markdown: string): string {
  return marked.parse(markdown, { async: false }) as string;
}

export function renderPost(post: Post): string {
  const htmlContent = renderMarkdown(post.content);
  const tagsHtml = post.tags
    .map((t) => `<span class="tag">${escapeHtml(t)}</span>`)
    .join(" ");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(post.title)}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 720px; margin: 2rem auto; padding: 0 1rem; line-height: 1.6; color: #333; }
    .meta { color: #666; font-size: 0.9rem; margin-bottom: 1.5rem; }
    .tag { background: #e0e7ff; color: #3730a3; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; }
    pre { background: #f5f5f5; padding: 1rem; border-radius: 4px; overflow-x: auto; }
    code { background: #f5f5f5; padding: 2px 4px; border-radius: 2px; }
    a { color: #2563eb; }
  </style>
</head>
<body>
  <nav><a href="/posts">&larr; All Posts</a></nav>
  <article>
    <h1>${escapeHtml(post.title)}</h1>
    <div class="meta">
      <time>${escapeHtml(post.date)}</time>
      ${tagsHtml ? `<div style="margin-top:0.5rem">${tagsHtml}</div>` : ""}
    </div>
    <div class="content">${htmlContent}</div>
  </article>
</body>
</html>`;
}

export function renderPostList(
  posts: Post[],
  heading: string,
  query = ""
): string {
  const listItems = posts
    .map(
      (p) => {
        const tagsHtml = p.tags
          .map(
            (t) =>
              `<a class="tag" href="/tags/${encodeURIComponent(
                t
              )}">${escapeHtml(t)}</a>`
          )
          .join(" ");
        return `<li>
      <a href="/posts/${encodeURIComponent(p.slug)}">${escapeHtml(p.title)}</a>
      <span class="meta">${escapeHtml(p.date)}</span>
      ${tagsHtml ? `<span class="tags">${tagsHtml}</span>` : ""}
    </li>`;
      }
    )
    .join("\n");

  const searchForm = `<form class="search" action="/search" method="get">
    <input type="search" name="q" placeholder="Search posts..." value="${escapeHtml(
      query
    )}">
    <button type="submit">Search</button>
  </form>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(heading)}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 720px; margin: 2rem auto; padding: 0 1rem; line-height: 1.6; color: #333; }
    .meta { color: #666; font-size: 0.85rem; margin-left: 0.5rem; }
    .tags { margin-left: 0.5rem; }
    .tag { background: #e0e7ff; color: #3730a3; padding: 1px 6px; border-radius: 4px; font-size: 0.75rem; text-decoration: none; }
    .search { margin: 1rem 0; }
    .search input { padding: 0.4rem; width: 60%; }
    .search button { padding: 0.4rem 0.8rem; }
    ul { list-style: none; padding: 0; }
    li { padding: 0.5rem 0; border-bottom: 1px solid #eee; }
    a { color: #2563eb; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <h1>${escapeHtml(heading)}</h1>
  ${searchForm}
  <ul>${listItems}</ul>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
