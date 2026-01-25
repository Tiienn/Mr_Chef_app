# Mr Chef - Restaurant Management App

## Project Overview

A mobile-first web application for a small restaurant handling three core functions:
1. **Order Dispatch** - Fast touch-friendly ordering with real-time kitchen display
2. **Financial Dashboard** - Revenue tracking, expense management, profit calculations
3. **Staff Attendance** - Calendar-based attendance tracking

### Business Context
- Single location restaurant
- ~15 menu items across 5 categories
- Current pain point: Orders manually typed into WhatsApp (slow, error-prone)
- Primary users: Staff on tablets/phones, Owner checking dashboard on phone

### User Roles
1. **Staff/Cashier** - Access ordering screen only (no login required)
2. **Admin/Owner** - Access everything (requires login)

---

## Technical Stack

- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript (strict mode)
- **Database**: SQLite with Drizzle ORM
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Real-time**: Server-Sent Events (SSE) for kitchen display
- **Authentication**: Simple username/password with cookie session (admin only)

### Project Structure
```
src/
├── app/
│   ├── (public)/
│   │   └── order/          # Staff ordering screen
│   ├── (admin)/
│   │   ├── kitchen/        # Kitchen display
│   │   ├── dashboard/      # Financial dashboard
│   │   ├── expenses/       # Expense management
│   │   └── attendance/     # Staff attendance
│   ├── api/
│   │   └── ...
│   └── login/
├── components/
│   ├── ui/                 # shadcn components
│   └── ...
├── db/
│   ├── schema.ts           # Drizzle schema
│   └── index.ts            # DB connection
├── lib/
│   └── utils.ts
└── types/
    └── index.ts
```

### Design Principles
- Mobile-first: All screens must work on phones/tablets
- Touch-friendly: Large tap targets (min 44px), no hover-dependent UI
- Fast: Order screen must allow rapid item selection
- Simple: No over-engineering, minimal dependencies

---

## Database Schema

### Tables

**menu_items**
- id (integer, primary key)
- name (text) - e.g., "Fried Noodles - Chicken"
- category (text) - e.g., "Noodles", "Dumplings", "Bread", "Halim", "Fried Rice"
- price (integer) - stored in cents
- available (boolean, default true)
- sort_order (integer)
- created_at (timestamp)

**orders**
- id (integer, primary key)
- order_number (text) - auto-generated, e.g., "001", "002"
- table_number (text, nullable)
- status (text) - "pending" | "preparing" | "ready" | "served"
- total (integer) - stored in cents
- created_at (timestamp)
- updated_at (timestamp)

**order_items**
- id (integer, primary key)
- order_id (integer, foreign key)
- menu_item_id (integer, foreign key)
- quantity (integer)
- notes (text, nullable) - e.g., "no onion", "extra spicy"
- price_at_time (integer) - price when ordered, in cents

**expenses**
- id (integer, primary key)
- category (text) - "ingredients" | "rent" | "wages" | "utilities" | "other"
- description (text)
- amount (integer) - stored in cents
- date (text) - YYYY-MM-DD format
- created_at (timestamp)

**staff**
- id (integer, primary key)
- name (text)
- active (boolean, default true)
- created_at (timestamp)

**attendance**
- id (integer, primary key)
- staff_id (integer, foreign key)
- date (text) - YYYY-MM-DD format
- status (text) - "present" | "absent" | "day_off"
- created_at (timestamp)

**admin_users**
- id (integer, primary key)
- username (text, unique)
- password_hash (text)
- created_at (timestamp)

**daily_balance**
- id (integer, primary key)
- date (text, unique) - YYYY-MM-DD format
- opening_balance (integer) - stored in cents
- closing_balance (integer, nullable)
- created_at (timestamp)

---

## Menu Items (Seed Data)

| Category | Items |
|----------|-------|
| Noodles | Fried Noodles - Chicken, Fried Noodles - Beef, Boiled Noodles - Beef, Boiled Noodles - Sichuan, Boiled Noodles - Black Bean |
| Dumplings | Gyoza, Niouk Yen, Sao Mai |
| Bread | Bread - Beef, Bread - Sichuan, Bread - Tikka, Bread - Black Bean |
| Halim | Halim - Veg, Halim - Lamb |
| Fried Rice | Fried Rice - Chicken |

Default price: Set all to 0 (admin will configure actual prices)

---

## Tasks

