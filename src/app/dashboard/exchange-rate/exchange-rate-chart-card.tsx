"use client";

import { Bar, BarChart, CartesianGrid, LabelList, Tooltip, XAxis, YAxis } from "recharts";
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
          <BarChart
            data={mockDailyRates}
            margin={{ top: 30, right: 10, left: -10, bottom: 0 }}
            accessibilityLayer
          >
            <CartesianGrid vertical={false} />
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
              domain={["dataMin - 0.1", "dataMax + 0.1"]}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.toFixed(2)}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            />
            <Tooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" formatter={(value, name, props) => {
                const { payload } = props;
                return (
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">{new Date(payload.date).toLocaleDateString("ar-EG-u-nu-latn", { year: 'numeric', month: 'long', day: 'numeric'})}</span>
                    <span className="font-bold">{`${chartConfig.rate.label}: ${value}`}</span>
                  </div>
                )
              }} />}
            />
            <Bar
                dataKey="rate"
                fill="var(--color-rate)"
                radius={[4, 4, 0, 0]}
            >
                <LabelList 
                    dataKey="rate" 
                    position="top" 
                    formatter={(value: number) => value.toFixed(2)} 
                    className="fill-foreground"
                    fontSize={12}
                />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
