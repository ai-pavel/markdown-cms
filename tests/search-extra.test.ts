import { describe, it, expect } from "vitest";
import { createSearchIndex } from "../src/search.js";
import type { Post } from "../src/content.js";

function makePost(overrides: Partial<Post> = {}): Post {
  return {
    title: "Test Post",
    date: "2026-01-01",
    tags: ["test"],
    slug: "test-post",
    content: "This is test content.",
    filePath: "/tmp/test.md",
    ...overrides,
  };
}

describe("SearchIndex - additional coverage", () => {
  it("supports prefix matching (query token is prefix of indexed token)", () => {
    const index = createSearchIndex();
    index.rebuild([
      makePost({ title: "TypeScript Guide", slug: "ts" }),
      makePost({ title: "Python Basics", slug: "py" }),
    ]);
    // "type" is a prefix of "typescript"
    const results = index.search("type");
    expect(results.length).toBe(1);
    expect(results[0].slug).toBe("ts");
  });

  it("supports reverse prefix matching (indexed token is prefix of query)", () => {
    const index = createSearchIndex();
    index.rebuild([
      makePost({ content: "API design patterns", slug: "api" }),
    ]);
    // "design" is in the index, "designing" starts with "design"
    const results = index.search("designing");
    expect(results.length).toBe(1);
    expect(results[0].slug).toBe("api");
  });

  it("ranks results by number of matching tokens", () => {
    const index = createSearchIndex();
    index.rebuild([
      makePost({
        title: "Guide",
        tags: [],
        content: "Learn about widgets",
        slug: "less-relevant",
      }),
      makePost({
        title: "Widgets and Gadgets",
        tags: ["widgets", "gadgets"],
        content: "Widgets gadgets galore widgets gadgets",
        slug: "more-relevant",
      }),
    ]);
    // "widgets gadgets" should rank the second post higher due to more token matches
    const results = index.search("widgets gadgets");
    expect(results.length).toBe(2);
    expect(results[0].slug).toBe("more-relevant");
  });

  it("handles single-character tokens (filtered out)", () => {
    const index = createSearchIndex();
    index.rebuild([
      makePost({ title: "A B C", content: "x y z", slug: "short" }),
    ]);
    // Single chars are filtered by tokenizer (length > 1)
    const results = index.search("a");
    expect(results).toEqual([]);
  });

  it("strips punctuation during tokenization", () => {
    const index = createSearchIndex();
    index.rebuild([
      makePost({ content: "Hello, world! How's it going?", slug: "hello" }),
    ]);
    const results = index.search("hello");
    expect(results.length).toBe(1);
    expect(results[0].slug).toBe("hello");
  });

  it("is case-insensitive", () => {
    const index = createSearchIndex();
    index.rebuild([
      makePost({ title: "UPPERCASE TITLE", slug: "upper" }),
    ]);
    const results = index.search("uppercase");
    expect(results.length).toBe(1);
    expect(results[0].slug).toBe("upper");
  });

  it("rebuild replaces old index", () => {
    const index = createSearchIndex();
    index.rebuild([
      makePost({ title: "Old Post", slug: "old" }),
    ]);
    expect(index.search("old").length).toBe(1);

    // Rebuild with different data
    index.rebuild([
      makePost({ title: "New Post", slug: "new" }),
    ]);
    expect(index.search("old")).toEqual([]);
    expect(index.search("new").length).toBe(1);
  });

  it("handles empty posts array", () => {
    const index = createSearchIndex();
    index.rebuild([]);
    expect(index.search("anything")).toEqual([]);
  });

  it("handles query with special characters", () => {
    const index = createSearchIndex();
    index.rebuild([
      makePost({ content: "Testing with C++ and C#", slug: "lang" }),
    ]);
    // Special chars are stripped, so "c++" becomes "c" which is too short
    const results = index.search("testing");
    expect(results.length).toBe(1);
  });

  it("finds posts matching multiple tags", () => {
    const index = createSearchIndex();
    index.rebuild([
      makePost({ tags: ["javascript", "react", "frontend"], slug: "js-react" }),
      makePost({ tags: ["python", "django"], slug: "py-django" }),
    ]);
    const results = index.search("javascript react");
    expect(results.length).toBe(1);
    expect(results[0].slug).toBe("js-react");
  });

  it("searches across title, tags, and content combined", () => {
    const index = createSearchIndex();
    index.rebuild([
      makePost({
        title: "Node.js",
        tags: ["backend"],
        content: "Server side programming",
        slug: "node",
      }),
    ]);
    expect(index.search("node").length).toBe(1);
    expect(index.search("backend").length).toBe(1);
    expect(index.search("server").length).toBe(1);
  });
});
