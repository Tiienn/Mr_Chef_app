'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  Users,
  Check,
  X,
  Coffee,
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

  const openDayDialog = (date: Date) => {
    setSelectedDate(date);
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
            <h1 className="text-lg font-semibold">Attendance</h1>
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
          <h1 className="text-lg font-semibold">Attendance</h1>
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
                const hasStaff = data?.staff && data.staff.length > 0;

                return (
                  <button
                    key={formatDateKey(date)}
                    onClick={() => hasStaff && openDayDialog(date)}
                    disabled={!hasStaff}
                    className={cn(
                      'aspect-square p-1 rounded-lg border transition-colors flex flex-col items-center justify-start',
                      isToday
                        ? 'border-primary bg-primary/5'
                        : 'border-transparent hover:border-muted-foreground/30 hover:bg-muted/50',
                      !hasStaff && 'cursor-default opacity-60'
                    )}
                  >
                    <span
                      className={cn(
                        'text-sm font-medium',
                        isToday && 'text-primary'
                      )}
                    >
                      {date.getDate()}
                    </span>

                    {/* Attendance dots */}
                    {attendanceRecords.length > 0 && (
                      <div className="flex flex-wrap gap-0.5 justify-center mt-0.5 max-w-full">
                        {data?.staff.map((staffMember) => {
                          const status = getStaffAttendanceStatus(
                            staffMember.id,
                            date
                          );
                          if (!status) return null;
                          return (
                            <span
                              key={staffMember.id}
                              className={cn(
                                'w-2 h-2 rounded-full flex-shrink-0',
                                STATUS_COLORS[status]
                              )}
                              title={`${staffMember.name}: ${STATUS_LABELS[status]}`}
                            />
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

        {/* No Staff Warning */}
        {data?.staff && data.staff.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                No active staff members found.
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Add staff members to start tracking attendance.
              </p>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Day Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-md">
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
