import { existsSync } from "node:fs";
import { resolve, join } from "node:path";

export function findAdminProject(backendRoot) {
  const candidates = [process.env.ELCIRCLE_ADMIN_ROOT,
    resolve(backendRoot, "../Elcircle-app-frontend-theme-and-app"),
    resolve(backendRoot, "../admin-dashbord-new"),
    resolve(backendRoot, "../../admin-dashbord-new")];
  return candidates.find(path => path && existsSync(join(path, "package.json")));
}
