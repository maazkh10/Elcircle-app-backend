import { syncAdminExtensions } from "./admin-extension-sync.mjs";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync, renameSync, watch, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseEnv } from "node:util";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const store = "r2ev3h-um.myshopify.com";
const clientId = "c5f35c7c862ac4f79cce0c6beaee0591";
const port = 43190;
const configName = "elcircle-loyalty";
const configPath = join(root, `shopify.app.${configName}.toml`);
const envPath = join(root, ".env.r2ev3h-um");
const children = new Set();
let extensionWatcher;
let sourceSync;
let deployTimer;
let stopping = false;

function stop() {
  if (stopping) return;
  stopping = true;
  extensionWatcher?.close();
  sourceSync?.close();
  clearTimeout(deployTimer);
  for (const child of children) {
    if (process.platform === "win32") {
      spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
        stdio: "ignore",
        windowsHide: true,
      });
    } else child.kill("SIGTERM");
  }
}

process.on("SIGINT", () => { stop(); process.exitCode = 0; });
process.on("SIGTERM", () => { stop(); process.exitCode = 0; });
process.on("exit", stop);

function launch(command, args, env, stdio = "inherit") {
  if (command === "npm") {
    args = [process.env.npm_execpath, ...args];
    command = process.execPath;
  } else if (command === "shopify") {
    args = [join(root, "node_modules", "@shopify", "cli", "bin", "run.js"), ...args];
    command = process.execPath;
  }
  const child = spawn(command, args, {
    cwd: root,
    env,
    stdio,
    windowsHide: true,
  });
  children.add(child);
  child.on("exit", () => children.delete(child));
  return child;
}

function run(command, args, env) {
  return new Promise((resolveRun, reject) => {
    const child = launch(command, args, env);
    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) resolveRun();
      else reject(new Error(`${command} failed with exit code ${code}.`));
    });
  });
}

function watchExtensions(env) {
  let deploying = false;
  let pending = false;
  async function deployChanges() {
    pending = true;
    if (deploying || stopping) return;
    deploying = true;
    while (pending && !stopping) {
      pending = false;
      console.log("\nSaved extension changes. Updating Elcircle Loyalty...");
      try {
        await run("shopify", ["app", "deploy", "--config", configName, "--allow-updates", "--no-input"], env);
        console.log("Extension updated. Refresh the Shopify theme editor or storefront.");
      } catch (error) {
        console.error(`Extension update failed: ${error.message} Save again after fixing the reported error.`);
      }
    }
    deploying = false;
  }
  extensionWatcher = watch(join(root, "extensions"), { recursive: true }, (_, filename) => {
    if (!filename || /(^|[\\/])(node_modules|dist|\.git)([\\/]|$)/.test(filename)) return;
    if (!/\.(liquid|js|css|json|toml|jsx|tsx|ts)$/.test(filename)) return;
    clearTimeout(deployTimer);
    deployTimer = setTimeout(deployChanges, 1200);
  });
  extensionWatcher.on("error", (error) => console.error(`Extension watcher stopped: ${error.message}`));
}

async function ensurePortAvailable() {
  const server = createServer();
  await new Promise((resolvePort, reject) => {
    server.once("error", () => reject(new Error(
      `Port ${port} is already in use. Stop the previous new-store runner first.`,
    )));
    server.listen(port, "127.0.0.1", resolvePort);
  });
  await new Promise((resolveClose) => server.close(resolveClose));
}

