import { mockPos } from "@/lib/mock-pos";
import { PosDataTable } from "./data-table";

export default function PosPage() {
  return (
    <div>
      <PosDataTable initialData={mockPos} />
    </div>
  );
}
