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
import { Eye, FilterX, Calendar as CalendarIcon, FileDown, Printer, CircleDollarSign } from "lucide-react";
import type { EgyptTransferTransaction } from "@/lib/types";
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
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { arEG } from "date-fns/locale";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const statusColors: Record<EgyptTransferTransaction["status"], string> = {
  "completed": "bg-green-100 text-green-800",
  "failed": "bg-red-100 text-red-800",
  "pending": "bg-yellow-100 text-yellow-800",
};
const statusMap: Record<EgyptTransferTransaction["status"], string> = {
    "completed": "ناجح",
    "failed": "مرفوض",
    "pending": "قيد التحويل",
};


export function EgyptianTransfersDataTable({ initialData }: { initialData: EgyptTransferTransaction[] }) {
  const [data, setData] = useState<EgyptTransferTransaction[]>(initialData);
  const [searchTerm, setSearchTerm] = useState("");
  const [transferTypeFilter, setTransferTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | EgyptTransferTransaction['status']>("all");
  const [date, setDate] = useState<Date | undefined>();

  const { toast } = useToast();

  const filteredData = useMemo(() => {
    return data.filter(
      (item) => {
        const itemDate = new Date(item.timestamp);
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

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
      console.log(`Exporting data to ${format}...`);
      // Placeholder for actual export logic
  };

  const handlePrint = () => {
      console.log('Printing data...');
      // Placeholder for actual print logic
      window.print();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2 flex-grow">
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
                    "w-full sm:w-[200px] justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="ml-2 h-4 w-4" />
                  {date ? format(date, "dd/MM/y", { locale: arEG }) : <span>اختر يوماً</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  locale={arEG}
                  formatters={{ formatDay: (day) => new Intl.NumberFormat('en-US').format(day.getDate()) }}
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
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger className="w-full sm:w-auto md:w-[180px]">
                <SelectValue placeholder="حالة الطلب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحالات</SelectItem>
                <SelectItem value="completed">ناجح</SelectItem>
                <SelectItem value="failed">مرفوض</SelectItem>
                <SelectItem value="pending">قيد التحويل</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" onClick={handleClearFilters}>
              <FilterX className="ml-2 h-4 w-4" />
              مسح
            </Button>
          </div>
          <div className="flex items-center gap-2 self-end">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                        <FileDown className="ml-2 h-4 w-4" />
                        تصدير
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleExport('csv')}>CSV</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('excel')}>Excel</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('pdf')}>PDF</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" onClick={handlePrint}>
                <Printer className="ml-2 h-4 w-4" />
                طباعة
            </Button>
        </div>
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>رقم العملية</TableHead>
              <TableHead>اسم المستخدم</TableHead>
              <TableHead>نوع التحويل</TableHead>
              <TableHead>المبلغ (د.ل)</TableHead>
              <TableHead>المبلغ (ج.م)</TableHead>
              <TableHead>حالة الطلب</TableHead>
              <TableHead>توقيت الطلب</TableHead>
              <TableHead>الإيصال</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((transfer) => (
              <TableRow key={transfer.id} className={cn(transfer.status === 'pending' && 'bg-yellow-50 dark:bg-yellow-500/10')}>
                <TableCell className="text-xs">{transfer.id}</TableCell>
                <TableCell>
                    <div className="font-medium">{transfer.userName}</div>
                    <div className="text-muted-foreground text-xs">{transfer.userPhone}</div>
                </TableCell>
                <TableCell>{transfer.transferType}</TableCell>
                 <TableCell className="text-left font-semibold">
                    {transfer.amountLYD.toLocaleString('en-US')} د.ل
                </TableCell>
                <TableCell className="text-left">
                    <div className="font-semibold">{transfer.amountEGP.toLocaleString('en-US')} ج.م</div>
                    <div className="text-xs text-muted-foreground">الرسوم: {(transfer.serviceFee || 0).toLocaleString('en-US')} ج.م</div>
                </TableCell>
                <TableCell>
                  <Badge className={cn(statusColors[transfer.status], `hover:${statusColors[transfer.status]}`)}>
                    {statusMap[transfer.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs">{new Date(transfer.timestamp).toLocaleString("ar-EG-u-nu-latn", { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true })}</TableCell>
                <TableCell>
                  {transfer.status === 'completed' ? (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>إيصال العملية {transfer.id}</DialogTitle>
                        </DialogHeader>
                        <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-900/50" dir="rtl">
                          <div className="flex justify-between items-center border-b pb-4 mb-4">
                            <div className="flex items-center gap-2">
                              <CircleDollarSign className="h-8 w-8 text-primary" />
                              <h2 className="text-xl font-bold text-primary">حولّي كاش</h2>
                            </div>
                            <span className="text-sm font-semibold">إيصال تحويل</span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-4">
                            <div><span className="font-semibold text-muted-foreground">رقم العملية:</span> {transfer.id}</div>
                            <div className="text-left"><span className="font-semibold text-muted-foreground">الحالة:</span> <Badge className={cn(statusColors[transfer.status], `hover:${statusColors[transfer.status]}`)}>{statusMap[transfer.status]}</Badge></div>
                            <div className="col-span-2"><span className="font-semibold text-muted-foreground">التاريخ:</span> {new Date(transfer.timestamp).toLocaleString("ar-EG-u-nu-latn", { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}</div>
                          </div>
                          
                          <Separator className="my-4" />
                          
                          <div className="grid grid-cols-2 gap-4 my-4 text-sm">
                            <div>
                              <h3 className="font-bold mb-1">من (المرسل)</h3>
                              <p>{transfer.userName}</p>
                              <p className="text-muted-foreground">{transfer.userPhone}</p>
                            </div>
                            <div>
                              <h3 className="font-bold mb-1">إلى (المستلم)</h3>
                              <p>{transfer.recipientName}</p>
                              <p className="text-muted-foreground">{transfer.recipientNumber}</p>
                            </div>
                          </div>
                          
                          <div className="border rounded-lg text-sm">
                            <Table>
                              <TableBody>
                                <TableRow>
                                  <TableCell className="font-semibold">المبلغ بالدينار</TableCell>
                                  <TableCell className="text-left font-mono">{transfer.amountLYD.toLocaleString('en-US', {minimumFractionDigits: 2})} د.ل</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell className="font-semibold">سعر الصرف</TableCell>
                                  <TableCell className="text-left font-mono">x {transfer.exchangeRate}</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell className="font-semibold">المبلغ بالجنيه</TableCell>
                                  <TableCell className="text-left font-mono">{transfer.amountEGP.toLocaleString('en-US', {minimumFractionDigits: 2})} ج.م</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell className="font-semibold">رسوم الخدمة</TableCell>
                                  <TableCell className="text-left font-mono">{(transfer.serviceFee || 0).toLocaleString('en-US', {minimumFractionDigits: 2})} ج.م</TableCell>
                                </TableRow>
                                <TableRow className="bg-muted/50">
                                  <TableCell className="font-bold">الإجمالي المستلم</TableCell>
                                  <TableCell className="text-left font-bold font-mono">{transfer.amountEGP.toLocaleString('en-US', {minimumFractionDigits: 2})} ج.م</TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </div>
                          
                          <div className="text-center text-xs text-muted-foreground mt-6">
                            شكراً لاستخدامكم خدمات حولّي كاش
                          </div>
                        </div>
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
