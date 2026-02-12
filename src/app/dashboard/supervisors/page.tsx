import { mockSupervisors } from "@/lib/mock-supervisors";
import { SupervisorsDataTable } from "./data-table";

export default function SupervisorsPage() {
  return (
    <div>
      <SupervisorsDataTable initialData={mockSupervisors} />
    </div>
  );
}
