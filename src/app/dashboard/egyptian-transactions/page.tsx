import { mockEgyptianTransfers } from "@/lib/mock-egyptian-transfers";
import { EgyptianTransfersDataTable } from "./data-table";

export default function EgyptianTransfersPage() {
  return (
    <div>
      <EgyptianTransfersDataTable initialData={mockEgyptianTransfers} />
    </div>
  );
}
