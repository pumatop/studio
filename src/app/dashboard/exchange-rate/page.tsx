"use client";

import { useMemo } from "react";
import { ExchangeControlCard } from "./exchange-control-card";
import { ExchangeRateChartCard } from "./exchange-rate-chart-card";
import { ChangeLogCard } from "./change-log-card";
import { useRtdbList } from "@/firebase/rtdb/use-rtdb-list";
import type { ExchangeRateLog, DailyRate } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

export default function ExchangeRatePage() {
  const { data: logs, isLoading } = useRtdbList<ExchangeRateLog>('/exchangeRateLogs');

  const dailyRates = useMemo((): DailyRate[] => {
    if (!logs) {
      return [];
    }

    // Sort logs by date descending to get the most recent ones
    const sortedLogs = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Take the last 7 entries for the chart
    const latestLogs = sortedLogs.slice(0, 7);

    // Map to the format expected by the chart and reverse to show in chronological order
    const chartData = latestLogs.map(log => ({
      date: log.date,
      rate: log.newRate,
    })).reverse();

    return chartData;
  }, [logs]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      <div className="lg:col-span-1">
        <ExchangeControlCard />
      </div>
      <div className="lg:col-span-1 space-y-6">
        {isLoading ? (
          <Skeleton className="h-[380px] w-full" />
        ) : (
          <ExchangeRateChartCard data={dailyRates} />
        )}
        <ChangeLogCard />
      </div>
    </div>
  );
}
