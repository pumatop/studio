import { mockEgyptianTransactions } from "@/lib/mock-egyptian-transactions";
import { EgyptianTransactionsDataTable } from "./data-table";

export default function EgyptianTransactionsPage() {
  return (
    <div>
      <EgyptianTransactionsDataTable initialData={mockEgyptianTransactions} />
    </div>
  );
}
