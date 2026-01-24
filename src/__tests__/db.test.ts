/**
 * @jest-environment node
 */
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { eq } from 'drizzle-orm';
import * as schema from '@/db/schema';
import {
  menuItems,
  orders,
  orderItems,
  expenses,
  staff,
  attendance,
  adminUsers,
  dailyBalance,
} from '@/db/schema';

describe('Database Schema', () => {
  let sqlite: Database.Database;
  let db: ReturnType<typeof drizzle<typeof schema>>;

  beforeEach(() => {
    sqlite = new Database(':memory:');
    db = drizzle(sqlite, { schema });

    // Create all tables
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

      CREATE TABLE orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_number TEXT NOT NULL,
        table_number TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        total INTEGER NOT NULL,
        created_at INTEGER,
        updated_at INTEGER
      );

      CREATE TABLE order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL REFERENCES orders(id),
        menu_item_id INTEGER NOT NULL REFERENCES menu_items(id),
        quantity INTEGER NOT NULL,
        notes TEXT,
        price_at_time INTEGER NOT NULL
      );

      CREATE TABLE expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT NOT NULL,
        description TEXT NOT NULL,
        amount INTEGER NOT NULL,
        date TEXT NOT NULL,
        created_at INTEGER
      );

      CREATE TABLE staff (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        active INTEGER NOT NULL DEFAULT 1,
        created_at INTEGER
      );

      CREATE TABLE attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        staff_id INTEGER NOT NULL REFERENCES staff(id),
        date TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at INTEGER
      );

      CREATE TABLE admin_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at INTEGER
      );

      CREATE TABLE daily_balance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL UNIQUE,
        opening_balance INTEGER NOT NULL,
        closing_balance INTEGER,
        created_at INTEGER
      );
    `);
  });

  afterEach(() => {
    sqlite.close();
  });

  describe('menu_items table', () => {
    it('should insert a menu item', () => {
      const result = db.insert(menuItems).values({
        name: 'Fried Noodles - Chicken',
        category: 'Noodles',
        price: 1500,
      }).returning().get();

      expect(result.id).toBe(1);
      expect(result.name).toBe('Fried Noodles - Chicken');
      expect(result.category).toBe('Noodles');
      expect(result.price).toBe(1500);
      expect(result.available).toBe(true);
      expect(result.sortOrder).toBe(0);
    });

    it('should update menu item availability', () => {
      const item = db.insert(menuItems).values({
        name: 'Gyoza',
        category: 'Dumplings',
        price: 800,
      }).returning().get();

      db.update(menuItems)
        .set({ available: false })
        .where(eq(menuItems.id, item.id))
        .run();

      const updated = db.select().from(menuItems).where(eq(menuItems.id, item.id)).get();
      expect(updated?.available).toBe(false);
    });

    it('should filter by category', () => {
      db.insert(menuItems).values([
        { name: 'Fried Noodles', category: 'Noodles', price: 1500 },
        { name: 'Gyoza', category: 'Dumplings', price: 800 },
        { name: 'Boiled Noodles', category: 'Noodles', price: 1200 },
      ]).run();

      const noodles = db.select().from(menuItems).where(eq(menuItems.category, 'Noodles')).all();
      expect(noodles).toHaveLength(2);
    });
  });

  describe('orders table', () => {
    it('should create an order with default pending status', () => {
      const result = db.insert(orders).values({
        orderNumber: '001',
        total: 2300,
      }).returning().get();

      expect(result.orderNumber).toBe('001');
      expect(result.status).toBe('pending');
      expect(result.total).toBe(2300);
      expect(result.tableNumber).toBeNull();
    });

    it('should create an order with table number', () => {
      const result = db.insert(orders).values({
        orderNumber: '002',
        tableNumber: 'T5',
        total: 1500,
      }).returning().get();

      expect(result.tableNumber).toBe('T5');
    });

    it('should update order status', () => {
      const order = db.insert(orders).values({
        orderNumber: '003',
        total: 1000,
      }).returning().get();

      db.update(orders)
        .set({ status: 'preparing' })
        .where(eq(orders.id, order.id))
        .run();

      const updated = db.select().from(orders).where(eq(orders.id, order.id)).get();
      expect(updated?.status).toBe('preparing');
    });
  });

  describe('order_items table', () => {
    it('should create order items with references', () => {
      const menuItem = db.insert(menuItems).values({
        name: 'Fried Rice',
        category: 'Fried Rice',
        price: 1200,
      }).returning().get();

      const order = db.insert(orders).values({
        orderNumber: '001',
        total: 2400,
      }).returning().get();

      const result = db.insert(orderItems).values({
        orderId: order.id,
        menuItemId: menuItem.id,
        quantity: 2,
        priceAtTime: 1200,
      }).returning().get();

      expect(result.orderId).toBe(order.id);
      expect(result.menuItemId).toBe(menuItem.id);
      expect(result.quantity).toBe(2);
      expect(result.priceAtTime).toBe(1200);
      expect(result.notes).toBeNull();
    });

    it('should store special notes', () => {
      const menuItem = db.insert(menuItems).values({
        name: 'Fried Noodles',
        category: 'Noodles',
        price: 1500,
      }).returning().get();

      const order = db.insert(orders).values({
        orderNumber: '002',
        total: 1500,
      }).returning().get();

      const result = db.insert(orderItems).values({
        orderId: order.id,
        menuItemId: menuItem.id,
        quantity: 1,
        priceAtTime: 1500,
        notes: 'no onion, extra spicy',
      }).returning().get();

      expect(result.notes).toBe('no onion, extra spicy');
    });
  });

  describe('expenses table', () => {
    it('should create an expense', () => {
      const result = db.insert(expenses).values({
        category: 'ingredients',
        description: 'Weekly vegetables',
        amount: 50000,
        date: '2024-01-15',
      }).returning().get();

      expect(result.category).toBe('ingredients');
      expect(result.description).toBe('Weekly vegetables');
      expect(result.amount).toBe(50000);
      expect(result.date).toBe('2024-01-15');
    });

    it('should filter expenses by category', () => {
      db.insert(expenses).values([
        { category: 'ingredients', description: 'Vegetables', amount: 5000, date: '2024-01-15' },
        { category: 'rent', description: 'Monthly rent', amount: 100000, date: '2024-01-01' },
        { category: 'ingredients', description: 'Meat', amount: 8000, date: '2024-01-15' },
      ]).run();

      const ingredientExpenses = db.select().from(expenses).where(eq(expenses.category, 'ingredients')).all();
      expect(ingredientExpenses).toHaveLength(2);
    });
  });

  describe('staff table', () => {
    it('should create staff member with default active status', () => {
      const result = db.insert(staff).values({
        name: 'John Doe',
      }).returning().get();

      expect(result.name).toBe('John Doe');
      expect(result.active).toBe(true);
    });

    it('should deactivate a staff member', () => {
      const member = db.insert(staff).values({
        name: 'Jane Doe',
      }).returning().get();

      db.update(staff)
        .set({ active: false })
        .where(eq(staff.id, member.id))
        .run();

      const updated = db.select().from(staff).where(eq(staff.id, member.id)).get();
      expect(updated?.active).toBe(false);
    });
  });

  describe('attendance table', () => {
    it('should create attendance record', () => {
      const member = db.insert(staff).values({
        name: 'John Doe',
      }).returning().get();

      const result = db.insert(attendance).values({
        staffId: member.id,
        date: '2024-01-15',
        status: 'present',
      }).returning().get();

      expect(result.staffId).toBe(member.id);
      expect(result.date).toBe('2024-01-15');
      expect(result.status).toBe('present');
    });

    it('should track different attendance statuses', () => {
      const member = db.insert(staff).values({
        name: 'Jane Doe',
      }).returning().get();

      db.insert(attendance).values([
        { staffId: member.id, date: '2024-01-15', status: 'present' },
        { staffId: member.id, date: '2024-01-16', status: 'absent' },
        { staffId: member.id, date: '2024-01-17', status: 'day_off' },
      ]).run();

      const records = db.select().from(attendance).where(eq(attendance.staffId, member.id)).all();
      expect(records).toHaveLength(3);
      expect(records.map(r => r.status)).toEqual(['present', 'absent', 'day_off']);
    });
  });

  describe('admin_users table', () => {
    it('should create admin user', () => {
      const result = db.insert(adminUsers).values({
        username: 'admin',
        passwordHash: 'hashed_password_here',
      }).returning().get();

      expect(result.username).toBe('admin');
      expect(result.passwordHash).toBe('hashed_password_here');
    });

    it('should enforce unique username', () => {
      db.insert(adminUsers).values({
        username: 'admin',
        passwordHash: 'hash1',
      }).run();

      expect(() => {
        db.insert(adminUsers).values({
          username: 'admin',
          passwordHash: 'hash2',
        }).run();
      }).toThrow();
    });
  });

  describe('daily_balance table', () => {
    it('should create daily balance record', () => {
      const result = db.insert(dailyBalance).values({
        date: '2024-01-15',
        openingBalance: 100000,
      }).returning().get();

      expect(result.date).toBe('2024-01-15');
      expect(result.openingBalance).toBe(100000);
      expect(result.closingBalance).toBeNull();
    });

    it('should update closing balance', () => {
      const record = db.insert(dailyBalance).values({
        date: '2024-01-15',
        openingBalance: 100000,
      }).returning().get();

      db.update(dailyBalance)
        .set({ closingBalance: 150000 })
        .where(eq(dailyBalance.id, record.id))
        .run();

      const updated = db.select().from(dailyBalance).where(eq(dailyBalance.id, record.id)).get();
      expect(updated?.closingBalance).toBe(150000);
    });

    it('should enforce unique date', () => {
      db.insert(dailyBalance).values({
        date: '2024-01-15',
        openingBalance: 100000,
      }).run();

      expect(() => {
        db.insert(dailyBalance).values({
          date: '2024-01-15',
          openingBalance: 120000,
        }).run();
      }).toThrow();
    });
  });

  describe('type exports', () => {
    it('should have correct types exported', () => {
      // Type check - these should compile without errors
      const menuItem: schema.NewMenuItem = {
        name: 'Test',
        category: 'Test',
        price: 100,
      };
      const order: schema.NewOrder = {
        orderNumber: '001',
        total: 100,
      };
      const orderItem: schema.NewOrderItem = {
        orderId: 1,
        menuItemId: 1,
        quantity: 1,
        priceAtTime: 100,
      };
      const expense: schema.NewExpense = {
        category: 'ingredients',
        description: 'Test',
        amount: 100,
        date: '2024-01-01',
      };
      const staffMember: schema.NewStaff = {
        name: 'Test',
      };
      const attendanceRecord: schema.NewAttendance = {
        staffId: 1,
        date: '2024-01-01',
        status: 'present',
      };
      const admin: schema.NewAdminUser = {
        username: 'admin',
        passwordHash: 'hash',
      };
      const balance: schema.NewDailyBalance = {
        date: '2024-01-01',
        openingBalance: 0,
      };

      expect(menuItem).toBeDefined();
      expect(order).toBeDefined();
      expect(orderItem).toBeDefined();
      expect(expense).toBeDefined();
      expect(staffMember).toBeDefined();
      expect(attendanceRecord).toBeDefined();
      expect(admin).toBeDefined();
      expect(balance).toBeDefined();
    });
  });
});
