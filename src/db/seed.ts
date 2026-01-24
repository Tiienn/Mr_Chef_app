import { createHash } from 'crypto';
import { getDb, getSqlite, closeDb } from './index';
import { menuItems, adminUsers } from './schema';

// Menu items data from PRD
const menuItemsData = [
  // Noodles
  { name: 'Fried Noodles - Chicken', category: 'Noodles', price: 0, sortOrder: 1 },
  { name: 'Fried Noodles - Beef', category: 'Noodles', price: 0, sortOrder: 2 },
  { name: 'Boiled Noodles - Beef', category: 'Noodles', price: 0, sortOrder: 3 },
  { name: 'Boiled Noodles - Sichuan', category: 'Noodles', price: 0, sortOrder: 4 },
  { name: 'Boiled Noodles - Black Bean', category: 'Noodles', price: 0, sortOrder: 5 },
  // Dumplings
  { name: 'Gyoza', category: 'Dumplings', price: 0, sortOrder: 6 },
  { name: 'Niouk Yen', category: 'Dumplings', price: 0, sortOrder: 7 },
  { name: 'Sao Mai', category: 'Dumplings', price: 0, sortOrder: 8 },
  // Bread
  { name: 'Bread - Beef', category: 'Bread', price: 0, sortOrder: 9 },
  { name: 'Bread - Sichuan', category: 'Bread', price: 0, sortOrder: 10 },
  { name: 'Bread - Tikka', category: 'Bread', price: 0, sortOrder: 11 },
  { name: 'Bread - Black Bean', category: 'Bread', price: 0, sortOrder: 12 },
  // Halim
  { name: 'Halim - Veg', category: 'Halim', price: 0, sortOrder: 13 },
  { name: 'Halim - Lamb', category: 'Halim', price: 0, sortOrder: 14 },
  // Fried Rice
  { name: 'Fried Rice - Chicken', category: 'Fried Rice', price: 0, sortOrder: 15 },
];

/**
 * Hash a password using SHA-256.
 * Note: In production, use bcrypt or argon2 instead.
 */
export function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

/**
 * Seed menu items into the database.
 * Clears existing menu items and inserts fresh data.
 */
export async function seedMenuItems(db: ReturnType<typeof getDb>): Promise<void> {
  // Clear existing menu items
  db.delete(menuItems).run();

  // Insert menu items
  db.insert(menuItems).values(menuItemsData).run();
}

/**
 * Seed the default admin user into the database.
 * Clears existing admin users and creates the default admin.
 */
export async function seedAdminUser(db: ReturnType<typeof getDb>): Promise<void> {
  // Clear existing admin users
  db.delete(adminUsers).run();

  // Create default admin user
  const passwordHash = hashPassword('admin123');
  db.insert(adminUsers).values({
    username: 'admin',
    passwordHash,
  }).run();
}

/**
 * Run the complete seed operation.
 * This will clear and repopulate menu_items and admin_users tables.
 */
export async function seed(db?: ReturnType<typeof getDb>): Promise<void> {
  const database = db || getDb();

  console.log('Starting database seed...');

  await seedMenuItems(database);
  console.log(`Seeded ${menuItemsData.length} menu items`);

  await seedAdminUser(database);
  console.log('Seeded default admin user (username: admin)');

  console.log('Database seed completed successfully!');
}

// Run seed if this file is executed directly
if (require.main === module) {
  // Initialize database schema first
  const sqlite = getSqlite();
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

  seed()
    .then(() => {
      closeDb();
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seed failed:', error);
      closeDb();
      process.exit(1);
    });
}

// Export menu items data for testing
export { menuItemsData };
