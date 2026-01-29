import { createHash } from 'crypto';
import { getDb, closeDb } from './index';
import { menuItems, adminUsers, orderItems, orders } from './schema';

// Menu items data from PRD
// Prices are stored in cents (Rs 200 = 20000)
const menuItemsData = [
  // Noodles
  { name: 'Fried Noodles - Chicken', category: 'Noodles', price: 20000, sortOrder: 1 },
  { name: 'Fried Noodles - Beef', category: 'Noodles', price: 20000, sortOrder: 2 },
  { name: 'Fried Noodles - Veg', category: 'Noodles', price: 12000, sortOrder: 3 },
  { name: 'Boiled Noodles - Beef', category: 'Noodles', price: 15000, sortOrder: 4 },
  { name: 'Boiled Noodles - Sichuan', category: 'Noodles', price: 15000, sortOrder: 5 },
  { name: 'Boiled Noodles - Black Bean', category: 'Noodles', price: 15000, sortOrder: 6 },
  { name: 'Egg (Addon)', category: 'Noodles', price: 2000, sortOrder: 7 },
  // Demi (half portions)
  { name: '1/2 Fried Noodles - Chicken', category: 'Demi', price: 12000, sortOrder: 8 },
  { name: '1/2 Fried Noodles - Beef', category: 'Demi', price: 12000, sortOrder: 9 },
  { name: '1/2 Boiled Noodles - Beef', category: 'Demi', price: 9000, sortOrder: 10 },
  { name: '1/2 Boiled Noodles - Sichuan', category: 'Demi', price: 9000, sortOrder: 11 },
  { name: '1/2 Boiled Noodles - Black Bean', category: 'Demi', price: 9000, sortOrder: 12 },
  { name: 'Egg (Addon)', category: 'Demi', price: 2000, sortOrder: 13 },
  // Dumplings
  { name: 'Gyoza', category: 'Dumplings', price: 2000, sortOrder: 14 },
  { name: 'Niouk Yen', category: 'Dumplings', price: 2000, sortOrder: 15 },
  { name: 'Sao Mai', category: 'Dumplings', price: 2000, sortOrder: 16 },
  // Bread
  { name: 'Bread - Beef', category: 'Bread', price: 7500, sortOrder: 17 },
  { name: 'Bread - Sichuan', category: 'Bread', price: 7500, sortOrder: 18 },
  { name: 'Bread - Tikka', category: 'Bread', price: 7500, sortOrder: 19 },
  { name: 'Bread - Black Bean', category: 'Bread', price: 7500, sortOrder: 20 },
  { name: 'Tikka', category: 'Bread', price: 5000, sortOrder: 21 },
  // Halim
  { name: 'Halim - Veg', category: 'Halim', price: 7500, sortOrder: 22 },
  { name: 'Halim - Lamb', category: 'Halim', price: 10000, sortOrder: 23 },
  // Fried Rice
  { name: 'Fried Rice - Chicken', category: 'Fried Rice', price: 20000, sortOrder: 24 },
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
