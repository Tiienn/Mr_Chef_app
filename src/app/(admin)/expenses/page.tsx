'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import {
  Receipt,
  Plus,
  Calendar as CalendarIcon,
  Filter,
  Trash2,
  ShoppingCart,
  Home,
  Users,
  Zap,
  MoreHorizontal,
  ChefHat,
} from 'lucide-react';
import type { DateRange } from 'react-day-picker';

interface Expense {
  id: number;
  category: 'ingredients' | 'rent' | 'wages' | 'utilities' | 'other';
  description: string;
  amount: number;
  date: string;
  createdAt: Date;
}

interface ExpensesData {
  expenses: Expense[];
  categoryTotals: Record<string, number>;
  grandTotal: number;
}

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'ingredients', label: 'Ingredients', icon: ShoppingCart },
  { value: 'rent', label: 'Rent', icon: Home },
  { value: 'wages', label: 'Wages', icon: Users },
  { value: 'utilities', label: 'Utilities', icon: Zap },
  { value: 'other', label: 'Other', icon: MoreHorizontal },
] as const;

const CATEGORY_COLORS: Record<string, string> = {
  ingredients: 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30',
  rent: 'bg-blue-500/20 text-blue-700 border-blue-500/30',
  wages: 'bg-purple-500/20 text-purple-700 border-purple-500/30',
  utilities: 'bg-amber-500/20 text-amber-700 border-amber-500/30',
  other: 'bg-gray-500/20 text-gray-700 border-gray-500/30',
};

function formatCurrency(cents: number): string {
  return `Rs ${(cents / 100).toFixed(0)}`;
}

