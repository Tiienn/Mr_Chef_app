import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// Menu items table
export const menuItems = sqliteTable('menu_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  category: text('category').notNull(),
  price: integer('price').notNull(),
  available: integer('available', { mode: 'boolean' }).notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Orders table
export const orders = sqliteTable('orders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderNumber: text('order_number').notNull(),
  tableNumber: text('table_number'),
  status: text('status', { enum: ['pending', 'preparing', 'ready', 'served'] }).notNull().default('pending'),
  total: integer('total').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Order items table
export const orderItems = sqliteTable('order_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderId: integer('order_id').notNull().references(() => orders.id),
  menuItemId: integer('menu_item_id').notNull().references(() => menuItems.id),
  quantity: integer('quantity').notNull(),
  notes: text('notes'),
  priceAtTime: integer('price_at_time').notNull(),
});

// Expenses table
export const expenses = sqliteTable('expenses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  category: text('category', { enum: ['ingredients', 'rent', 'wages', 'utilities', 'other'] }).notNull(),
  description: text('description').notNull(),
  amount: integer('amount').notNull(),
  date: text('date').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Staff table
export const staff = sqliteTable('staff', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Attendance table
export const attendance = sqliteTable('attendance', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  staffId: integer('staff_id').notNull().references(() => staff.id),
  date: text('date').notNull(),
  status: text('status', { enum: ['present', 'absent', 'day_off'] }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Admin users table
export const adminUsers = sqliteTable('admin_users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Daily balance table
export const dailyBalance = sqliteTable('daily_balance', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  date: text('date').notNull().unique(),
  openingBalance: integer('opening_balance').notNull(),
  closingBalance: integer('closing_balance'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Relations
export const ordersRelations = relations(orders, ({ many }) => ({
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  menuItem: one(menuItems, {
    fields: [orderItems.menuItemId],
    references: [menuItems.id],
  }),
}));

export const menuItemsRelations = relations(menuItems, ({ many }) => ({
  orderItems: many(orderItems),
}));

export const staffRelations = relations(staff, ({ many }) => ({
  attendance: many(attendance),
}));

export const attendanceRelations = relations(attendance, ({ one }) => ({
  staff: one(staff, {
    fields: [attendance.staffId],
    references: [staff.id],
  }),
}));

// Type exports
export type MenuItem = typeof menuItems.$inferSelect;
export type NewMenuItem = typeof menuItems.$inferInsert;

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;

export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;

export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;

export type Staff = typeof staff.$inferSelect;
export type NewStaff = typeof staff.$inferInsert;

export type Attendance = typeof attendance.$inferSelect;
export type NewAttendance = typeof attendance.$inferInsert;

export type AdminUser = typeof adminUsers.$inferSelect;
export type NewAdminUser = typeof adminUsers.$inferInsert;

export type DailyBalance = typeof dailyBalance.$inferSelect;
export type NewDailyBalance = typeof dailyBalance.$inferInsert;
