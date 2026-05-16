import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const DB_URL = "file:///C:/Users/kriti/OneDrive/Desktop/goal-tracking-portal/prisma/dev.db";

async function createPrismaClient() {
  const { createClient } = await import("@libsql/client");
  const libsql = createClient({ url: DB_URL });
  const adapter = new PrismaLibSql({ url: DB_URL });
  return new PrismaClient({ adapter });
}

let prismaPromise: Promise<PrismaClient> | null = null;

export function getPrisma(): Promise<PrismaClient> {
  if (!prismaPromise) {
    prismaPromise = createPrismaClient();
  }
  return prismaPromise;
}