import type { Transaction } from "@/lib/types";

export const mockEgyptianTransactions: Transaction[] = [
    {
    id: "txn_eg_001",
    date: "2024-05-01",
    amount: 8000,
    product: "تلفزيون ذكي",
    category: "إلكترونيات",
    paymentMethod: "تحويل بنكي",
  },
  {
    id: "txn_eg_002",
    date: "2024-05-02",
    amount: 750,
    product: "جاكيت جينز",
    category: "ملابس",
    paymentMethod: "نقد",
  },
  {
    id: "txn_eg_003",
    date: "2024-05-03",
    amount: 300,
    product: "عشاء في مطعم",
    category: "طعام",
    paymentMethod: "بطاقة ائتمان",
  },
  {
    id: "txn_eg_004",
    date: "2024-05-04",
    amount: 4500,
    product: "كنبة",
    category: "أثاث",
    paymentMethod: "بطاقة ائتمان",
  },
  {
    id: "txn_eg_005",
    date: "2024-05-05",
    amount: 250,
    product: "مجموعة كتب",
    category: "كتب",
    paymentMethod: "نقد",
  },
];
