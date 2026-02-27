import { PendingEgyptTransfersDataTable } from './data-table';

export default function PendingEgyptTransfersPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-5">مراجعة الحوالات المصرية المعلقة</h1>
      <PendingEgyptTransfersDataTable />
    </div>
  );
}
