import type { Supervisor } from "@/lib/types";

export const mockSupervisors: Supervisor[] = [
  {
    id: "sup_001",
    name: "أحمد خالد",
    email: "ahmed.k@example.com",
    role: "مشرف",
    status: "نشط",
    lastLogin: "2024-05-20T09:00:00Z",
  },
  {
    id: "sup_002",
    name: "فاطمة علي",
    email: "fatima.a@example.com",
    role: "مندوب",
    status: "نشط",
    lastLogin: "2024-05-19T14:30:00Z",
  },
  {
    id: "sup_003",
    name: "محمد حسن",
    email: "mohamed.h@example.com",
    role: "مندوب",
    status: "غير نشط",
    lastLogin: "2024-04-15T11:00:00Z",
  },
    {
    id: "sup_004",
    name: "سارة إبراهيم",
    email: "sara.i@example.com",
    role: "مشرف",
    status: "نشط",
    lastLogin: "2024-05-20T11:20:00Z",
  },
];
