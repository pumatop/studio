"use client";

import { useMemo, useState, useEffect } from "react";
import { ExchangeControlCard } from "./exchange-control-card";
import { ExchangeRateChartCard } from "./exchange-rate-chart-card";
import { ChangeLogCard } from "./change-log-card";
import { useRtdbList } from "@/firebase";
import type { ExchangeRateLog, DailyRate } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { subDays, startOfDay, endOfDay } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ExchangeRatePage() {
  const { data: logs, isLoading } = useRtdbList<ExchangeRateLog>('/exchangeRateLogs');
  
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());

  const selectedDate = useMemo(() => {
    const d = new Date();
    d.setFullYear(new Date().getFullYear());
    d.setMonth(selectedMonth - 1);
    d.setDate(selectedDay);
    d.setHours(12, 0, 0, 0); // Avoid timezone shifts
    return d.toISOString();
  }, [selectedMonth, selectedDay]);

  const handleDateSelect = (dateStr: string) => {
    const d = new Date(dateStr);
    setSelectedMonth(d.getMonth() + 1);
    setSelectedDay(d.getDate());
  }

  const dailyRates = useMemo((): DailyRate[] => {
    if (!logs) {
      return [];
    }
    const sortedLogs = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    let lastKnownRate = 0;
    const rateBeforePeriod = sortedLogs.filter(l => new Date(l.date) < startOfDay(subDays(new Date(), 6)))
                                     .pop()?.newRate;

    if (rateBeforePeriod) {
        lastKnownRate = rateBeforePeriod;
    } else if (sortedLogs.length > 0) {
        lastKnownRate = sortedLogs[0].newRate;
    }

    const finalRates: DailyRate[] = [];
    for (let i = 6; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dayStart = startOfDay(date);
        const dayEnd = endOfDay(date);
        
        const lastLogOfDay = sortedLogs
            .filter(log => {
                const logDate = new Date(log.date);
                return logDate >= dayStart && logDate <= dayEnd;
            })
            .pop();

        if (lastLogOfDay) {
            lastKnownRate = lastLogOfDay.newRate;
        }
        
        finalRates.push({
            date: date.toISOString(),
            rate: lastKnownRate,
        });
    }
    
    if(finalRates.every(r => r.rate === 0)) return [];
    
    return finalRates;
  }, [logs]);

  const displayedLogs = useMemo(() => {
    if (!logs) return [];
    
    const selDate = new Date(selectedDate);
    const start = startOfDay(selDate);
    const end = endOfDay(selDate);

    return logs.filter(log => {
        const logDate = new Date(log.date);
        return logDate >= start && logDate <= end;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [logs, selectedDate]);

  const getMonthName = (month: number) => {
    const date = new Date();
    date.setMonth(month - 1);
    return date.toLocaleString('ar', { month: 'long' });
  };

  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const daysInMonth = new Date(new Date().getFullYear(), selectedMonth, 0).getDate();

  const MonthSelector = (
    <Select value={String(selectedMonth)} onValueChange={(val) => setSelectedMonth(Number(val))}>
        <SelectTrigger className="inline-flex h-7 w-auto border-none bg-[#E3F2FD] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-[#1B69FF] hover:bg-[#E3F2FD]/80 focus:ring-0 transition-all cursor-pointer">
            <SelectValue />
        </SelectTrigger>
        <SelectContent dir="rtl" className="rounded-2xl border-none shadow-2xl">
            {months.map((m) => (
                <SelectItem key={m} value={String(m)} className="rounded-xl font-bold text-xs">
                    {m === (new Date().getMonth() + 1) ? `هذا الشهر (${getMonthName(m)})` : getMonthName(m)}
                </SelectItem>
            ))}
        </SelectContent>
    </Select>
  );

  const DaySelector = (
    <Select value={String(selectedDay)} onValueChange={(val) => setSelectedDay(Number(val))}>
        <SelectTrigger className="inline-flex h-7 w-auto border-none bg-[#E3F2FD] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-[#1B69FF] hover:bg-[#E3F2FD]/80 focus:ring-0 transition-all cursor-pointer">
            <SelectValue />
        </SelectTrigger>
        <SelectContent dir="rtl" className="max-h-[250px] rounded-2xl border-none shadow-2xl">
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
                <SelectItem key={d} value={String(d)} className="rounded-xl font-bold text-xs">
                    {d === new Date().getDate() && selectedMonth === (new Date().getMonth() + 1) ? "اليوم" : `يوم ${d}`}
                </SelectItem>
            ))}
        </SelectContent>
    </Select>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      <div className="lg:col-span-1">
        <ExchangeControlCard />
      </div>
      <div className="lg:col-span-1 space-y-6">
        {isLoading ? (
          <Skeleton className="h-[380px] w-full rounded-2xl" />
        ) : (
          <ExchangeRateChartCard 
            data={dailyRates} 
            onDateSelect={handleDateSelect}
            selectedDate={selectedDate}
          />
        )}
        <ChangeLogCard 
            logs={displayedLogs}
            isLoading={isLoading}
            selectedDate={selectedDate}
            onClearSelection={() => {
                setSelectedMonth(new Date().getMonth() + 1);
                setSelectedDay(new Date().getDate());
            }}
            monthSelector={MonthSelector}
            daySelector={DaySelector}
        />
      </div>
    </div>
  );
}
