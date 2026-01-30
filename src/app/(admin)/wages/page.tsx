'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  Banknote,
  Plus,
  Calendar as CalendarIcon,
  Trash2,
  ChefHat,
  Users,
} from 'lucide-react';
import type { DateRange } from 'react-day-picker';

interface StaffMember {
  id: number;
  name: string;
}

interface WageEntry {
  id: number;
  staffId: number;
  staffName: string;
  amount: number;
  date: string;
  note: string | null;
  createdAt: Date;
}

interface WagesData {
  wages: WageEntry[];
  staffTotals: Record<string, { name: string; total: number }>;
  grandTotal: number;
}

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

export default function WagesPage() {
  const [data, setData] = useState<WagesData | null>(null);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [dateRange, setDateRange] = useState(getDefaultDateRange);

  // Add wage form
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newWage, setNewWage] = useState({
    staffId: '',
    amount: '',
    date: getTodayDateString(),
    note: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Date range picker
  const [isDateDialogOpen, setIsDateDialogOpen] = useState(false);
  const [tempDateRange, setTempDateRange] = useState<DateRange | undefined>(() => ({
    from: new Date(dateRange.startDate + 'T00:00:00'),
    to: new Date(dateRange.endDate + 'T00:00:00'),
  }));

  // Fetch staff list
  useEffect(() => {
    async function fetchStaff() {
      try {
        const response = await fetch('/api/staff');
        if (response.ok) {
          const data = await response.json();
          setStaffList(data);
        }
      } catch {
        // Staff fetch is non-critical, wages will still load
      }
    }
    fetchStaff();
  }, []);

  const fetchWages = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.set('startDate', dateRange.startDate);
      params.set('endDate', dateRange.endDate);

      const response = await fetch(`/api/wages?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch wages');
      }
      const wagesData = await response.json();
      setData(wagesData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [dateRange.startDate, dateRange.endDate]);

  useEffect(() => {
    fetchWages();
  }, [fetchWages]);

  const handleAddWage = async () => {
    if (!newWage.staffId || !newWage.amount) return;

    try {
      setIsSubmitting(true);
      const response = await fetch('/api/wages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId: parseInt(newWage.staffId, 10),
          amount: Math.round(parseFloat(newWage.amount) * 100),
          date: newWage.date,
          note: newWage.note.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add wage payment');
      }

      setNewWage({
        staffId: '',
        amount: '',
        date: getTodayDateString(),
        note: '',
      });
      setIsAddDialogOpen(false);
      fetchWages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add wage payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteWage = async (id: number) => {
    try {
      const response = await fetch(`/api/wages?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete wage entry');
      }

      fetchWages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete wage entry');
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

  if (isLoading && !data) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center px-4">
            <Link href="/" className="flex items-center gap-2">
              <ChefHat className="h-6 w-6 text-orange-600" />
              <h1 className="text-lg font-semibold">Wages</h1>
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
            <h1 className="text-lg font-semibold">Wages</h1>
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
                <DialogTitle>Add Wage Payment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Staff Member</label>
                  <Select
                    value={newWage.staffId}
                    onValueChange={(value) =>
                      setNewWage((prev) => ({ ...prev, staffId: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select staff member" />
                    </SelectTrigger>
                    <SelectContent>
                      {staffList.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Amount (Rs)</label>
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    placeholder="0"
                    value={newWage.amount}
                    onChange={(e) =>
                      setNewWage((prev) => ({ ...prev, amount: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date</label>
                  <Input
                    type="date"
                    value={newWage.date}
                    onChange={(e) =>
                      setNewWage((prev) => ({ ...prev, date: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Note (optional)</label>
                  <Input
                    placeholder="e.g. Weekly payment, Advance..."
                    value={newWage.note}
                    onChange={(e) =>
                      setNewWage((prev) => ({ ...prev, note: e.target.value }))
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
                    onClick={handleAddWage}
                    disabled={isSubmitting || !newWage.staffId || !newWage.amount}
                  >
                    {isSubmitting ? 'Adding...' : 'Add Payment'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="flex-1 p-4 space-y-4">
        {/* Date Range Filter */}
        <div className="flex gap-2">
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
        </div>

        {/* Error Display */}
        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Staff Totals */}
        {data && Object.keys(data.staffTotals).length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                Totals by Staff
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(data.staffTotals).map(([staffId, info]) => (
                  <div
                    key={staffId}
                    className="flex items-center justify-between p-2 rounded-lg border bg-green-500/10 border-green-500/30"
                  >
                    <span className="text-sm font-medium text-green-700">
                      {info.name}
                    </span>
                    <span className="text-sm font-semibold text-green-700">
                      {formatCurrency(info.total)}
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

        {/* Wage Payments List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Banknote className="h-4 w-4" />
              Payments ({data?.wages.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.wages && data.wages.length > 0 ? (
              <ul className="space-y-2">
                {data.wages.map((wage) => (
                  <li
                    key={wage.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold">
                          {wage.staffName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(wage.date)}
                        </span>
                      </div>
                      {wage.note && (
                        <p className="text-xs text-muted-foreground truncate">
                          {wage.note}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <span className="font-semibold whitespace-nowrap">
                        {formatCurrency(wage.amount)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteWage(wage.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No wage payments found for the selected date range
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
