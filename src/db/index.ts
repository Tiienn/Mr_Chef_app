import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';

export type DbInstance = ReturnType<typeof createDrizzle>;

function createDrizzle() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL || 'file:sqlite.db',
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  return drizzle(client, { schema });
}

let dbInstance: DbInstance | null = null;

/**
 * Get the Drizzle database instance.
 * Creates the connection if it doesn't exist.
 */
export function getDb(): DbInstance {
  if (!dbInstance) {
    dbInstance = createDrizzle();
  }
  return dbInstance;
}

/**
 * Close the database connection.
 */
export function closeDb(): void {
  dbInstance = null;
}

// Default export for convenience (lazy-loaded singleton)
export const db = new Proxy({} as DbInstance, {
  get(_, prop) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export { schema };
