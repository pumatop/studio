import { mockUsers } from "@/lib/mock-users";
import { UsersDataTable } from "./data-table";

export default function UsersPage() {
  return (
    <div>
      <UsersDataTable initialData={mockUsers} />
    </div>
  );
}
