import assert from "node:assert/strict";
import test from "node:test";
import { Session } from "@shopify/shopify-api";
import { OdooSessionStorage } from "../app/lib/odoo-session-storage.server.js";

const env = { SHOPIFY_API_KEY: "test-app", SHOPIFY_API_SECRET: "test-only-secret",
  ODOO_URL: "https://odoo.invalid", ODOO_DB: "test", ODOO_USERNAME: "test", ODOO_API_KEY: "test" };

function remoteStore() {
  const records = new Map();
  let nextId = 1;
  const fetch = async (_url, options) => {
    const { service, args } = JSON.parse(options.body).params;
    let result;
    if (service === "common") result = 1;
    else {
      const [, , , , method, params, kwargs] = args;
      const [key, value] = params;
      const matches = () => [...records.values()].filter((row) => {
        const [, op, wanted] = key[0];
        return op === "in" ? wanted.includes(row.key) : row.key.startsWith(wanted.slice(0, -1));
      });
      if (method === "set_param") {
        records.set(key, { id: records.get(key)?.id || nextId++, key, value }); result = true;
      } else if (method === "get_param") result = records.get(key)?.value || false;
      else if (method === "search") result = matches().map((row) => row.id);
      else if (method === "search_read") result = matches().slice(kwargs.offset, kwargs.offset + kwargs.limit);
      else if (method === "unlink") {
        for (const [name, row] of records) if (key.includes(row.id)) records.delete(name);
        result = true;
      } else if (method === "check_access_rights") result = true;
      else throw new Error(`Unexpected method ${method}`);
    }
    return { ok: true, json: async () => ({ result }) };
  };
  return { records, fetch };
}

test("persists encrypted sessions across cold starts with refresh expiry and online user data", async () => {
  const remote = remoteStore();
  const storage = new OdooSessionStorage({ env, fetch: remote.fetch });
  const session = new Session({ id: "test-shop_admin", shop: "test-shop.myshopify.com", state: "s", isOnline: true });
  session.accessToken = "private-access-token";
  session.refreshToken = "private-refresh-token";
  session.expires = new Date("2030-01-01T00:00:00Z");
  session.refreshTokenExpires = new Date("2031-01-01T00:00:00Z");
  session.onlineAccessInfo = { associated_user: { id: 42, email: "private@example.test", account_owner: true } };
  await storage.storeSession(session);
  const saved = [...remote.records.values()][0].value;
  assert.ok(!saved.includes(session.accessToken));
  assert.ok(!saved.includes(session.refreshToken));
  assert.ok(!saved.includes("private@example.test"));
  const reloaded = await new OdooSessionStorage({ env, fetch: remote.fetch }).loadSession(session.id);
  assert.deepEqual(reloaded.toPropertyArray(true), session.toPropertyArray(true));
  session.scope = "read_orders";
  await storage.storeSession(session);
  assert.equal(remote.records.size, 1);
  assert.equal((await storage.loadSession(session.id)).scope, "read_orders");
});

test("isolates apps and shops and deletes only requested sessions", async () => {
  const remote = remoteStore();
  const storage = new OdooSessionStorage({ env, fetch: remote.fetch });
  const other = new OdooSessionStorage({ env: { ...env, SHOPIFY_API_KEY: "another-app" }, fetch: remote.fetch });
  for (const shop of ["first.myshopify.com", "second.myshopify.com"]) {
    await storage.storeSession(new Session({ id: `offline_${shop}`, shop, state: "", isOnline: false }));
  }
  assert.equal((await storage.findSessionsByShop("first.myshopify.com")).length, 1);
  assert.equal(await other.loadSession("offline_first.myshopify.com"), undefined);
  await storage.deleteSessions(["offline_first.myshopify.com"]);
  assert.equal(await storage.loadSession("offline_first.myshopify.com"), undefined);
  assert.ok(await storage.loadSession("offline_second.myshopify.com"));
  assert.equal(await storage.deleteSession("missing"), true);
});

test("rejects ciphertext moved to another session ID and incorrect encryption secrets", async () => {
  const remote = remoteStore();
  const storage = new OdooSessionStorage({ env, fetch: remote.fetch });
  const session = new Session({ id: "offline_first.myshopify.com", shop: "first.myshopify.com", state: "", isOnline: false });
  await storage.storeSession(session);
  const row = [...remote.records.values()][0];
  const swappedKey = storage.parameterKey("offline_second.myshopify.com");
  remote.records.set(swappedKey, { ...row, key: swappedKey });
  await assert.rejects(() => storage.loadSession("offline_second.myshopify.com"));
  const wrongSecret = new OdooSessionStorage({ env: { ...env, SHOPIFY_API_SECRET: "wrong" }, fetch: remote.fetch });
  await assert.rejects(() => wrongSecret.loadSession(session.id));
});

test("simultaneous route loaders share a read but receive independent session objects", async () => {
  const remote = remoteStore();
  let reads = 0;
  const fetch = async (url, options) => {
    if (JSON.parse(options.body).params.args[4] === "get_param") reads++;
    return remote.fetch(url, options);
  };
  const storage = new OdooSessionStorage({ env, fetch });
  const session = new Session({ id: "offline_first.myshopify.com", shop: "first.myshopify.com", state: "", isOnline: false });
  await storage.storeSession(session);
  const [a, b] = await Promise.all([storage.loadSession(session.id), storage.loadSession(session.id)]);
  assert.equal(reads, 1);
  a.scope = "changed";
  assert.notEqual(a.scope, b.scope);
});

test("recovers from an Odoo rate limit without losing the session", async () => {
  const remote = remoteStore();
  let limited = false;
  const fetch = async (url, options) => {
    if (JSON.parse(options.body).params.args[4] === "get_param" && !limited) {
      limited = true;
      return new Response("Too many requests", { status: 429, headers: { "retry-after": "0" } });
    }
    return remote.fetch(url, options);
  };
  const storage = new OdooSessionStorage({ env, fetch });
  const session = new Session({ id: "offline_first.myshopify.com", shop: "first.myshopify.com", state: "", isOnline: false });
  await storage.storeSession(session);
  assert.equal((await storage.loadSession(session.id)).id, session.id);
  assert.equal(limited, true);
});
