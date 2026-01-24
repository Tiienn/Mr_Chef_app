import { drizzle, BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';

export type DbInstance = BetterSQLite3Database<typeof schema>;

const DB_PATH = process.env.DATABASE_URL || 'sqlite.db';

let sqliteInstance: Database.Database | null = null;
let dbInstance: DbInstance | null = null;

/**
 * Get the SQLite database instance.
 * Creates the connection if it doesn't exist.
 */
export function getSqlite(): Database.Database {
  if (!sqliteInstance) {
    sqliteInstance = new Database(DB_PATH);
  }
  return sqliteInstance;
}

/**
 * Get the Drizzle database instance.
 * Creates the connection if it doesn't exist.
 */
export function getDb(): DbInstance {
  if (!dbInstance) {
    dbInstance = drizzle(getSqlite(), { schema });
  }
  return dbInstance;
}

/**
 * Close the database connection.
 * Useful for cleanup in tests or application shutdown.
 */
export function closeDb(): void {
  if (sqliteInstance) {
    sqliteInstance.close();
    sqliteInstance = null;
    dbInstance = null;
  }
}

/**
 * Create an in-memory database for testing.
 * Returns both the SQLite instance and Drizzle database.
 */
export function createTestDb(): { sqlite: Database.Database; db: DbInstance } {
  const sqlite = new Database(':memory:');
  const db = drizzle(sqlite, { schema });
  return { sqlite, db };
}

/**
 * Initialize test database with schema.
 * Creates all tables needed for the application.
 */
export function initTestSchema(sqlite: Database.Database): void {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS menu_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price INTEGER NOT NULL,
      available INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT NOT NULL,
      table_number TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      total INTEGER NOT NULL,
      created_at INTEGER,
      updated_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id),
      menu_item_id INTEGER NOT NULL REFERENCES menu_items(id),
      quantity INTEGER NOT NULL,
      notes TEXT,
      price_at_time INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      amount INTEGER NOT NULL,
      date TEXT NOT NULL,
      created_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS staff (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      staff_id INTEGER NOT NULL REFERENCES staff(id),
      date TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS daily_balance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      opening_balance INTEGER NOT NULL,
      closing_balance INTEGER,
      created_at INTEGER
    );
  `);
}

// Default export for convenience (lazy-loaded singleton)
export const db = new Proxy({} as DbInstance, {
  get(_, prop) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export { schema };
