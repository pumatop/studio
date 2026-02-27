'use client';

import { PendingEgyptTransfersDataTable } from './data-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ReceiptText } from 'lucide-react';

export default function PendingEgyptTransfersPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-100 dark:bg-cyan-900/50 rounded-lg">
              <ReceiptText className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div>
              <CardTitle>مراجعة الحوالات المصرية المعلقة</CardTitle>
              <CardDescription>قم بتأكيد الحوالات التي تمت بنجاح أو رفض الحوالات المتعثرة.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <PendingEgyptTransfersDataTable />
        </CardContent>
      </Card>
    </div>
  );
}
