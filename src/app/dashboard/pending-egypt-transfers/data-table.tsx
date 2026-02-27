'use client';

import { DataTable } from '@/components/ui/data-table';
import { useRTDBList } from '@/firebase/rtdb/use-rtdb-list';
import { EgyptianTransaction } from '@/lib/types';
import { columns } from './columns';

export function PendingEgyptTransfersDataTable() {
  const { data, isLoading, error } = useRTDBList<EgyptianTransaction>('admin/pending_egypt_transfers');

  if (isLoading) {
    return <div>تحميل...</div>;
  }

  if (error) {
    return <div>حدث خطأ: {error.message}</div>;
  }

  return <DataTable columns={columns} data={data} />;
}
