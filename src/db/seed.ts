import { createHash } from 'crypto';
import { getDb, closeDb } from './index';
import { menuItems, adminUsers, orderItems, orders } from './schema';

// Menu items data from PRD
// Prices are stored in cents (Rs 200 = 20000)
const menuItemsData = [
  // Noodles
  { name: 'Fried Noodles - Chicken', category: 'Noodles', price: 20000, sortOrder: 1 },
  { name: 'Fried Noodles - Beef', category: 'Noodles', price: 20000, sortOrder: 2 },
  { name: 'Boiled Noodles - Beef', category: 'Noodles', price: 15000, sortOrder: 3 },
  { name: 'Boiled Noodles - Sichuan', category: 'Noodles', price: 15000, sortOrder: 4 },
  { name: 'Boiled Noodles - Black Bean', category: 'Noodles', price: 15000, sortOrder: 5 },
  { name: 'Egg (Addon)', category: 'Noodles', price: 2000, sortOrder: 6 },
  // Dumplings
  { name: 'Gyoza', category: 'Dumplings', price: 2000, sortOrder: 7 },
  { name: 'Niouk Yen', category: 'Dumplings', price: 2000, sortOrder: 8 },
  { name: 'Sao Mai', category: 'Dumplings', price: 2000, sortOrder: 9 },
  // Bread
  { name: 'Bread - Beef', category: 'Bread', price: 7500, sortOrder: 10 },
  { name: 'Bread - Sichuan', category: 'Bread', price: 7500, sortOrder: 11 },
  { name: 'Bread - Tikka', category: 'Bread', price: 7500, sortOrder: 12 },
  { name: 'Bread - Black Bean', category: 'Bread', price: 7500, sortOrder: 13 },
  // Halim
  { name: 'Halim - Veg', category: 'Halim', price: 7500, sortOrder: 14 },
  { name: 'Halim - Lamb', category: 'Halim', price: 10000, sortOrder: 15 },
  // Fried Rice
  { name: 'Fried Rice - Chicken', category: 'Fried Rice', price: 20000, sortOrder: 16 },
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
 */
export async function seedMenuItems(db: ReturnType<typeof getDb>): Promise<void> {
  // Delete order_items first (FK to menu_items and orders)
  await db.delete(orderItems);
  await db.delete(orders);
  await db.delete(menuItems);
  await db.insert(menuItems).values(menuItemsData);
}

/**
 * Seed the default admin user into the database.
 */
export async function seedAdminUser(db: ReturnType<typeof getDb>): Promise<void> {
  await db.delete(adminUsers);
  const passwordHash = hashPassword('admin123');
  await db.insert(adminUsers).values({
    username: 'admin',
    passwordHash,
  });
}

/**
 * Run the complete seed operation.
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
