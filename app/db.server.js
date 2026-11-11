import { PrismaClient } from "@prisma/client";

if (process.env.NODE_ENV !== "production") {
  if (!global.prismaGlobal) {
    global.prismaGlobal = new PrismaClient(process.env.SHOPIFY_SESSION_DATABASE_URL ? { datasourceUrl: process.env.SHOPIFY_SESSION_DATABASE_URL } : {});
  }
}

const prisma = global.prismaGlobal ?? new PrismaClient(process.env.SHOPIFY_SESSION_DATABASE_URL ? { datasourceUrl: process.env.SHOPIFY_SESSION_DATABASE_URL } : {});

export default prisma;
