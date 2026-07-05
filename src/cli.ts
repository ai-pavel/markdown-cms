import path from "node:path";
import { createPostStore } from "./content.js";
import { createSearchIndex } from "./search.js";
import { createWatcher } from "./watcher.js";
import { createApp } from "./server.js";

const rawPort = process.env.PORT ?? "3000";
const PORT = Number(rawPort);
if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  console.error(
    `Invalid PORT "${rawPort}": expected an integer between 1 and 65535.`
  );
  process.exit(1);
}
const CONTENT_DIR = process.env.CONTENT_DIR ?? path.resolve("content");

const store = createPostStore(CONTENT_DIR);
store.loadAll();

const searchIndex = createSearchIndex();
searchIndex.rebuild(store.getAll());

const watcher = createWatcher(CONTENT_DIR, store, searchIndex, () => {
  console.log("[cms] content reloaded");
});
watcher.start();

const app = createApp(store, searchIndex);

const server = app.listen(PORT, () => {
  console.log(`Markdown CMS running at http://localhost:${PORT}`);
  console.log(`Watching content in: ${CONTENT_DIR}`);
});

function shutdown() {
  console.log("\nShutting down...");
  server.close();
  watcher.close().then(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
