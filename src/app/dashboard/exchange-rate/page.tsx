"use client";

import { useMemo, useState } from "react";
import { ExchangeControlCard } from "./exchange-control-card";
import { ExchangeRateChartCard } from "./exchange-rate-chart-card";
import { ChangeLogCard } from "./change-log-card";
import { useRtdbList } from "@/firebase";
import type { ExchangeRateLog, DailyRate } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { subDays, startOfDay, endOfDay } from 'date-fns';

export default function ExchangeRatePage() {
  const { data: logs, isLoading } = useRtdbList<ExchangeRateLog>('/exchangeRateLogs');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

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
    if (selectedDate) {
      return logs.filter(log => {
        const logDate = new Date(log.date);
        const selDate = new Date(selectedDate);
        return logDate >= startOfDay(selDate) && logDate <= endOfDay(selDate);
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    return [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);
  }, [logs, selectedDate]);
  
  const handleDateSelect = (date: string | null) => {
    setSelectedDate(prev => prev === date ? null : date);
  }

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
            onClearSelection={() => setSelectedDate(null)}
        />
      </div>
    </div>
  );
}
