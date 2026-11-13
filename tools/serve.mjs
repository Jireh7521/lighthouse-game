#!/usr/bin/env node
// Minimal static server for docs/, used by the tests and by `npm run serve`.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname, normalize } from "node:path";

const TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".json": "application/json", ".txt": "text/plain; charset=utf-8",
};

export function serve(rootDir, port = 0) {
  const server = createServer(async (req, res) => {
    const url = new URL(req.url, "http://localhost");
    let path = decodeURIComponent(url.pathname);
    if (path === "/") path = "/index.html";
    const full = join(rootDir, normalize(path).replace(/^(\.\.[/\\])+/, ""));
    try {
      const info = await stat(full);
      if (info.isDirectory()) throw new Error("dir");
      const body = await readFile(full);
      res.writeHead(200, { "Content-Type": TYPES[extname(full)] || "application/octet-stream", "Cache-Control": "no-store" });
      res.end(body);
    } catch {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("not found");
    }
  });
  return new Promise((resolve) => {
    server.listen(port, "127.0.0.1", () => resolve({ server, url: `http://127.0.0.1:${server.address().port}` }));
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { url } = await serve(new URL("../docs", import.meta.url).pathname, Number(process.argv[2]) || 8080);
  console.log(`serving docs/ on ${url}`);
}
