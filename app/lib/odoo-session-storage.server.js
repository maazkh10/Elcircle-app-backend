import { createCipheriv, createDecipheriv, createHash, hkdfSync, randomBytes } from "node:crypto";
import { Session } from "@shopify/shopify-api";

const digest = (value) => createHash("sha256").update(value).digest("hex");

// Keep Shopify authentication records separate from Odoo business records.
// Only encrypted payloads are persisted in Odoo system parameters.
export class OdooSessionStorage {
  constructor({ env = process.env, fetch = globalThis.fetch } = {}) {
    this.env = env;
    this.fetch = fetch;
    this.prefix = `elcircle.shopify.${env.SHOPIFY_API_KEY}.session.`;
    this.uidPromise = undefined;
    this.loadingSessions = new Map();
  }

  encryptionKey() {
    if (!this.env.SHOPIFY_API_KEY || !this.env.SHOPIFY_API_SECRET) {
      throw new Error("Shopify credentials are required for encrypted session storage.");
    }
    return Buffer.from(hkdfSync("sha256", this.env.SHOPIFY_API_SECRET,
      this.env.SHOPIFY_API_KEY, "elcircle-odoo-session-v1", 32));
  }

  parameterKey(id) {
    if (typeof id !== "string" || !id || id.length > 512) throw new Error("Invalid Shopify session ID.");
    return `${this.prefix}${digest(id)}`;
  }

  encrypt(session) {
    const key = this.parameterKey(session.id);
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", this.encryptionKey(), iv);
    cipher.setAAD(Buffer.from(key));
    const ciphertext = Buffer.concat([
      cipher.update(JSON.stringify(session.toPropertyArray(true)), "utf8"), cipher.final(),
    ]);
    return ["v1", iv.toString("base64url"), cipher.getAuthTag().toString("base64url"),
      ciphertext.toString("base64url")].join(".");
  }

  decrypt(key, value) {
    const [version, iv, tag, ciphertext, extra] = String(value).split(".");
    if (version !== "v1" || !iv || !tag || !ciphertext || extra) throw new Error("Invalid encrypted Shopify session.");
    const decipher = createDecipheriv("aes-256-gcm", this.encryptionKey(), Buffer.from(iv, "base64url"));
    decipher.setAAD(Buffer.from(key));
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    const plaintext = Buffer.concat([decipher.update(Buffer.from(ciphertext, "base64url")), decipher.final()]);
    const session = Session.fromPropertyArray(JSON.parse(plaintext.toString("utf8")), true);
    if (this.parameterKey(session.id) !== key) throw new Error("Shopify session identity mismatch.");
    return session;
  }

  async rpc(service, method, args) {
    const { ODOO_URL, ODOO_DB, ODOO_USERNAME } = this.env;
    const password = this.env.ODOO_API_KEY || this.env.ODOO_PASSWORD;
    if (!ODOO_URL || !ODOO_DB || !ODOO_USERNAME || !password) throw new Error("Odoo session storage is not configured.");
    for (let attempt = 0; attempt < 5; attempt++) {
      const response = await this.fetch(`${ODOO_URL.replace(/\/+$/, "")}/jsonrpc`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", method: "call", params: { service, method, args }, id: 1 }),
        signal: AbortSignal.timeout(20000),
      });
      if (response.status === 429 && attempt < 4) {
        const retryAfter = response.headers?.get("retry-after");
        const seconds = Number(retryAfter);
        const headerDelay = retryAfter && Number.isFinite(seconds) ? seconds * 1000 : 0;
        const delay = Math.min(5000, Math.max(headerDelay, 500 * 2 ** attempt));
        await response.body?.cancel();
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      if (!response.ok) throw new Error(`Odoo session storage returned HTTP ${response.status}.`);
      const payload = await response.json();
      // Odoo exceptions can contain RPC arguments, including credentials. Never log them.
      if (payload.error) throw new Error("Odoo session storage request failed.");
      return payload.result;
    }
  }

  async execute(method, args = [], kwargs = {}) {
    const password = this.env.ODOO_API_KEY || this.env.ODOO_PASSWORD;
    if (!this.uidPromise) {
      this.uidPromise = this.rpc("common", "authenticate", [
        this.env.ODOO_DB, this.env.ODOO_USERNAME, password, {},
      ]).then((uid) => {
        if (!uid) throw new Error("Odoo session storage authentication failed.");
        return uid;
      }).catch((error) => { this.uidPromise = undefined; throw error; });
    }
    return this.rpc("object", "execute_kw", [
      this.env.ODOO_DB, await this.uidPromise, password, "ir.config_parameter", method, args, kwargs,
    ]);
  }

  async storeSession(session) {
    await this.execute("set_param", [this.parameterKey(session.id), this.encrypt(session)]);
    return true;
  }

  async loadSession(id) {
    const key = this.parameterKey(id);
    // React Router's parent and child loaders can ask for the same session at once.
    // Share only the in-flight read, and reconstruct independent Session objects.
    if (!this.loadingSessions.has(key)) {
      const loading = this.execute("get_param", [key, false]).finally(() => this.loadingSessions.delete(key));
      this.loadingSessions.set(key, loading);
    }
    const value = await this.loadingSessions.get(key);
    return value ? this.decrypt(key, value) : undefined;
  }

  async deleteSession(id) { return this.deleteSessions([id]); }

  async deleteSessions(ids) {
    if (!ids.length) return true;
    const recordIds = await this.execute("search", [[["key", "in", ids.map((id) => this.parameterKey(id))]]]);
    if (recordIds.length) await this.execute("unlink", [recordIds]);
    return true;
  }

  async findSessionsByShop(shop) {
    const sessions = [];
    for (let offset = 0; ; offset += 100) {
      const rows = await this.execute("search_read", [[["key", "=like", `${this.prefix}%`]]],
        { fields: ["key", "value"], order: "id", offset, limit: 100 });
      for (const row of rows) {
        const session = this.decrypt(row.key, row.value);
        if (session.shop === shop) sessions.push(session);
      }
      if (rows.length < 100) break;
    }
    return sessions;
  }

  async isReady() {
    this.encryptionKey();
    return Boolean(await this.execute("check_access_rights", ["read"], { raise_exception: false }));
  }
}
