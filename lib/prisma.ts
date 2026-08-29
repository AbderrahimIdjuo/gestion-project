// lib/prisma.ts
import { PrismaClient } from "../generated/prisma";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
  // eslint-disable-next-line no-var
  var prismaSchemaVersion: number | undefined;
}

/** Bump after `prisma generate` so the cached dev client picks up schema changes. */
const PRISMA_SCHEMA_VERSION = 3;

let prisma: PrismaClient;

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  if (!global.prisma || global.prismaSchemaVersion !== PRISMA_SCHEMA_VERSION) {
    global.prisma = new PrismaClient();
    global.prismaSchemaVersion = PRISMA_SCHEMA_VERSION;
  }
  prisma = global.prisma;
}

export default prisma;
