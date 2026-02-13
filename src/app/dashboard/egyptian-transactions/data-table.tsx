"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Eye, FilterX, Calendar as CalendarIcon } from "lucide-react";
import type { EgyptianTransfer } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";

const statusColors: Record<EgyptianTransfer["status"], string> = {
  "ناجح": "bg-green-100 text-green-800",
  "مرفوض": "bg-red-100 text-red-800",
  "قيد التحويل": "bg-yellow-100 text-yellow-800",
};

export function EgyptianTransfersDataTable({ initialData }: { initialData: EgyptianTransfer[] }) {
  const [data, setData] = useState<EgyptianTransfer[]>(initialData);
  const [searchTerm, setSearchTerm] = useState("");
  const [transferTypeFilter, setTransferTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [date, setDate] = useState<Date | undefined>();

  const { toast } = useToast();
  
  const receiptPlaceholder = PlaceHolderImages.find(p => p.id === 'receipt-placeholder');

  const filteredData = useMemo(() => {
    return data.filter(
      (item) => {
        const itemDate = new Date(item.requestTimestamp);
        if (date) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            if (itemDate < startOfDay || itemDate > endOfDay) {
                return false;
            }
        }

        return (item.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.userPhone.includes(searchTerm) ||
          item.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.recipientNumber.includes(searchTerm)) &&
        (transferTypeFilter === "all" || item.transferType === transferTypeFilter) &&
        (statusFilter === "all" || item.status === statusFilter)
      }
    );
  }, [data, searchTerm, transferTypeFilter, statusFilter, date]);

  const handleClearFilters = () => {
    setSearchTerm("");
    setTransferTypeFilter("all");
    setStatusFilter("all");
    setDate(undefined);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="ابحث بالاسم أو الرقم..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm flex-grow"
        />
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant={"outline"}
              className={cn(
                "w-[260px] justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="ml-2 h-4 w-4" />
              {date ? format(date, "dd/MM/y") : <span>اختر يوماً</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="single"
              selected={date}
              onSelect={setDate}
            />
          </PopoverContent>
        </Popover>
        <Select value={transferTypeFilter} onValueChange={setTransferTypeFilter}>
          <SelectTrigger className="w-full sm:w-auto md:w-[180px]">
            <SelectValue placeholder="نوع التحويل" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الأنواع</SelectItem>
            <SelectItem value="محفظة كاش">محفظة كاش</SelectItem>
            <SelectItem value="انستاباي">انستاباي</SelectItem>
            <SelectItem value="وصلني البيت">وصلني البيت</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-auto md:w-[180px]">
            <SelectValue placeholder="حالة الطلب" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الحالات</SelectItem>
            <SelectItem value="ناجح">ناجح</SelectItem>
            <SelectItem value="مرفوض">مرفوض</SelectItem>
            <SelectItem value="قيد التحويل">قيد التحويل</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="ghost" onClick={handleClearFilters}>
          <FilterX className="ml-2 h-4 w-4" />
          مسح الفلاتر
        </Button>
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>رقم العملية</TableHead>
              <TableHead>اسم المستخدم</TableHead>
              <TableHead>نوع التحويل</TableHead>
              <TableHead>المبلغ</TableHead>
              <TableHead>اسم المستلم</TableHead>
              <TableHead>رقم المستلم</TableHead>
              <TableHead>المندوب</TableHead>
              <TableHead>حالة الطلب</TableHead>
              <TableHead>توقيت الطلب</TableHead>
              <TableHead>مدة التنفيذ</TableHead>
              <TableHead>الإيصال</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((transfer) => (
              <TableRow key={transfer.id} className={cn(transfer.status === 'قيد التحويل' && 'bg-yellow-50 dark:bg-yellow-500/10')}>
                <TableCell className="font-mono text-xs">{transfer.id}</TableCell>
                <TableCell>
                    <div className="font-medium">{transfer.userName}</div>
                    <div className="text-muted-foreground text-xs">{transfer.userPhone}</div>
                </TableCell>
                <TableCell>{transfer.transferType}</TableCell>
                <TableCell className="text-left">
                    <div className="font-semibold">{transfer.sentAmount.toLocaleString('en-US')} ج.م</div>
                    <div className="text-xs text-muted-foreground">الرسوم: {transfer.serviceFee.toLocaleString('en-US')} ج.م</div>
                    <div className="text-xs text-muted-foreground">الإجمالي: {transfer.totalDeducted.toLocaleString('en-US')} ج.م</div>
                </TableCell>
                <TableCell className="font-medium">{transfer.recipientName}</TableCell>
                <TableCell>{transfer.recipientNumber}</TableCell>
                <TableCell>{transfer.delegate}</TableCell>
                <TableCell>
                  <Badge className={cn(statusColors[transfer.status], `hover:${statusColors[transfer.status]}`)}>
                    {transfer.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs">{new Date(transfer.requestTimestamp).toLocaleString("ar-EG-u-nu-latn")}</TableCell>
                <TableCell>{transfer.executionDuration}</TableCell>
                <TableCell>
                  {transfer.receiptImageUrl && transfer.status === 'ناجح' && receiptPlaceholder ? (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>إيصال العملية {transfer.id}</DialogTitle>
                        </DialogHeader>
                        <Image
                          src={receiptPlaceholder.imageUrl}
                          alt={`إيصال ${transfer.id}`}
                          width={600}
                          height={800}
                          className="rounded-md"
                           data-ai-hint={receiptPlaceholder.imageHint}
                        />
                      </DialogContent>
                    </Dialog>
                  ) : (
                    "-"
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
