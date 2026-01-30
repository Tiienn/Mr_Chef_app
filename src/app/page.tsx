import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ChefHat,
  ShoppingCart,
  LayoutDashboard,
  Receipt,
  Users,
  Banknote,
} from 'lucide-react';

const navItems = [
  {
    title: 'Place Order',
    description: 'Browse menu and place customer orders',
    href: '/order',
    icon: ShoppingCart,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-500/10',
  },
  {
    title: 'Kitchen Display',
    description: 'View and manage incoming orders',
    href: '/kitchen',
    icon: ChefHat,
    color: 'text-orange-600',
    bgColor: 'bg-orange-500/10',
  },
  {
    title: 'Dashboard',
    description: 'Daily sales and order statistics',
    href: '/dashboard',
    icon: LayoutDashboard,
    color: 'text-blue-600',
    bgColor: 'bg-blue-500/10',
  },
  {
    title: 'Expenses',
    description: 'Track and manage business expenses',
    href: '/expenses',
    icon: Receipt,
    color: 'text-purple-600',
    bgColor: 'bg-purple-500/10',
  },
  {
    title: 'Attendance',
    description: 'Staff attendance tracking',
    href: '/attendance',
    icon: Users,
    color: 'text-slate-600',
    bgColor: 'bg-slate-500/10',
  },
  {
    title: 'Wages',
    description: 'Track staff wage payments',
    href: '/wages',
    icon: Banknote,
    color: 'text-green-600',
    bgColor: 'bg-green-500/10',
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-center px-4">
          <div className="flex items-center gap-2">
            <ChefHat className="h-8 w-8 text-orange-600" />
            <h1 className="text-2xl font-bold">Mr Chef</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8">
        <div className="mx-auto max-w-4xl space-y-8">
          {/* Welcome Section */}
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">
              Welcome to Mr Chef
            </h2>
            <p className="text-muted-foreground">
              Restaurant management made simple
            </p>
          </div>

          {/* Navigation Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <Card className="h-full transition-all hover:shadow-md hover:border-primary/50 cursor-pointer">
                    <CardHeader className="pb-3">
                      <div
                        className={`w-12 h-12 rounded-lg ${item.bgColor} flex items-center justify-center mb-2`}
                      >
                        <Icon className={`h-6 w-6 ${item.color}`} />
                      </div>
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                      <CardDescription>{item.description}</CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              );
            })}
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/order">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  New Order
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/kitchen">
                  <ChefHat className="mr-2 h-4 w-4" />
                  Open Kitchen
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  View Dashboard
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-4">
        <p className="text-center text-sm text-muted-foreground">
          Mr Chef Restaurant Management System
        </p>
      </footer>
    </div>
  );
}
