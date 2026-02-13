import { mockLibyanTransactions } from "@/lib/mock-libyan-transactions";
import { LibyanTransactionsDataTable } from "@/app/dashboard/libyan-transactions/data-table";
import { mockEgyptianTransfers } from "@/lib/mock-egyptian-transfers";
import { EgyptianTransfersDataTable } from "@/app/dashboard/egyptian-transactions/data-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AuditLogPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>سجل المعاملات الليبية</CardTitle>
          <CardDescription>عرض لجميع المعاملات الليبية المسجلة في النظام.</CardDescription>
        </CardHeader>
        <CardContent>
          <LibyanTransactionsDataTable initialData={mockLibyanTransactions} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>سجل التحويلات المصرية</CardTitle>
          <CardDescription>عرض لجميع التحويلات المصرية المسجلة في النظام.</CardDescription>
        </CardHeader>
        <CardContent>
          <EgyptianTransfersDataTable initialData={mockEgyptianTransfers} />
        </CardContent>
      </Card>
    </div>
  );
}
