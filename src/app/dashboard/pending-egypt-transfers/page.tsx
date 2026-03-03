'use client';

import { PendingEgyptTransfersDataTable } from './data-table';
import { ReceiptText } from 'lucide-react';

export default function PendingEgyptTransfersPage() {
  return (
    <div className="space-y-8 pb-10">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-cyan-100 dark:bg-cyan-900/50 rounded-2xl shadow-sm">
            <ReceiptText className="h-7 w-7 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-[#1A4B84]">مراجعة الحوالات المصرية المعلقة</h1>
            <p className="text-sm md:text-base text-muted-foreground font-medium mt-1">
              قم بتأكيد الحوالات التي تمت بنجاح أو رفض الحوالات المتعثرة من القائمة الحية.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full">
        <PendingEgyptTransfersDataTable />
      </div>
    </div>
  );
}
