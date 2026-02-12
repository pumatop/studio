import { mockData } from "@/lib/mock-data";
import { DataTable } from "./data-table";

export default function DataPage() {
  return (
    <div>
      <DataTable initialData={mockData} />
    </div>
  );
}
