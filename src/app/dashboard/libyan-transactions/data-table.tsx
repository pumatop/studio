"use client";

import React, { useMemo, useState } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import type { DetailedLibyanTransaction } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusColors: Record<DetailedLibyanTransaction['status'], string> = {
  "ناجحة": "bg-green-100 text-green-800",
  "مرفوضة": "bg-red-100 text-red-800",
};


export function LibyanTransactionsDataTable({ initialData }: { initialData: DetailedLibyanTransaction[] }) {
  const [data, setData] = useState<DetailedLibyanTransaction[]>(initialData);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredData = useMemo(() => {
     if (!searchTerm) return data;
    return data.filter(
      (item) =>
        item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.senderPhone.includes(searchTerm) ||
        item.recipientPhone?.includes(searchTerm)
    );
  }, [data, searchTerm]);
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="ابحث برقم المعاملة أو رقم الهاتف..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>رقم المعاملة</TableHead>
              <TableHead>نوع العملية</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>وقت العملية</TableHead>
              <TableHead>رقم هاتف المرسل</TableHead>
              <TableHead>المبلغ المرسل</TableHead>
              <TableHead>رسوم الخدمة</TableHead>
              <TableHead>رقم هاتف المستلم</TableHead>
              <TableHead>المبلغ المستلم</TableHead>
              <TableHead>سعر الصرف</TableHead>
              <TableHead>المبلغ المحول بالجنيه</TableHead>
              <TableHead>نوع الكارت</TableHead>
              <TableHead>فئة الكارت</TableHead>
              <TableHead>سيريال الكارت</TableHead>
              <TableHead>الرقم السري للكارت</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell className="font-mono text-xs">{transaction.id}</TableCell>
                <TableCell>{transaction.operationType}</TableCell>
                <TableCell>
                  <Badge className={cn(statusColors[transaction.status], `hover:${statusColors[transaction.status]}`)}>{transaction.status}</Badge>
                </TableCell>
                <TableCell className="text-xs">{new Date(transaction.timestamp).toLocaleString("en-GB")}</TableCell>
                <TableCell className="font-medium">{transaction.senderPhone}</TableCell>
                <TableCell>{transaction.sentAmount.toLocaleString("en-US")} د.ل</TableCell>
                <TableCell>{transaction.serviceFee.toLocaleString("en-US")} د.ل</TableCell>
                <TableCell>{transaction.recipientPhone || "-"}</TableCell>
                <TableCell>{transaction.receivedAmount.toLocaleString("en-US")} {transaction.operationType === 'تحويل للجنيه' ? 'ج.م' : 'د.ل'}</TableCell>
                <TableCell>{transaction.exchangeRate || "-"}</TableCell>
                <TableCell>{transaction.convertedAmountEGP ? `${transaction.convertedAmountEGP.toLocaleString("en-US")} ج.م` : "-"}</TableCell>
                <TableCell>{transaction.cardType || "-"}</TableCell>
                <TableCell>{transaction.cardDenomination ? `${transaction.cardDenomination.toLocaleString("en-US")} د.ل` : "-"}</TableCell>
                <TableCell>{transaction.cardSerial || "-"}</TableCell>
                <TableCell>{transaction.cardPin || "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