function formatDate(dateString: string): string {
  return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getTodayDateString(): string {
  return toLocalDateString(new Date());
}

function getDefaultDateRange(): { startDate: string; endDate: string } {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  return {
    startDate: toLocalDateString(startOfMonth),
    endDate: getTodayDateString(),
  };
}

export default function ExpensesPage() {
  const [data, setData] = useState<ExpensesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [dateRange, setDateRange] = useState(getDefaultDateRange);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Add expense form
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({
    category: 'ingredients' as Expense['category'],
    description: '',
    amount: '',
    date: getTodayDateString(),
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Date range picker
  const [isDateDialogOpen, setIsDateDialogOpen] = useState(false);
  const [tempDateRange, setTempDateRange] = useState<DateRange | undefined>(() => ({
    from: new Date(dateRange.startDate + 'T00:00:00'),
    to: new Date(dateRange.endDate + 'T00:00:00'),
  }));

  const fetchExpenses = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.set('startDate', dateRange.startDate);
      params.set('endDate', dateRange.endDate);
      if (selectedCategory !== 'all') {
        params.set('category', selectedCategory);
      }

      const response = await fetch(`/api/expenses?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch expenses');
      }
      const expensesData = await response.json();
      setData(expensesData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [dateRange.startDate, dateRange.endDate, selectedCategory]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleAddExpense = async () => {
    if (!newExpense.description.trim() || !newExpense.amount) return;

    try {
      setIsSubmitting(true);
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: newExpense.category,
          description: newExpense.description.trim(),
          amount: Math.round(parseFloat(newExpense.amount) * 100),
          date: newExpense.date,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add expense');
      }

      setNewExpense({
        category: 'ingredients',
        description: '',
        amount: '',
        date: getTodayDateString(),
      });
      setIsAddDialogOpen(false);
      fetchExpenses();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id: number) => {
    try {
      const response = await fetch(`/api/expenses?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete expense');
      }

      fetchExpenses();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete expense');
    }
  };

  const handleApplyDateRange = () => {
    if (tempDateRange?.from) {
      setDateRange({
        startDate: toLocalDateString(tempDateRange.from),
        endDate: tempDateRange.to
          ? toLocalDateString(tempDateRange.to)
          : toLocalDateString(tempDateRange.from),
      });
    }
    setIsDateDialogOpen(false);
  };

  const getCategoryIcon = (category: string) => {
    const cat = CATEGORIES.find((c) => c.value === category);
    if (cat && 'icon' in cat) {
      const Icon = cat.icon;
      return <Icon className="h-4 w-4" />;
    }
    return null;
  };

  if (isLoading && !data) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center px-4">
            <Link href="/" className="flex items-center gap-2">
              <ChefHat className="h-6 w-6 text-orange-600" />
              <h1 className="text-lg font-semibold">Expenses</h1>
            </Link>
          </div>
        </header>
        <main className="flex-1 p-4">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-12 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <ChefHat className="h-6 w-6 text-orange-600" />
            <h1 className="text-lg font-semibold">Expenses</h1>
          </Link>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1">
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[90vw] sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Expense</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select
                    value={newExpense.category}
                    onValueChange={(value) =>
                      setNewExpense((prev) => ({
                        ...prev,
                        category: value as Expense['category'],
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.filter((c) => c.value !== 'all').map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Input
                    placeholder="Enter description..."
                    value={newExpense.description}
                    onChange={(e) =>
                      setNewExpense((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Amount (Rs)</label>
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    placeholder="0"
                    value={newExpense.amount}
                    onChange={(e) =>
                      setNewExpense((prev) => ({
                        ...prev,
                        amount: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date</label>
                  <Input
                    type="date"
                    value={newExpense.date}
                    onChange={(e) =>
                      setNewExpense((prev) => ({
                        ...prev,
                        date: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <DialogClose asChild>
                    <Button variant="outline" className="flex-1">
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button
                    className="flex-1"
                    onClick={handleAddExpense}
                    disabled={
                      isSubmitting ||
                      !newExpense.description.trim() ||
                      !newExpense.amount
                    }
                  >
                    {isSubmitting ? 'Adding...' : 'Add Expense'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="flex-1 p-4 space-y-4">
        {/* Filters Row */}
        <div className="flex gap-2">
          {/* Date Range Picker */}
          <Dialog open={isDateDialogOpen} onOpenChange={setIsDateDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="flex-1 justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                <span className="truncate text-sm">
                  {formatDate(dateRange.startDate)} - {formatDate(dateRange.endDate)}
                </span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-fit p-4">
              <DialogHeader>
                <DialogTitle>Select Date Range</DialogTitle>
              </DialogHeader>
              <div className="pt-2">
                <Calendar
                  mode="range"
                  selected={tempDateRange}
                  onSelect={setTempDateRange}
                  numberOfMonths={1}
                  disabled={{ after: new Date() }}
                />
                <div className="flex gap-2 mt-4">
                  <DialogClose asChild>
                    <Button variant="outline" className="flex-1">
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button className="flex-1" onClick={handleApplyDateRange}>
                    Apply
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Category Filter */}
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[140px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Category Totals */}
        {data && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Totals by Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(data.categoryTotals)
                  .filter(([, amount]) => amount > 0 || selectedCategory === 'all')
                  .map(([category, amount]) => (
                    <div
                      key={category}
                      className={cn(
                        'flex items-center justify-between p-2 rounded-lg border',
                        CATEGORY_COLORS[category]
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(category)}
                        <span className="text-sm font-medium capitalize">
                          {category}
                        </span>
                      </div>
                      <span className="text-sm font-semibold">
                        {formatCurrency(amount)}
                      </span>
                    </div>
                  ))}
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <span className="font-semibold">Grand Total</span>
                <span className="text-lg font-bold">
                  {formatCurrency(data.grandTotal)}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Expense List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Expenses ({data?.expenses.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.expenses && data.expenses.length > 0 ? (
              <ul className="space-y-2">
                {data.expenses.map((expense) => (
                  <li
                    key={expense.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant="outline"
                          className={cn('text-xs', CATEGORY_COLORS[expense.category])}
                        >
                          {expense.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(expense.date)}
                        </span>
                      </div>
                      <p className="text-sm font-medium truncate">
                        {expense.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <span className="font-semibold whitespace-nowrap">
                        {formatCurrency(expense.amount)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteExpense(expense.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No expenses found for the selected filters
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
