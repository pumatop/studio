
"use client";

import { EgyptTransferTransaction } from "@/lib/types";
import { ColumnDef, HeaderContext, CellContext } from "@tanstack/react-table";

import { DataTableRowActions } from "./data-table-row-actions";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTableColumnHeader } from "./data-table-column-header";

export const columns: ColumnDef<EgyptTransferTransaction>[] = [
  {
    id: "select",
    header: ({ table }: HeaderContext<EgyptTransferTransaction, unknown>) => (
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
    cell: ({ row }: CellContext<EgyptTransferTransaction, unknown>) => (
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
    header: ({ column }: HeaderContext<EgyptTransferTransaction, unknown>) => (
      <DataTableColumnHeader column={column} title="المعرف" />
    ),
    cell: ({ row }: CellContext<EgyptTransferTransaction, unknown>) => <div className="w-[80px] font-mono text-xs">{row.getValue("id")}</div>,
    enableHiding: false,
  },
  {
    accessorKey: "userName",
    header: ({ column }: HeaderContext<EgyptTransferTransaction, unknown>) => (
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
    cell: ({ row }: CellContext<EgyptTransferTransaction, unknown>) => {
        const amount = row.getValue("amountEGP") as number;
        return <div className="font-bold">{amount.toLocaleString('en-US')} ج.م</div>;
    }
  },
  {
    accessorKey: "transferType",
    header: "طريقة التحويل",
  },
  {
    accessorKey: "status",
    header: "الحالة",
  },
  {
    accessorKey: "timestamp",
    header: "الوقت",
    cell: ({ row }: CellContext<EgyptTransferTransaction, unknown>) => {
      const timestamp = row.getValue("timestamp") as number;
      const date = new Date(timestamp);
      return <span className="text-xs text-muted-foreground">{date.toLocaleString('ar-EG')}</span>;
    },
  },
  {
    id: "actions",
    cell: ({ row }: CellContext<EgyptTransferTransaction, unknown>) => <DataTableRowActions row={row} />,
  },
];
