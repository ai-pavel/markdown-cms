import { describe, it, expect, vi, afterEach } from "vitest";

const mockLoadAll = vi.fn();
const mockGetAll = vi.fn(() => []);
const mockRebuild = vi.fn();
const mockWatcherStart = vi.fn();
const mockWatcherClose = vi.fn(() => Promise.resolve());
const mockServerClose = vi.fn();
const mockListen = vi.fn((_port: number, cb: () => void) => {
  cb();
  return { close: mockServerClose };
});

let capturedOnChange: (() => void) | undefined;

const signalHandlers: Record<string, Function> = {};
const originalProcessOn = process.on.bind(process);
const originalProcessExit = process.exit;

describe("CLI entry point", () => {
  afterEach(() => {
    process.on = originalProcessOn as any;
    process.exit = originalProcessExit;
    vi.restoreAllMocks();
  });

  it("initializes CMS, starts server, registers signal handlers, and handles onChange", async () => {
    vi.resetModules();

    capturedOnChange = undefined;

    vi.doMock("../src/content.js", () => ({
      createPostStore: vi.fn(() => ({
        posts: new Map(),
        loadAll: mockLoadAll,
        loadFile: vi.fn(),
        removeFile: vi.fn(),
        getAll: mockGetAll,
        getBySlug: vi.fn(),
        getByTag: vi.fn(),
      })),
    }));

    vi.doMock("../src/search.js", () => ({
      createSearchIndex: vi.fn(() => ({
        rebuild: mockRebuild,
        search: vi.fn(() => []),
      })),
    }));

    vi.doMock("../src/watcher.js", () => ({
      createWatcher: vi.fn((_dir: string, _store: any, _search: any, onChange?: () => void) => {
        capturedOnChange = onChange;
        return {
          start: mockWatcherStart,
          close: mockWatcherClose,
        };
      }),
    }));

    vi.doMock("../src/server.js", () => ({
      createApp: vi.fn(() => ({
        listen: mockListen,
      })),
    }));

    // Intercept process.on for SIGINT/SIGTERM
    process.on = vi.fn(function (this: NodeJS.Process, event: string, handler: (...args: any[]) => void) {
      if (event === "SIGINT" || event === "SIGTERM") {
        signalHandlers[event] = handler;
      }
      return originalProcessOn(event, handler);
    }) as any;

    process.exit = vi.fn() as any;

    await import("../src/cli.js");

    // Verify initialization
    expect(mockLoadAll).toHaveBeenCalled();
    expect(mockRebuild).toHaveBeenCalled();
    expect(mockWatcherStart).toHaveBeenCalled();
    expect(mockListen).toHaveBeenCalled();

    // Verify signal handlers were registered
    expect(signalHandlers["SIGINT"]).toBeDefined();
    expect(signalHandlers["SIGTERM"]).toBeDefined();

    // Test onChange callback (covers lines 17-18)
    expect(capturedOnChange).toBeDefined();
    const consoleSpy = vi.spyOn(console, "log");
    capturedOnChange!();
    expect(consoleSpy).toHaveBeenCalledWith("[cms] content reloaded");

    // Test shutdown via SIGINT handler
    signalHandlers["SIGINT"]();
    expect(mockServerClose).toHaveBeenCalled();

    await vi.waitFor(() => {
      expect(mockWatcherClose).toHaveBeenCalled();
    });
  });
});
