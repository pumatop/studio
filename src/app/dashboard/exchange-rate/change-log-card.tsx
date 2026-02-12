"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { ExchangeRateLog } from "@/lib/types";
import { mockExchangeRateLogs } from "@/lib/mock-exchange-rate-log";
import { ArrowDown, ArrowUp } from "lucide-react";

export function ChangeLogCard() {
  const logs = mockExchangeRateLogs;

  const getDifference = (oldRate: number, newRate: number) => {
    return newRate - oldRate;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>سجل التغيرات</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>التاريخ</TableHead>
              <TableHead>المُعدِّل</TableHead>
              <TableHead>السعر القديم</TableHead>
              <TableHead>السعر الجديد</TableHead>
              <TableHead>الفارق</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => {
              const difference = getDifference(log.oldRate, log.newRate);
              const isIncrease = difference > 0;
              return (
                <TableRow key={log.id}>
                  <TableCell>
                    {new Date(log.date).toLocaleString("ar-EG", {
                      day: "numeric",
                      month: "short",
                      hour: "numeric",
                      minute: "numeric",
                    })}
                  </TableCell>
                  <TableCell>{log.modifiedBy}</TableCell>
                  <TableCell>{log.oldRate.toFixed(4)}</TableCell>
                  <TableCell className="font-medium">{log.newRate.toFixed(4)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={isIncrease ? "default" : "destructive"}
                      className={`flex items-center gap-1 w-fit ${
                        isIncrease
                          ? "bg-green-100 text-green-800 hover:bg-green-200"
                          : "bg-red-100 text-red-800 hover:bg-red-200"
                      }`}
                    >
                      {isIncrease ? (
                        <ArrowUp className="h-3 w-3" />
                      ) : (
                        <ArrowDown className="h-3 w-3" />
                      )}
                      <span>{difference.toFixed(4)}</span>
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
