import type { User } from "@/lib/types";

export const mockUsers: User[] = [
  {
    id: "usr_001",
    name: "علي محمد",
    email: "ali.m@example.com",
    phone: "091-1234567",
    status: "نشط",
    createdAt: "2024-01-15T10:00:00Z",
  },
  {
    id: "usr_002",
    name: "نور عبد الله",
    email: "nour.a@example.com",
    phone: "010-9876543",
    status: "نشط",
    createdAt: "2024-02-20T11:30:00Z",
  },
  {
    id: "usr_003",
    name: "خالد المصري",
    email: "khaled.m@example.com",
    phone: "011-5555555",
    status: "محظور",
    createdAt: "2024-03-10T09:00:00Z",
  },
    {
    id: "usr_004",
    name: "مريم محمود",
    email: "mariam.m@example.com",
    phone: "092-7654321",
    status: "نشط",
    createdAt: "2024-04-05T18:00:00Z",
  },
];
