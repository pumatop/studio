import type { Transaction } from "@/lib/types";

export const mockLibyanTransactions: Transaction[] = [
  {
    id: "txn_ly_001",
    date: "2024-05-01",
    amount: 1500,
    product: "هاتف ذكي",
    category: "إلكترونيات",
    paymentMethod: "بطاقة ائتمان",
  },
  {
    id: "txn_ly_002",
    date: "2024-05-02",
    amount: 250,
    product: "بنطلون جينز",
    category: "ملابس",
    paymentMethod: "نقد",
  },
  {
    id: "txn_ly_003",
    date: "2024-05-03",
    amount: 80,
    product: "مشتريات بقالة",
    category: "طعام",
    paymentMethod: "بطاقة ائتمان",
  },
    {
    id: "txn_ly_004",
    date: "2024-05-04",
    amount: 400,
    product: "تصليح سيارة",
    category: "خدمات",
    paymentMethod: "نقد",
  },
  {
    id: "txn_ly_005",
    date: "2024-05-05",
    amount: 120,
    product: "كشف طبي",
    category: "صحة",
    paymentMethod: "بطاقة ائتمان",
  },
];
