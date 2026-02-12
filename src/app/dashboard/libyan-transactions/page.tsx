import { mockLibyanTransactions } from "@/lib/mock-libyan-transactions";
import { LibyanTransactionsDataTable } from "./data-table";

export default function LibyanTransactionsPage() {
  return (
    <div>
      <LibyanTransactionsDataTable initialData={mockLibyanTransactions} />
    </div>
  );
}
