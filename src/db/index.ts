import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';

const DB_PATH = process.env.DATABASE_URL || 'sqlite.db';

const sqlite = new Database(DB_PATH);
export const db = drizzle(sqlite, { schema });

export { schema };
