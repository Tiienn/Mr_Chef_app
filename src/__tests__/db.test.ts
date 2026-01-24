/**
 * @jest-environment node
 */
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { eq } from 'drizzle-orm';
import * as schema from '@/db/schema';
import { users } from '@/db/schema';

describe('Drizzle ORM with SQLite', () => {
  let sqlite: Database.Database;
  let db: ReturnType<typeof drizzle<typeof schema>>;

  beforeEach(() => {
    // Create an in-memory database for testing
    sqlite = new Database(':memory:');
    db = drizzle(sqlite, { schema });

    // Create the users table
    sqlite.exec(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        created_at INTEGER
      )
    `);
  });

  afterEach(() => {
    sqlite.close();
  });

  it('should connect to the database', () => {
    expect(db).toBeDefined();
    expect(sqlite.open).toBe(true);
  });

  it('should insert a user', async () => {
    const result = db.insert(users).values({
      name: 'John Doe',
      email: 'john@example.com',
    }).returning().get();

    expect(result).toBeDefined();
    expect(result.id).toBe(1);
    expect(result.name).toBe('John Doe');
    expect(result.email).toBe('john@example.com');
  });

  it('should query users', async () => {
    // Insert test data
    db.insert(users).values({
      name: 'Jane Doe',
      email: 'jane@example.com',
    }).run();

    const allUsers = db.select().from(users).all();

    expect(allUsers).toHaveLength(1);
    expect(allUsers[0].name).toBe('Jane Doe');
  });

  it('should update a user', async () => {
    // Insert test data
    const inserted = db.insert(users).values({
      name: 'Original Name',
      email: 'test@example.com',
    }).returning().get();

    // Update the user
    db.update(users)
      .set({ name: 'Updated Name' })
      .where(eq(users.id, inserted.id))
      .run();

    const updated = db.select().from(users).where(eq(users.id, inserted.id)).get();

    expect(updated?.name).toBe('Updated Name');
  });

  it('should delete a user', async () => {
    // Insert test data
    const inserted = db.insert(users).values({
      name: 'To Delete',
      email: 'delete@example.com',
    }).returning().get();

    // Delete the user
    db.delete(users).where(eq(users.id, inserted.id)).run();

    const deleted = db.select().from(users).where(eq(users.id, inserted.id)).get();

    expect(deleted).toBeUndefined();
  });

  it('should enforce unique email constraint', () => {
    db.insert(users).values({
      name: 'First User',
      email: 'same@example.com',
    }).run();

    expect(() => {
      db.insert(users).values({
        name: 'Second User',
        email: 'same@example.com',
      }).run();
    }).toThrow();
  });
});
