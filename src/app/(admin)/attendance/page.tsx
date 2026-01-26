'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  Users,
  Check,
  X,
  Coffee,
  ChefHat,
  Plus,
  Trash2,
} from 'lucide-react';

interface Staff {
  id: number;
  name: string;
  active: boolean;
  createdAt: Date;
}

interface AttendanceRecord {
  id: number;
  staffId: number;
  date: string;
  status: 'present' | 'absent' | 'day_off';
  createdAt: Date;
}

interface AttendanceData {
  staff: Staff[];
  attendance: AttendanceRecord[];
}

const STATUS_COLORS = {
  present: 'bg-emerald-500',
  absent: 'bg-red-500',
  day_off: 'bg-slate-400',
};

const STATUS_LABELS = {
  present: 'Present',
  absent: 'Absent',
  day_off: 'Day Off',
};

const STATUS_ICONS = {
  present: Check,
  absent: X,
  day_off: Coffee,
};

function getMonthDays(year: number, month: number): Date[] {
  const days: Date[] = [];
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
}

function getMonthStartOffset(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function formatDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

function formatMonthYear(year: number, month: number): string {
  return new Date(year, month).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

export default function AttendancePage() {
  const [data, setData] = useState<AttendanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Current month state
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());

  // Day dialog state
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add staff state
  const [newStaffName, setNewStaffName] = useState('');
  const [isAddingStaff, setIsAddingStaff] = useState(false);

  const fetchAttendance = useCallback(async () => {
    try {
      setIsLoading(true);
      const startDate = formatDateKey(new Date(currentYear, currentMonth, 1));
      const endDate = formatDateKey(new Date(currentYear, currentMonth + 1, 0));

      const response = await fetch(
        `/api/attendance?startDate=${startDate}&endDate=${endDate}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch attendance');
      }
      const attendanceData = await response.json();
      setData(attendanceData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [currentYear, currentMonth]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
  };

  const getAttendanceForDate = (date: Date): AttendanceRecord[] => {
    if (!data) return [];
    const dateKey = formatDateKey(date);
    return data.attendance.filter((a) => a.date === dateKey);
  };

  const getStaffAttendanceStatus = (
    staffId: number,
    date: Date
  ): 'present' | 'absent' | 'day_off' | null => {
    const dateKey = formatDateKey(date);
    const record = data?.attendance.find(
      (a) => a.staffId === staffId && a.date === dateKey
    );
    return record?.status || null;
  };

  const handleSetAttendance = async (
    staffId: number,
    status: 'present' | 'absent' | 'day_off'
  ) => {
    if (!selectedDate) return;

    try {
      setIsSubmitting(true);
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId,
          date: formatDateKey(selectedDate),
          status,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to set attendance');
      }

      fetchAttendance();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set attendance');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearAttendance = async (staffId: number) => {
    if (!selectedDate) return;

    try {
      setIsSubmitting(true);
      const response = await fetch(
        `/api/attendance?staffId=${staffId}&date=${formatDateKey(selectedDate)}`,
        { method: 'DELETE' }
      );

      if (!response.ok && response.status !== 404) {
        throw new Error('Failed to clear attendance');
      }

      fetchAttendance();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to clear attendance'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddStaff = async (status: 'present' | 'absent' | 'day_off') => {
    if (!newStaffName.trim() || !selectedDate) return;

    try {
      setIsAddingStaff(true);
      // Create new staff member
      const staffResponse = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newStaffName.trim() }),
      });

      if (!staffResponse.ok) {
        throw new Error('Failed to add staff member');
      }

      const newStaff = await staffResponse.json();

      // Set attendance for the new staff member
      const attendanceResponse = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId: newStaff.id,
          date: formatDateKey(selectedDate),
          status,
        }),
      });

      if (!attendanceResponse.ok) {
        throw new Error('Failed to set attendance');
      }

      setNewStaffName('');
      fetchAttendance();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add staff');
    } finally {
      setIsAddingStaff(false);
    }
  };

  const handleDeleteStaff = async (staffId: number) => {
    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/staff?id=${staffId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove staff member');
      }

      fetchAttendance();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove staff');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDayDialog = (date: Date) => {
    setSelectedDate(date);
    setNewStaffName('');
    setIsDialogOpen(true);
  };

  const monthDays = getMonthDays(currentYear, currentMonth);
  const startOffset = getMonthStartOffset(currentYear, currentMonth);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (isLoading && !data) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center px-4">
            <Link href="/" className="flex items-center gap-2">
              <ChefHat className="h-6 w-6 text-orange-600" />
              <h1 className="text-lg font-semibold">Attendance</h1>
            </Link>
          </div>
        </header>
        <main className="flex-1 p-4">
          <Card className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-64 bg-muted rounded" />
            </CardContent>
          </Card>
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
            <h1 className="text-lg font-semibold">Attendance</h1>
          </Link>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
        </div>
      </header>

      <main className="flex-1 p-4 space-y-4">
        {/* Error Display */}
        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-muted-foreground">Present</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-muted-foreground">Absent</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-slate-400" />
            <span className="text-muted-foreground">Day Off</span>
          </div>
        </div>

        {/* Calendar Card */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <CardTitle className="text-base">
                {formatMonthYear(currentYear, currentMonth)}
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={goToNextMonth}>
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-2 pb-3">
            {/* Week day headers */}
            <div className="grid grid-cols-7 mb-1">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-medium text-muted-foreground py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for start offset */}
              {Array.from({ length: startOffset }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}

              {/* Day cells */}
              {monthDays.map((date) => {
                const isToday = formatDateKey(date) === formatDateKey(today);
                const attendanceRecords = getAttendanceForDate(date);

                return (
                  <button
                    key={formatDateKey(date)}
                    onClick={() => openDayDialog(date)}
                    className={cn(
                      'min-h-[80px] p-1 rounded-lg border transition-colors flex flex-col items-start justify-start cursor-pointer',
                      isToday
                        ? 'border-primary bg-primary/5'
                        : 'border-transparent hover:border-muted-foreground/30 hover:bg-muted/50'
                    )}
                  >
                    <span
                      className={cn(
                        'text-sm font-medium w-full text-center',
                        isToday && 'text-primary'
                      )}
                    >
                      {date.getDate()}
                    </span>

                    {/* Staff names with status */}
                    {attendanceRecords.length > 0 && (
                      <div className="flex flex-col gap-0.5 mt-1 w-full overflow-hidden">
                        {data?.staff.map((staffMember) => {
                          const status = getStaffAttendanceStatus(
                            staffMember.id,
                            date
                          );
                          if (!status) return null;
                          return (
                            <div
                              key={staffMember.id}
                              className={cn(
                                'text-[10px] px-1 py-0.5 rounded truncate',
                                status === 'present' && 'bg-emerald-500/20 text-emerald-700',
                                status === 'absent' && 'bg-red-500/20 text-red-700',
                                status === 'day_off' && 'bg-slate-400/20 text-slate-600'
                              )}
                              title={`${staffMember.name}: ${STATUS_LABELS[status]}`}
                            >
                              {staffMember.name}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Staff Summary */}
        {data?.staff && data.staff.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                Staff Members ({data.staff.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.staff.map((staffMember) => {
                  const staffAttendance = data.attendance.filter(
                    (a) => a.staffId === staffMember.id
                  );
                  const presentDays = staffAttendance.filter(
                    (a) => a.status === 'present'
                  ).length;
                  const absentDays = staffAttendance.filter(
                    (a) => a.status === 'absent'
                  ).length;
                  const dayOffDays = staffAttendance.filter(
                    (a) => a.status === 'day_off'
                  ).length;

                  return (
                    <div
                      key={staffMember.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border"
                    >
                      <span className="font-medium">{staffMember.name}</span>
                      <div className="flex gap-2 text-sm">
                        <Badge
                          variant="outline"
                          className="bg-emerald-500/20 text-emerald-700 border-emerald-500/30"
                        >
                          {presentDays}P
                        </Badge>
                        <Badge
                          variant="outline"
                          className="bg-red-500/20 text-red-700 border-red-500/30"
                        >
                          {absentDays}A
                        </Badge>
                        <Badge
                          variant="outline"
                          className="bg-slate-500/20 text-slate-700 border-slate-500/30"
                        >
                          {dayOffDays}O
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Staff Info */}
        {data?.staff && data.staff.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                No staff members yet.
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Click on any date to add staff and mark their attendance.
              </p>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Day Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedDate?.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            {/* Add New Staff Section */}
            <div className="p-3 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5">
              <div className="flex items-center gap-2 mb-2">
                <Plus className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">Add New Staff</span>
              </div>
              <Input
                placeholder="Enter staff name..."
                value={newStaffName}
                onChange={(e) => setNewStaffName(e.target.value)}
                className="mb-2"
              />
              <div className="flex gap-2">
                {(['present', 'absent', 'day_off'] as const).map((status) => {
                  const Icon = STATUS_ICONS[status];
                  return (
                    <Button
                      key={status}
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1"
                      disabled={isAddingStaff || !newStaffName.trim()}
                      onClick={() => handleAddStaff(status)}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">
                        {STATUS_LABELS[status]}
                      </span>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Existing Staff List */}
            {data?.staff && data.staff.length > 0 && (
              <div className="border-t pt-3 mt-3">
                <span className="text-sm text-muted-foreground mb-2 block">Existing Staff</span>
              </div>
            )}
            {data?.staff.map((staffMember) => {
              const currentStatus = selectedDate
                ? getStaffAttendanceStatus(staffMember.id, selectedDate)
                : null;

              return (
                <div
                  key={staffMember.id}
                  className="p-3 rounded-lg border bg-muted/30"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{staffMember.name}</span>
                    <div className="flex items-center gap-2">
                      {currentStatus && (
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-xs',
                            currentStatus === 'present' &&
                              'bg-emerald-500/20 text-emerald-700 border-emerald-500/30',
                            currentStatus === 'absent' &&
                              'bg-red-500/20 text-red-700 border-red-500/30',
                            currentStatus === 'day_off' &&
                              'bg-slate-500/20 text-slate-700 border-slate-500/30'
                          )}
                        >
                          {STATUS_LABELS[currentStatus]}
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteStaff(staffMember.id)}
                        disabled={isSubmitting}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {(
                      ['present', 'absent', 'day_off'] as const
                    ).map((status) => {
                      const Icon = STATUS_ICONS[status];
                      const isActive = currentStatus === status;
                      return (
                        <Button
                          key={status}
                          variant={isActive ? 'default' : 'outline'}
                          size="sm"
                          className={cn(
                            'flex-1 gap-1',
                            isActive &&
                              status === 'present' &&
                              'bg-emerald-600 hover:bg-emerald-700',
                            isActive &&
                              status === 'absent' &&
                              'bg-red-600 hover:bg-red-700',
                            isActive &&
                              status === 'day_off' &&
                              'bg-slate-500 hover:bg-slate-600'
                          )}
                          disabled={isSubmitting}
                          onClick={() =>
                            isActive
                              ? handleClearAttendance(staffMember.id)
                              : handleSetAttendance(staffMember.id, status)
                          }
                        >
                          <Icon className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">
                            {STATUS_LABELS[status]}
                          </span>
                        </Button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
