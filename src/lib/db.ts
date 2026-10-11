import { PrismaClient } from "@prisma/client";
import { z } from "zod";

declare global {
  var __db: PrismaClient | undefined;
}

export const db = global.__db ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.__db = db;
}

export function parseJsonColumn<T>(schema: z.ZodSchema<T>, value: string | null | undefined): T {
  if (value === null || value === undefined || value === "") {
    throw new Error("JSON column is empty or null");
  }
  try {
    const parsed = JSON.parse(value);
    return schema.parse(parsed);
  } catch (e) {
    if (e instanceof z.ZodError) {
      throw new Error(`JSON column validation failed: ${e.message}`);
    }
    throw new Error(`Failed to parse JSON column: ${e instanceof Error ? e.message : String(e)}`);
  }
}

export function safeParseJsonColumn<T>(schema: z.ZodSchema<T>, value: string | null | undefined): T | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  try {
    const parsed = JSON.parse(value);
    return schema.parse(parsed);
  } catch {
    return null;
  }
}
