import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, watch, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { findAdminProject } from "./project-paths.mjs";

// Keep the original extension project editable while deploying one Shopify app.
export function syncAdminExtensions(backendRoot) {
  const adminRoot = findAdminProject(backendRoot);
  if (!adminRoot) return { close() {} };
  const pairs = [
    ...["customm-dash", "rewards-page-t", "product-analisis"].map(name => [
      join(adminRoot, "extensions", name, "src"), join(backendRoot, "extensions", name, "src"),
    ]),
    ...["blocks", "assets"].map(name => [
      join(adminRoot, "extensions/rewards-floating-widget", name),
      join(backendRoot, "extensions/points-theme-extension", name),
    ]),
  ];
  const watchers = [];
  const allowed = file => /\.(js|jsx|ts|tsx|liquid|css|json|svg|png|jpg|webp)$/.test(file) && !file.endsWith("backend-url.js");
  function copy(source, target) {
    if (!existsSync(source) || !statSync(source).isFile()) return;
    const content = readFileSync(source);
    if (existsSync(target) && readFileSync(target).equals(content)) return;
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, content);
  }
  function seed(left, right) {
    for (const entry of readdirSync(left, { withFileTypes: true })) {
      const a = join(left, entry.name), b = join(right, entry.name);
      if (entry.isDirectory()) { mkdirSync(b, { recursive: true }); seed(a, b); }
      else if (allowed(entry.name)) {
        if (!existsSync(b) || statSync(a).mtimeMs > statSync(b).mtimeMs) copy(a, b);
        else copy(b, a);
      }
    }
  }
  for (const [left, right] of pairs) {
    mkdirSync(left, { recursive: true }); mkdirSync(right, { recursive: true });
    seed(left, right); seed(right, left);
    for (const [source, target] of [[left, right], [right, left]]) {
      const watcher = watch(source, { recursive: true }, (_, filename) => {
        if (!filename || !allowed(filename)) return;
        try { copy(join(source, filename), join(target, filename)); }
        catch { console.error("Could not synchronize extension file:", filename); }
      });
      watcher.on("error", () => console.error("Extension source synchronization stopped. Restart npm run dev."));
      watchers.push(watcher);
    }
  }
  console.log("Extension edits synchronize with admin-dashbord-new.");
  return { close() { watchers.forEach(w => w.close()); } };
}
