"use client";

import { Bar, BarChart, CartesianGrid, LabelList, Tooltip, XAxis, YAxis, Cell } from "recharts";
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
import type { DailyRate } from "@/lib/types";

const chartConfig = {
  rate: {
    label: "السعر",
  },
} satisfies ChartConfig;

const colors = {
    increase: "hsl(142.1 76.2% 36.3%)", // green-600
    decrease: "hsl(0 72.2% 50.6%)",  // red-600
    equal: "hsl(215.4 9.3% 62.2%)",   // stone-500
};

export function ExchangeRateChartCard({ data }: { data: DailyRate[] }) {
  const getColorForRate = (index: number) => {
    if (index === 0) {
      return colors.equal; // Default color for the first bar
    }
    const currentRate = data[index].rate;
    const previousRate = data[index - 1].rate;
    if (currentRate > previousRate) {
      return colors.increase;
    }
    if (currentRate < previousRate) {
      return colors.decrease;
    }
    return colors.equal;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>أسعار الصرف لآخر 7 أيام</CardTitle>
        <CardDescription>زوج العملات: LYD/EGP</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart
            data={data}
            margin={{ top: 30, right: 20, left: -10, bottom: 0 }}
            accessibilityLayer
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) =>
                new Date(value).toLocaleDateString("ar-EG-u-nu-latn", { weekday: "short" })
              }
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            />
            <YAxis
              orientation="right"
              type="number"
              domain={["dataMin - 0.1", "dataMax + 0.1"]}
              tickLine={false}
              axisLine={false}
              tickMargin={20}
              tickFormatter={(value) => value.toFixed(2)}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            />
            <Tooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" formatter={(value, name, props) => {
                const { payload } = props;
                return (
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">{new Date(payload.date).toLocaleDateString("ar-EG-u-nu-latn", { year: 'numeric', month: '2-digit', day: '2-digit'})}</span>
                    <span className="font-bold">{`${chartConfig.rate.label}: ${value}`}</span>
                  </div>
                )
              }} />}
            />
            <Bar
                dataKey="rate"
                radius={[4, 4, 0, 0]}
            >
                {data.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={getColorForRate(index)} />
                ))}
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
