import { describe, it, expect, vi, beforeEach } from "vitest";
import { createWatcher } from "../src/watcher.js";
import type { PostStore } from "../src/content.js";
import type { SearchIndex } from "../src/search.js";

// Mock chokidar
vi.mock("chokidar", () => {
  const handlers: Record<string, Function> = {};
  const mockWatcher = {
    on: vi.fn((event: string, handler: Function) => {
      handlers[event] = handler;
      return mockWatcher;
    }),
    close: vi.fn(() => Promise.resolve()),
    _trigger: (event: string, ...args: unknown[]) => {
      if (handlers[event]) handlers[event](...args);
    },
    _handlers: handlers,
  };
  return {
    default: {
      watch: vi.fn(() => mockWatcher),
    },
    __mockWatcher: mockWatcher,
  };
});

// We need to import the mock after mocking
import chokidar from "chokidar";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockWatcher = (await import("chokidar") as any).__mockWatcher;

function createMockStore(): PostStore {
  return {
    posts: new Map(),
    loadAll: vi.fn(),
    loadFile: vi.fn(() => null),
    removeFile: vi.fn(),
    getAll: vi.fn(() => []),
    getBySlug: vi.fn(() => undefined),
    getByTag: vi.fn(() => []),
  };
}

function createMockSearchIndex(): SearchIndex {
  return {
    rebuild: vi.fn(),
    search: vi.fn(() => []),
  };
}

describe("Watcher", () => {
  let store: PostStore;
  let searchIndex: SearchIndex;
  let onChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    store = createMockStore();
    searchIndex = createMockSearchIndex();
    onChange = vi.fn();
  });

  it("starts watching the content directory", () => {
    const watcher = createWatcher("/content", store, searchIndex, onChange);
    watcher.start();
    expect(chokidar.watch).toHaveBeenCalledWith("/content/**/*.md", {
      ignoreInitial: true,
      awaitWriteFinish: { stabilityThreshold: 200, pollInterval: 50 },
    });
  });

  it("loads file and rebuilds index on add", () => {
    const watcher = createWatcher("/content", store, searchIndex, onChange);
    watcher.start();
    mockWatcher._trigger("add", "/content/new.md");
    expect(store.loadFile).toHaveBeenCalledWith("/content/new.md");
    expect(searchIndex.rebuild).toHaveBeenCalled();
    expect(onChange).toHaveBeenCalled();
  });

  it("loads file and rebuilds index on change", () => {
    const watcher = createWatcher("/content", store, searchIndex, onChange);
    watcher.start();
    mockWatcher._trigger("change", "/content/existing.md");
    expect(store.loadFile).toHaveBeenCalledWith("/content/existing.md");
    expect(searchIndex.rebuild).toHaveBeenCalled();
    expect(onChange).toHaveBeenCalled();
  });

  it("removes file and rebuilds index on unlink", () => {
    const watcher = createWatcher("/content", store, searchIndex, onChange);
    watcher.start();
    mockWatcher._trigger("unlink", "/content/deleted.md");
    expect(store.removeFile).toHaveBeenCalledWith("/content/deleted.md");
    expect(searchIndex.rebuild).toHaveBeenCalled();
    expect(onChange).toHaveBeenCalled();
  });

  it("works without onChange callback", () => {
    const watcher = createWatcher("/content", store, searchIndex);
    watcher.start();
    // Should not throw even without onChange
    mockWatcher._trigger("add", "/content/new.md");
    expect(store.loadFile).toHaveBeenCalledWith("/content/new.md");
    expect(searchIndex.rebuild).toHaveBeenCalled();
  });

  it("close closes the watcher", async () => {
    const watcher = createWatcher("/content", store, searchIndex);
    watcher.start();
    await watcher.close();
    expect(mockWatcher.close).toHaveBeenCalled();
  });

  it("close without start does nothing", async () => {
    const watcher = createWatcher("/content", store, searchIndex);
    await watcher.close(); // should not throw
    expect(mockWatcher.close).not.toHaveBeenCalled();
  });
});
