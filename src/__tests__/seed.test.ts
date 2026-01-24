/**
 * @jest-environment node
 */
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { eq } from 'drizzle-orm';
import * as schema from '@/db/schema';
import { menuItems, adminUsers } from '@/db/schema';
import {
  seed,
  seedMenuItems,
  seedAdminUser,
  hashPassword,
  menuItemsData,
} from '@/db/seed';

describe('Seed Script', () => {
  let sqlite: Database.Database;
  let db: ReturnType<typeof drizzle<typeof schema>>;

  beforeEach(() => {
    sqlite = new Database(':memory:');
    db = drizzle(sqlite, { schema });

    // Create required tables
    sqlite.exec(`
      CREATE TABLE menu_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        price INTEGER NOT NULL,
        available INTEGER NOT NULL DEFAULT 1,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER
      );

      CREATE TABLE admin_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at INTEGER
      );
    `);
  });

  afterEach(() => {
    sqlite.close();
  });

  describe('hashPassword', () => {
    it('should return a SHA-256 hash of the password', () => {
      const hash = hashPassword('admin123');
      // SHA-256 produces a 64-character hex string
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[a-f0-9]+$/);
    });

    it('should produce consistent hashes for the same input', () => {
      const hash1 = hashPassword('admin123');
      const hash2 = hashPassword('admin123');
      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different inputs', () => {
      const hash1 = hashPassword('admin123');
      const hash2 = hashPassword('password456');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('seedMenuItems', () => {
    it('should insert all menu items', async () => {
      await seedMenuItems(db);

      const items = db.select().from(menuItems).all();
      expect(items).toHaveLength(menuItemsData.length);
    });

    it('should insert menu items with correct categories', async () => {
      await seedMenuItems(db);

      const items = db.select().from(menuItems).all();
      const categories = [...new Set(items.map(item => item.category))];

      expect(categories).toContain('Noodles');
      expect(categories).toContain('Dumplings');
      expect(categories).toContain('Bread');
      expect(categories).toContain('Halim');
      expect(categories).toContain('Fried Rice');
      expect(categories).toHaveLength(5);
    });

    it('should insert noodles items correctly', async () => {
      await seedMenuItems(db);

      const noodles = db.select().from(menuItems).where(eq(menuItems.category, 'Noodles')).all();
      expect(noodles).toHaveLength(5);
      expect(noodles.map(n => n.name)).toContain('Fried Noodles - Chicken');
      expect(noodles.map(n => n.name)).toContain('Fried Noodles - Beef');
      expect(noodles.map(n => n.name)).toContain('Boiled Noodles - Beef');
      expect(noodles.map(n => n.name)).toContain('Boiled Noodles - Sichuan');
      expect(noodles.map(n => n.name)).toContain('Boiled Noodles - Black Bean');
    });

    it('should insert dumplings items correctly', async () => {
      await seedMenuItems(db);

      const dumplings = db.select().from(menuItems).where(eq(menuItems.category, 'Dumplings')).all();
      expect(dumplings).toHaveLength(3);
      expect(dumplings.map(d => d.name)).toContain('Gyoza');
      expect(dumplings.map(d => d.name)).toContain('Niouk Yen');
      expect(dumplings.map(d => d.name)).toContain('Sao Mai');
    });

    it('should insert bread items correctly', async () => {
      await seedMenuItems(db);

      const bread = db.select().from(menuItems).where(eq(menuItems.category, 'Bread')).all();
      expect(bread).toHaveLength(4);
      expect(bread.map(b => b.name)).toContain('Bread - Beef');
      expect(bread.map(b => b.name)).toContain('Bread - Sichuan');
      expect(bread.map(b => b.name)).toContain('Bread - Tikka');
      expect(bread.map(b => b.name)).toContain('Bread - Black Bean');
    });

    it('should insert halim items correctly', async () => {
      await seedMenuItems(db);

      const halim = db.select().from(menuItems).where(eq(menuItems.category, 'Halim')).all();
      expect(halim).toHaveLength(2);
      expect(halim.map(h => h.name)).toContain('Halim - Veg');
      expect(halim.map(h => h.name)).toContain('Halim - Lamb');
    });

    it('should insert fried rice items correctly', async () => {
      await seedMenuItems(db);

      const friedRice = db.select().from(menuItems).where(eq(menuItems.category, 'Fried Rice')).all();
      expect(friedRice).toHaveLength(1);
      expect(friedRice[0].name).toBe('Fried Rice - Chicken');
    });

    it('should set all prices to 0 by default', async () => {
      await seedMenuItems(db);

      const items = db.select().from(menuItems).all();
      items.forEach(item => {
        expect(item.price).toBe(0);
      });
    });

    it('should set all items as available by default', async () => {
      await seedMenuItems(db);

      const items = db.select().from(menuItems).all();
      items.forEach(item => {
        expect(item.available).toBe(true);
      });
    });

    it('should set correct sort order', async () => {
      await seedMenuItems(db);

      const items = db.select().from(menuItems).all();
      const sortedItems = [...items].sort((a, b) => a.sortOrder - b.sortOrder);

      // First item should be a noodle (sort order 1)
      expect(sortedItems[0].name).toBe('Fried Noodles - Chicken');
      expect(sortedItems[0].sortOrder).toBe(1);

      // Last item should be fried rice (sort order 15)
      expect(sortedItems[sortedItems.length - 1].name).toBe('Fried Rice - Chicken');
      expect(sortedItems[sortedItems.length - 1].sortOrder).toBe(15);
    });

    it('should clear existing menu items before seeding', async () => {
      // Insert some existing items
      db.insert(menuItems).values({
        name: 'Existing Item',
        category: 'Test',
        price: 1000,
      }).run();

      await seedMenuItems(db);

      const items = db.select().from(menuItems).all();
      expect(items).toHaveLength(menuItemsData.length);
      expect(items.find(i => i.name === 'Existing Item')).toBeUndefined();
    });
  });

  describe('seedAdminUser', () => {
    it('should create an admin user with username "admin"', async () => {
      await seedAdminUser(db);

      const admin = db.select().from(adminUsers).where(eq(adminUsers.username, 'admin')).get();
      expect(admin).toBeDefined();
      expect(admin?.username).toBe('admin');
    });

    it('should hash the password correctly', async () => {
      await seedAdminUser(db);

      const admin = db.select().from(adminUsers).where(eq(adminUsers.username, 'admin')).get();
      const expectedHash = hashPassword('admin123');
      expect(admin?.passwordHash).toBe(expectedHash);
    });

    it('should create exactly one admin user', async () => {
      await seedAdminUser(db);

      const admins = db.select().from(adminUsers).all();
      expect(admins).toHaveLength(1);
    });

    it('should clear existing admin users before seeding', async () => {
      // Insert existing admin
      db.insert(adminUsers).values({
        username: 'oldadmin',
        passwordHash: 'oldhash',
      }).run();

      await seedAdminUser(db);

      const admins = db.select().from(adminUsers).all();
      expect(admins).toHaveLength(1);
      expect(admins[0].username).toBe('admin');
    });
  });

  describe('seed', () => {
    it('should seed both menu items and admin user', async () => {
      await seed(db);

      const items = db.select().from(menuItems).all();
      const admin = db.select().from(adminUsers).where(eq(adminUsers.username, 'admin')).get();

      expect(items).toHaveLength(menuItemsData.length);
      expect(admin).toBeDefined();
    });

    it('should be idempotent (running multiple times produces same result)', async () => {
      await seed(db);
      await seed(db);
      await seed(db);

      const items = db.select().from(menuItems).all();
      const admins = db.select().from(adminUsers).all();

      expect(items).toHaveLength(menuItemsData.length);
      expect(admins).toHaveLength(1);
    });
  });

  describe('menuItemsData', () => {
    it('should have 15 menu items as per PRD', () => {
      expect(menuItemsData).toHaveLength(15);
    });

    it('should have correct count per category', () => {
      const byCategory = menuItemsData.reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      expect(byCategory['Noodles']).toBe(5);
      expect(byCategory['Dumplings']).toBe(3);
      expect(byCategory['Bread']).toBe(4);
      expect(byCategory['Halim']).toBe(2);
      expect(byCategory['Fried Rice']).toBe(1);
    });
  });
});