### Phase 0: Project Setup
- [x] Initialize Next.js 14 project with TypeScript, Tailwind CSS, and src/ directory structure
- [x] Install and configure Drizzle ORM with SQLite (better-sqlite3 driver)
- [x] Install shadcn/ui and add required components: button, card, input, badge, dialog, tabs, select, calendar, toast
- [x] Create the database schema file at src/db/schema.ts with all tables defined above
- [x] Create database connection utility at src/db/index.ts
- [x] Create a seed script at src/db/seed.ts that populates menu_items with the items listed above and creates a default admin user (username: admin, password: admin123)
- [x] Add npm script "db:seed" to run the seed script

### Phase 1: Order Dispatch System
- [x] Create the order screen page at src/app/(public)/order/page.tsx with a mobile-first layout showing category tabs at top and menu items as large tappable cards in a grid
- [x] Implement menu item cards that show item name and price, with tap-to-add functionality that adds item to current order
- [x] Create a collapsible order summary panel at bottom of order screen showing current items, quantities, and running total
- [x] Add quantity controls (+ and -) to order summary items, with swipe-to-remove or delete button
- [x] Add a notes button on each order summary item that opens a dialog to enter special instructions (e.g., "no onion")
- [x] Add table number input field (optional) at top of order summary panel
- [x] Create the submit order functionality that saves order to database with status "pending" and auto-generates order number (daily sequential: 001, 002, etc.)
- [x] Display success feedback with order number after submission and clear the order form
- [x] Create the kitchen display page at src/app/(admin)/kitchen/page.tsx showing all orders in a card-based queue layout organized by status columns
- [x] Implement Server-Sent Events (SSE) endpoint at src/app/api/orders/stream/route.ts to push real-time order updates to kitchen display
- [x] Connect kitchen display to SSE stream so new orders appear automatically without page refresh
- [x] Add status update buttons on kitchen order cards: "Start Preparing" (pending→preparing), "Ready" (preparing→ready), "Served" (ready→served)
- [x] Add audio notification sound when new order arrives on kitchen display
- [x] Create order history page at src/app/(admin)/kitchen/history/page.tsx showing today's completed orders with filters

### Phase 2: Authentication & Admin Layout
- [x] Create login page at src/app/login/page.tsx with username and password form
- [x] Implement login API route at src/app/api/auth/login/route.ts that validates credentials against admin_users table and sets HTTP-only session cookie
- [x] Create logout API route at src/app/api/auth/logout/route.ts that clears session cookie
- [x] Create auth middleware at src/middleware.ts that protects all /dashboard, /expenses, /attendance routes - redirects to /login if not authenticated
- [x] Create admin layout at src/app/(admin)/layout.tsx with mobile-friendly bottom navigation bar showing icons for: Kitchen, Dashboard, Expenses, Attendance, and Logout button

### Phase 3: Financial Dashboard
- [x] Create dashboard page at src/app/(admin)/dashboard/page.tsx with mobile-optimized card layout
- [x] Add daily summary card showing: total orders count, total revenue, opening balance input, closing balance input, and calculated profit for today
- [x] Create API route to save/update daily opening and closing balance at src/app/api/balance/route.ts
- [x] Add top selling items section showing ranked list of menu items by quantity sold today
- [x] Add date picker to view historical daily summaries
- [x] Create sales analytics section with period selector (daily/weekly/monthly) showing revenue totals and order counts
- [x] Create expenses page at src/app/(admin)/expenses/page.tsx with a form to add new expenses (category dropdown, description, amount, date)
- [x] Display expense list for selected date range with category filters and totals per category
- [x] Add edit and delete functionality for expense entries
- [x] Update dashboard profit calculation to subtract expenses: Profit = Revenue - Total Expenses

### Phase 4: Staff Attendance
- [x] Create attendance page at src/app/(admin)/attendance/page.tsx with calendar month view
- [x] Add staff management section: list of staff members with ability to add new staff (name input) and deactivate existing staff
- [x] Implement calendar day cells that show color-coded attendance status for each staff member
- [x] Create daily attendance marking interface: tap a day to open dialog showing all staff with status toggles (present/absent/day off)
- [x] Add API routes for attendance CRUD operations at src/app/api/attendance/route.ts
- [x] Add monthly summary view showing total days worked per staff member for selected month

### Phase 5: Polish & Final Touches
- [x] Add loading states and skeleton loaders to all pages
- [x] Add error handling with toast notifications for all API operations
- [x] Ensure all touch targets are minimum 44px for mobile usability
- [x] Add empty states with helpful messages for all list views
- [x] Test complete order flow: place order → appears in kitchen → update status → mark served
- [x] Add favicon and app title "Mr Chef"
- [x] Create README.md with setup instructions, default login credentials, and feature overview
