"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  BrainCircuit,
  LogOut,
  CircleDollarSign,
  ArrowRightLeft,
  Users,
  ReceiptText,
  UserCog,
  Settings,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/page-header";

const navItems = [
  {
    href: "/dashboard",
    icon: LayoutDashboard,
    label: "لوحة القيادة",
    match: /^\/dashboard\/?$/,
  },
  {
    href: "/dashboard/exchange-rate",
    icon: ArrowRightLeft,
    label: "سعر الصرف",
    match: /^\/dashboard\/exchange-rate/,
  },
  {
    href: "/dashboard/users",
    icon: Users,
    label: "المستخدمين",
    match: /^\/dashboard\/users/,
  },
  {
    href: "/dashboard/libyan-transactions",
    icon: ReceiptText,
    label: "المعاملات الليبية",
    match: /^\/dashboard\/libyan-transactions/,
  },
  {
    href: "/dashboard/egyptian-transactions",
    icon: ReceiptText,
    label: "المعاملات المصرية",
    match: /^\/dashboard\/egyptian-transactions/,
  },
  {
    href: "/dashboard/supervisors",
    icon: UserCog,
    label: "المشرفين",
    match: /^\/dashboard\/supervisors/,
  },
  {
    href: "/dashboard/reports",
    icon: BrainCircuit,
    label: "تقارير AI",
    match: /^\/dashboard\/reports/,
  },
  {
    href: "/dashboard/settings",
    icon: Settings,
    label: "الاعدادات",
    match: /^\/dashboard\/settings/,
  },
];

const pageTitles: { [key: string]: string } = {
  "/dashboard": "لوحة القيادة",
  "/dashboard/exchange-rate": "سعر الصرف",
  "/dashboard/users": "المستخدمين",
  "/dashboard/libyan-transactions": "المعاملات الليبية",
  "/dashboard/egyptian-transactions": "المعاملات المصرية",
  "/dashboard/supervisors": "المشرفين",
  "/dashboard/reports": "تقارير وتحليلات AI",
  "/dashboard/settings": "الاعدادات",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const getPageTitle = () => {
    for (const key in pageTitles) {
      if (pathname.startsWith(key) && key.length > pathname.length - (pathname.endsWith('/') ? 1 : 0)) {
        return pageTitles[key];
      }
    }
     const matchedItem = navItems.find(item => pathname.match(item.match));
    if (matchedItem) {
      return pageTitles[matchedItem.href];
    }
    return "لوحة القيادة";
  };

  return (
    <SidebarProvider>
      <Sidebar side="right">
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <CircleDollarSign className="w-8 h-8" />
            <h2 className="text-xl font-semibold">كاشيات</h2>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href}>
                  <SidebarMenuButton
                    isActive={!!pathname.match(item.match)}
                    tooltip={{ children: item.label }}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="justify-start w-full gap-2 p-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="https://picsum.photos/seed/100/40/40" />
                  <AvatarFallback>AD</AvatarFallback>
                </Avatar>
                <div className="text-right">
                  <p className="text-sm font-medium">المسؤول</p>
                  <p className="text-xs text-sidebar-foreground/70">
                    admin@example.com
                  </p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-56">
              <DropdownMenuLabel>حسابي</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/")}>
                <LogOut className="ml-2 h-4 w-4" />
                <span>تسجيل الخروج</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="flex flex-col">
        <PageHeader title={getPageTitle()} />
        <main className="flex-1 overflow-y-auto p-4 sm:px-6">
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
