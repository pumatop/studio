import type { PointOfSale } from "@/lib/types";

export const mockPos: PointOfSale[] = [
  {
    id: "pos_001",
    name: "نقطة بيع طرابلس المركز",
    balance: 15000.75,
    status: "نشط",
    createdAt: "2024-03-10T09:00:00Z",
  },
  {
    id: "pos_002",
    name: "محل زاوية الدهماني",
    balance: 8500.00,
    status: "نشط",
    createdAt: "2024-04-21T14:20:00Z",
  },
  {
    id: "pos_003",
    name: "فرع بن عاشور",
    balance: 0,
    status: "غير نشط",
    createdAt: "2024-05-01T11:00:00Z",
  },
  {
    id: "pos_004",
    name: "نقطة بيع مصراتة",
    balance: 22340.50,
    status: "نشط",
    createdAt: "2024-05-15T10:30:00Z",
  },
];
