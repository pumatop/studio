"use client";

import { Bar, BarChart, Line, LineChart, XAxis, YAxis, Tooltip } from "recharts";
import {
  ChartContainer,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Transaction } from "@/lib/types";
import { useMemo } from "react";

// Sales Over Time Chart
export function SalesChart({ data }: { data: Transaction[] }) {
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
        <CardTitle>الإيرادات على مدار الوقت</CardTitle>
        <CardDescription>
          عرض إجمالي الإيرادات اليومية للشهر الحالي.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
            accessibilityLayer
          >
            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} angle={-45} textAnchor="end" height={60} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `$${value}`} />
            <Tooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Line
              dataKey="sales"
              type="monotone"
              stroke="var(--color-sales)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// Transactions by Category Chart
export function CategoryChart({ data }: { data: Transaction[] }) {
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
      color: "hsl(var(--accent))",
    },
  } satisfies ChartConfig;

  return (
    <Card>
      <CardHeader>
        <CardTitle>المعاملات حسب الفئة</CardTitle>
        <CardDescription>
          توزيع المعاملات عبر فئات المنتجات المختلفة.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <BarChart data={chartData} accessibilityLayer>
            <XAxis
              dataKey="category"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
             <YAxis />
            <Tooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Bar dataKey="count" fill="var(--color-count)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
