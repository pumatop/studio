"use client";

import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { mockDailyRates } from "@/lib/mock-daily-rates";

const chartConfig = {
  rate: {
    label: "السعر",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

export function ExchangeRateChartCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>أسعار الصرف لآخر 7 أيام</CardTitle>
        <CardDescription>زوج العملات: LYD/EGP</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <AreaChart
            data={mockDailyRates}
            margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
            accessibilityLayer
          >
            <CartesianGrid vertical={false} />
            <defs>
              <linearGradient id="fillRate" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-rate)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-rate)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) =>
                new Date(value).toLocaleDateString("ar-EG", { weekday: "short" })
              }
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            />
            <YAxis
              orientation="right"
              type="number"
              domain={["dataMin - 0.05", "dataMax + 0.05"]}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.toFixed(2)}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            />
            <Tooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Area
                dataKey="rate"
                type="natural"
                fill="url(#fillRate)"
                fillOpacity={0.4}
                stroke="var(--color-rate)"
                strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