async function openTunnel(env) {
  const useNgrok = env.ELCIRCLE_TUNNEL === "ngrok";
  let binary = useNgrok ? (env.ELCIRCLE_NGROK_PATH || join(root, "tools", "ngrok.exe")) : (env.ELCIRCLE_CLOUDFLARED_PATH || join(
    root, "node_modules", "@shopify", "cli", "bin", process.platform === "win32" ? "cloudflared.exe" : "cloudflared",
  ));
  if (!useNgrok && !env.ELCIRCLE_CLOUDFLARED_PATH && !existsSync(binary)) {
    if (process.platform !== "win32" || !["x64", "arm64"].includes(process.arch)) {
      throw new Error("Install Cloudflare Tunnel and set ELCIRCLE_CLOUDFLARED_PATH to its executable.");
    }
    binary = join(root, ".cache", "cloudflared.exe");
    if (!existsSync(binary)) {
      console.log("Downloading Cloudflare Tunnel from Cloudflare's official GitHub release...");
      const architecture = process.arch === "arm64" ? "arm64" : "amd64";
      const response = await fetch(`https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-${architecture}.exe`, { signal: AbortSignal.timeout(120000) });
      if (!response.ok) throw new Error("Cloudflare Tunnel download failed. Check the network or set ELCIRCLE_CLOUDFLARED_PATH.");
      mkdirSync(dirname(binary), { recursive: true });
      writeFileSync(`${binary}.download`, Buffer.from(await response.arrayBuffer()));
      renameSync(`${binary}.download`, binary);
    }
  }
  if (!existsSync(binary)) throw new Error(useNgrok
    ? "Install ngrok from Microsoft Store, then set ELCIRCLE_NGROK_PATH in .env.r2ev3h-um to its executable path."
    : "Shopify's Cloudflare tunnel executable was not found.");
  return new Promise((resolveTunnel, reject) => {
    const args = useNgrok
      ? ["http", `http://127.0.0.1:${port}`, "--log", "stdout", "--log-format", "json"]
      : ["tunnel", "--url", `http://127.0.0.1:${port}`, "--no-autoupdate"];
    const tunnel = launch(binary, args, env, ["ignore", "pipe", "pipe"]);
    const timeout = setTimeout(() => reject(new Error("The HTTPS tunnel did not start within 60 seconds.")), 60000);
    let buffer = "";
    const inspect = (chunk) => {
      buffer = (buffer + chunk.toString()).slice(-16000);
      const match = buffer.match(useNgrok
        ? /https:\/\/[a-z0-9-]+\.(?:ngrok-free\.app|ngrok-free\.dev|ngrok\.app|ngrok\.io)/
        : /https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
      if (match) {
        clearTimeout(timeout);
        resolveTunnel({ tunnel, url: match[0] });
      }
    };
    tunnel.stdout.on("data", inspect);
    tunnel.stderr.on("data", inspect);
    tunnel.once("error", (error) => { clearTimeout(timeout); reject(error); });
    tunnel.once("exit", () => { clearTimeout(timeout); reject(new Error("The HTTPS tunnel stopped.")); });
  });
}

async function main() {
  if (!existsSync(envPath)) throw new Error("Missing private .env.r2ev3h-um. Copy it securely from your other laptop, or use .env.r2ev3h-um.example. See OFFICE-SETUP.md.");
  const baseEnv = existsSync(join(root, ".env")) ? parseEnv(readFileSync(join(root, ".env"), "utf8")) : {};
  const overrides = parseEnv(readFileSync(envPath, "utf8"));
  if (overrides.SHOPIFY_API_KEY !== clientId || !overrides.SHOPIFY_API_SECRET) {
    throw new Error("The new-store app credentials are missing or do not match Elcircle Loyalty.");
  }
  const env = {
    ...process.env, ...baseEnv, ...overrides,
    PORT: String(port),
    SHOPIFY_SESSION_DATABASE_URL: "file:r2ev3h-um.sqlite",
    ELCIRCLE_REGULAR_STORE: "1",
  };
  delete env.HOST;
  console.log(`Starting Elcircle Loyalty for ${store}`);
  if (process.argv.includes("--check")) {
    console.log("New-store credentials and configuration are present.");
    return;
  }
  await ensurePortAvailable();
  sourceSync = syncAdminExtensions(root);
  const sessionSchema = "prisma/r2ev3h-um.prisma";
  const schema = readFileSync(join(root, "prisma/schema.prisma"), "utf8");
  if (!schema.includes('url      = "file:dev.sqlite"')) {
    throw new Error("The local session schema changed. Check the new-store database configuration.");
  }
  writeFileSync(join(root, sessionSchema), schema.replace(
    'url      = "file:dev.sqlite"', 'url      = "file:r2ev3h-um.sqlite"',
  ));
  const normalizeSchema = value => (value.match(/"(?:\\.|[^"\\])*"|\/\/[^\r\n]*|[^\s]/g) || []).filter(token => !token.startsWith("//")).join("");
  let clientCurrent = false;
  try {
    const generatedSchema = readFileSync(join(root, "node_modules/.prisma/client/schema.prisma"), "utf8");
    const require = createRequire(join(root, "package.json"));
    const { PrismaClient, Prisma } = require("@prisma/client");
    const installedVersion = require("@prisma/client/package.json").version;
    clientCurrent = typeof PrismaClient === "function" &&
      Prisma.prismaVersion.client === installedVersion &&
      normalizeSchema(generatedSchema) === normalizeSchema(readFileSync(join(root, sessionSchema), "utf8"));
  } catch { /* Generate only if the installed client is absent or out of date. */ }
  if (clientCurrent) {
    console.log("Database client is current. Reusing it without rewriting locked files.");
  } else {
    await run("npm", ["run", "prisma", "--", "generate", "--schema", sessionSchema], env);
  }
  await run("npm", ["run", "prisma", "--", "db", "push", "--skip-generate", "--schema", sessionSchema], env);
  const { tunnel, url } = await openTunnel(env);
  env.SHOPIFY_APP_URL = url;
  let config = readFileSync(configPath, "utf8");
  config = config.replace(/^application_url\s*=.*$/m, `application_url = "${url}"`);
  config = config.replace(/^redirect_urls\s*=.*$/m, `redirect_urls = [ "${url}/auth/callback" ]`);
  writeFileSync(configPath, config);
  for (const name of ["customm-dash", "rewards-page-t"]) {
    const directory = join(root, "extensions", name, "src");
    if (existsSync(directory)) {
      writeFileSync(join(directory, "backend-url.js"), `export const backendUrl = ${JSON.stringify(url)};\n`);
    }
  }
  const backend = launch("npm", ["run", "dev:web"], env);
  const failure = new Promise((_, reject) => {
    backend.once("error", reject);
    backend.once("exit", (code) => reject(new Error(`The app server stopped (${code}).`)));
    tunnel.once("exit", () => reject(new Error("The tunnel stopped. Restart npm run dev.")));
  });
  await Promise.race([failure, (async () => {
    for (let attempt = 0; attempt < 60; attempt++) {
      try {
        const response = await fetch(`http://127.0.0.1:${port}`, { signal: AbortSignal.timeout(2000) });
        if (response.ok) return;
      } catch {}
      await new Promise((resolveWait) => setTimeout(resolveWait, 500));
    }
    throw new Error("The app server did not become ready.");
  })()]);
  await Promise.race([failure, run("shopify", ["app", "deploy", "--config", configName, "--allow-updates", "--no-input"], env)]);
  watchExtensions(env);
  const appUrl = `https://admin.shopify.com/store/elcircle88/apps/${clientId}`;
  console.log(`\nApp ready: ${appUrl}\nWatching extension files. After an upload finishes, refresh Shopify to see Liquid changes.\nKeep this terminal open. Press Ctrl+C to stop.`);
  if (process.platform === "win32") {
    spawn("explorer.exe", [appUrl], { stdio: "ignore", windowsHide: true });
  }
  await failure;
}

main().catch((error) => {
  console.error(error.message);
  stop();
  process.exitCode = 1;
});
