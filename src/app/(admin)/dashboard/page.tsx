'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  ShoppingBag,
  DollarSign,
  Clock,
  ChefHat,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';

interface DashboardData {
  date: string;
  totalOrders: number;
  totalRevenue: number;
  statusCounts: {
    pending: number;
    preparing: number;
    ready: number;
    served: number;
  };
  topItems: Array<{
    menuItemId: number;
    menuItemName: string;
    totalQuantity: number;
  }>;
}

function formatCurrency(cents: number): string {
  return `Rs ${(cents / 100).toFixed(0)}`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/dashboard');
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        const dashboardData = await response.json();
        setData(dashboardData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center px-4">
            <Link href="/" className="flex items-center gap-2">
              <ChefHat className="h-6 w-6 text-orange-600" />
              <h1 className="text-lg font-semibold">Dashboard</h1>
            </Link>
          </div>
        </header>
        <main className="flex-1 p-4">
          <div className="grid gap-4 grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-2">
                  <div className="h-4 w-24 bg-muted rounded" />
                </CardHeader>
                <CardContent>
                  <div className="h-8 w-16 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center px-4">
            <Link href="/" className="flex items-center gap-2">
              <ChefHat className="h-6 w-6 text-orange-600" />
              <h1 className="text-lg font-semibold">Dashboard</h1>
            </Link>
          </div>
        </header>
        <main className="flex-1 p-4">
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-center text-destructive">{error}</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const activeOrders =
    (data?.statusCounts.pending || 0) +
    (data?.statusCounts.preparing || 0) +
    (data?.statusCounts.ready || 0);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4">
          <Link href="/" className="flex items-center gap-2">
            <ChefHat className="h-6 w-6 text-orange-600" />
            <h1 className="text-lg font-semibold">Dashboard</h1>
          </Link>
        </div>
      </header>

      <main className="flex-1 p-4 space-y-4">
        {/* Date Display */}
        <p className="text-sm text-muted-foreground">
          {data?.date ? formatDate(data.date) : 'Today'}
        </p>

        {/* Main Stats Grid */}
        <div className="grid gap-4 grid-cols-2">
          {/* Total Orders Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Orders
              </CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.totalOrders || 0}</div>
            </CardContent>
          </Card>

          {/* Revenue Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(data?.totalRevenue || 0)}
              </div>
            </CardContent>
          </Card>

          {/* Active Orders Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Orders
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeOrders}</div>
            </CardContent>
          </Card>

          {/* Served Orders Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Served
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data?.statusCounts.served || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Status Breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ChefHat className="h-4 w-4" />
              Order Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant="secondary"
                className={cn(
                  'px-3 py-1',
                  (data?.statusCounts.pending || 0) > 0 && 'bg-yellow-500/20 text-yellow-700'
                )}
              >
                <span className="mr-1.5 h-2 w-2 rounded-full bg-yellow-500 inline-block" />
                Pending: {data?.statusCounts.pending || 0}
              </Badge>
              <Badge
                variant="secondary"
                className={cn(
                  'px-3 py-1',
                  (data?.statusCounts.preparing || 0) > 0 && 'bg-blue-500/20 text-blue-700'
                )}
              >
                <span className="mr-1.5 h-2 w-2 rounded-full bg-blue-500 inline-block" />
                Preparing: {data?.statusCounts.preparing || 0}
              </Badge>
              <Badge
                variant="secondary"
                className={cn(
                  'px-3 py-1',
                  (data?.statusCounts.ready || 0) > 0 && 'bg-green-500/20 text-green-700'
                )}
              >
                <span className="mr-1.5 h-2 w-2 rounded-full bg-green-500 inline-block" />
                Ready: {data?.statusCounts.ready || 0}
              </Badge>
              <Badge variant="secondary" className="px-3 py-1">
                <span className="mr-1.5 h-2 w-2 rounded-full bg-gray-500 inline-block" />
                Served: {data?.statusCounts.served || 0}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Top Selling Items */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Top Selling Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.topItems && data.topItems.length > 0 ? (
              <ul className="space-y-2">
                {data.topItems.map((item, index) => (
                  <li
                    key={item.menuItemId}
                    className="flex items-center justify-between py-1"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          'flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium',
                          index === 0 && 'bg-yellow-500/20 text-yellow-700',
                          index === 1 && 'bg-gray-300/50 text-gray-700',
                          index === 2 && 'bg-orange-500/20 text-orange-700',
                          index > 2 && 'bg-muted text-muted-foreground'
                        )}
                      >
                        {index + 1}
                      </span>
                      <span className="text-sm">{item.menuItemName}</span>
                    </div>
                    <Badge variant="outline">{item.totalQuantity} sold</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No orders yet today
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
