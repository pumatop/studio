import { mockSupervisors } from "@/lib/mock-supervisors";
import { mockEgyptianTransfers } from "@/lib/mock-egyptian-transfers";
import { SupervisorLogDataTable } from "./log-data-table";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function SupervisorLogPage({ params }: { params: { id: string } }) {
  const supervisor = mockSupervisors.find(s => s.id === params.id);

  if (!supervisor) {
    notFound();
  }

  // The request says "transfers he executed and rejected".
  // `EgyptianTransfer` has `status` with "ناجح" (successful) and "مرفوض" (rejected)
  const supervisorTransfers = mockEgyptianTransfers.filter(
    t => t.delegate === supervisor.name && (t.status === 'ناجح' || t.status === 'مرفوض')
  );

  return (
    <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="w-full">
                 <h1 className="text-2xl font-bold">سجل عمليات: {supervisor.name}</h1>
                 <p className="text-muted-foreground">
                    عرض جميع التحويلات المنفذة والمرفوضة من قبل المشرف/المندوب.
                 </p>
            </div>
            <Link href="/dashboard/supervisors" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full">
                    <ArrowRight className="ml-2 h-4 w-4" />
                    العودة للمشرفين
                </Button>
            </Link>
        </div>
      <SupervisorLogDataTable initialData={supervisorTransfers} />
    </div>
  );
}
