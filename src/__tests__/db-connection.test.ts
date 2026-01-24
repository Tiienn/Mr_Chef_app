/**
 * @jest-environment node
 */
import Database from 'better-sqlite3';
import {
  getDb,
  getSqlite,
  closeDb,
  createTestDb,
  initTestSchema,
  DbInstance,
} from '@/db';
import { menuItems } from '@/db/schema';

describe('Database Connection Utility', () => {
  describe('createTestDb', () => {
    it('should create an in-memory database', () => {
      const { sqlite, db } = createTestDb();

      expect(sqlite).toBeInstanceOf(Database);
      expect(db).toBeDefined();

      sqlite.close();
    });

    it('should create independent database instances', () => {
      const { sqlite: sqlite1, db: db1 } = createTestDb();
      const { sqlite: sqlite2, db: db2 } = createTestDb();

      expect(sqlite1).not.toBe(sqlite2);
      expect(db1).not.toBe(db2);

      sqlite1.close();
      sqlite2.close();
    });
  });

  describe('initTestSchema', () => {
    it('should create all required tables', () => {
      const { sqlite } = createTestDb();
      initTestSchema(sqlite);

      const tables = sqlite
        .prepare(
          "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
        )
        .all() as { name: string }[];

      const tableNames = tables.map((t) => t.name);

      expect(tableNames).toContain('menu_items');
      expect(tableNames).toContain('orders');
      expect(tableNames).toContain('order_items');
      expect(tableNames).toContain('expenses');
      expect(tableNames).toContain('staff');
      expect(tableNames).toContain('attendance');
      expect(tableNames).toContain('admin_users');
      expect(tableNames).toContain('daily_balance');

      sqlite.close();
    });

    it('should be idempotent (can be called multiple times)', () => {
      const { sqlite } = createTestDb();

      expect(() => {
        initTestSchema(sqlite);
        initTestSchema(sqlite);
      }).not.toThrow();

      sqlite.close();
    });

    it('should allow inserting data after schema initialization', () => {
      const { sqlite, db } = createTestDb();
      initTestSchema(sqlite);

      const result = db
        .insert(menuItems)
        .values({
          name: 'Test Item',
          category: 'Test Category',
          price: 1000,
        })
        .returning()
        .get();

      expect(result).toBeDefined();
      expect(result.name).toBe('Test Item');
      expect(result.category).toBe('Test Category');
      expect(result.price).toBe(1000);

      sqlite.close();
    });
  });

  describe('getSqlite and getDb', () => {
    afterEach(() => {
      closeDb();
    });

    it('should return a SQLite database instance', () => {
      const sqlite = getSqlite();
      expect(sqlite).toBeInstanceOf(Database);
    });

    it('should return the same instance on subsequent calls (singleton)', () => {
      const sqlite1 = getSqlite();
      const sqlite2 = getSqlite();
      expect(sqlite1).toBe(sqlite2);
    });

    it('should return a Drizzle database instance', () => {
      const db = getDb();
      expect(db).toBeDefined();
      expect(typeof db.select).toBe('function');
      expect(typeof db.insert).toBe('function');
      expect(typeof db.update).toBe('function');
      expect(typeof db.delete).toBe('function');
    });

    it('should return the same Drizzle instance on subsequent calls', () => {
      const db1 = getDb();
      const db2 = getDb();
      expect(db1).toBe(db2);
    });
  });

  describe('closeDb', () => {
    it('should close the database connection', () => {
      getSqlite(); // Initialize the connection
      expect(() => closeDb()).not.toThrow();
    });

    it('should allow reopening after close', () => {
      const sqlite1 = getSqlite();
      closeDb();

      const sqlite2 = getSqlite();
      expect(sqlite2).toBeDefined();
      expect(sqlite2).not.toBe(sqlite1);

      closeDb();
    });

    it('should not throw when called multiple times', () => {
      getSqlite();
      expect(() => {
        closeDb();
        closeDb();
        closeDb();
      }).not.toThrow();
    });

    it('should not throw when no connection exists', () => {
      expect(() => closeDb()).not.toThrow();
    });
  });

  describe('DbInstance type', () => {
    it('should be compatible with Drizzle operations', () => {
      const { sqlite, db } = createTestDb();
      initTestSchema(sqlite);

      // Type assertion to verify DbInstance type works correctly
      const typedDb: DbInstance = db;

      const result = typedDb
        .insert(menuItems)
        .values({
          name: 'Typed Test',
          category: 'Category',
          price: 500,
        })
        .returning()
        .get();

      expect(result.name).toBe('Typed Test');

      sqlite.close();
    });
  });
});
