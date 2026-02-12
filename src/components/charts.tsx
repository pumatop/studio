"use client";

import { Area, AreaChart, Bar, BarChart, Line, LineChart, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import {
  ChartContainer,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Transaction } from "@/lib/types";
import { useMemo } from "react";

// Sales Over Time Chart
export function SalesChart({ data, title, currency }: { data: Transaction[], title: string, currency: string }) {
  const chartData = useMemo(() => {
    const dailySales: { [key: string]: number } = {};
    data.forEach((t) => {
      dailySales[t.date] = (dailySales[t.date] || 0) + t.amount;
    });
    return Object.entries(dailySales)
      .map(([date, sales]) => ({ date, sales }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [data]);

  const chartConfig = {
    sales: {
      label: "المبيعات",
      color: "hsl(var(--primary))",
    },
  } satisfies ChartConfig;

  return (
     <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <AreaChart
            data={chartData}
            margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
            accessibilityLayer
          >
             <defs>
              <linearGradient id="fillSales" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-sales)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-sales)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} angle={-45} textAnchor="end" height={60} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `${currency} ${Math.floor(value / 1000)}k`} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
            <Tooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Area
              dataKey="sales"
              type="natural"
              fill="url(#fillSales)"
              stroke="var(--color-sales)"
              strokeWidth={2}
              dot={false}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// Transactions by Category Chart
export function CategoryChart({ data, title }: { data: Transaction[], title: string }) {
   const chartData = useMemo(() => {
    const categoryCounts: { [key: string]: number } = {};
    data.forEach((t) => {
      categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
    });
    return Object.entries(categoryCounts).map(([category, count]) => ({
      category,
      count,
    }));
  }, [data]);

  const chartConfig = {
    count: {
      label: "المعاملات",
      color: "hsl(var(--primary))",
    },
  } satisfies ChartConfig;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <BarChart data={chartData} accessibilityLayer layout="vertical" margin={{left: 10}}>
            <YAxis
              dataKey="category"
              type="category"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            />
             <XAxis type="number" hide />
            <Tooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Bar dataKey="count" fill="var(--color-count)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
