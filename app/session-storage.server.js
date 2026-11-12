import { OdooSessionStorage } from "./lib/odoo-session-storage.server";

let storagePromise;
function getStorage() {
  if (!storagePromise) {
    storagePromise = process.env.SHOPIFY_SESSION_STORAGE === "odoo"
      ? Promise.resolve(new OdooSessionStorage())
      : Promise.all([
          import("@shopify/shopify-app-session-storage-prisma"), import("./db.server"),
        ]).then(([{ PrismaSessionStorage }, { default: prisma }]) => new PrismaSessionStorage(prisma));
  }
  return storagePromise;
}

const sessionStorage = Object.fromEntries([
  "storeSession", "loadSession", "deleteSession", "deleteSessions", "findSessionsByShop", "isReady",
].map((method) => [method, async (...args) => (await getStorage())[method](...args)]));

export async function loadOfflineSession(shop) {
  const session = await sessionStorage.loadSession(`offline_${shop}`);
  if (session?.accessToken) return session;
  return (await sessionStorage.findSessionsByShop(shop))
    .filter((entry) => !entry.isOnline && entry.accessToken)
    .sort((a, b) => Number(b.expires || 0) - Number(a.expires || 0))[0];
}

export default sessionStorage;
