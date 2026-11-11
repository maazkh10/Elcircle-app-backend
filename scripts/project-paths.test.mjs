import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { findAdminProject } from "./project-paths.mjs";

test("finds companion in standard GitHub and original laptop layouts", () => {
  for (const [backend, admin] of [
    ["Elcircle-app-backend", "Elcircle-app-frontend-theme-and-app"],
    ["clone-backed/Elcircle-app-backend", "admin-dashbord-new"],
  ]) {
    const root = mkdtempSync(join(tmpdir(), "elcircle-paths-"));
    try {
      mkdirSync(join(root, backend), { recursive: true });
      assert.equal(findAdminProject(join(root, backend)), undefined);
      mkdirSync(join(root, admin), { recursive: true });
      writeFileSync(join(root, admin, "package.json"), "{}");
      assert.equal(findAdminProject(join(root, backend)), join(root, admin));
    } finally { rmSync(root, { recursive: true, force: true }); }
  }
});
