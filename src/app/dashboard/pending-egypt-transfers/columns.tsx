"use client";

import { EgyptianTransaction } from "@/lib/types";
import { ColumnDef } from "@tanstack/react-table";

import { DataTableRowActions } from "./data-table-row-actions";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";

export const columns: ColumnDef<EgyptianTransaction>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "id",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="المعرف" />
    ),
    cell: ({ row }) => <div className="w-[80px]">{row.getValue("id")}</div>,
    enableHiding: false,
  },
  {
    accessorKey: "userName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="اسم المستخدم" />
    ),
  },
  {
    accessorKey: "userPhone",
    header: "رقم هاتف المستخدم",
  },
  {
    accessorKey: "amountEGP",
    header: "المبلغ (جنيه مصري)",
  },
  {
    accessorKey: "transferMethod",
    header: "طريقة التحويل",
  },
  {
    accessorKey: "status",
    header: "الحالة",
  },
  {
    accessorKey: "timestamp",
    header: "الوقت",
    cell: ({ row }) => {
      const timestamp = row.getValue("timestamp") as number;
      const date = new Date(timestamp);
      return <span>{date.toLocaleString()}</span>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
];
