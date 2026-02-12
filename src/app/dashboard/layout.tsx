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
  SidebarInset,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  BrainCircuit,
  ArrowRightLeft,
  Users,
  ReceiptText,
  UserCog,
  Settings,
  Store,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";

const navItems = [
  {
    href: "/dashboard",
    icon: LayoutDashboard,
    label: "لوحة التحكم",
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
    label: "التحويلات المصرية",
    match: /^\/dashboard\/egyptian-transactions/,
  },
  {
    href: "/dashboard/supervisors",
    icon: UserCog,
    label: "المشرفين والمندوبين",
    match: /^\/dashboard\/supervisors/,
  },
  {
    href: "/dashboard/reports",
    icon: BrainCircuit,
    label: "تقارير الذكاء الاصطناعي",
    match: /^\/dashboard\/reports/,
  },
  {
    href: "/dashboard/settings",
    icon: Settings,
    label: "الإعدادات",
    match: /^\/dashboard\/settings/,
  },
];

const pageTitles: { [key: string]: string } = {
  "/dashboard": "لوحة التحكم",
  "/dashboard/exchange-rate": "سعر الصرف",
  "/dashboard/users": "المستخدمين",
  "/dashboard/libyan-transactions": "المعاملات الليبية",
  "/dashboard/egyptian-transactions": "التحويلات المصرية",
  "/dashboard/supervisors": "المشرفين والمندوبين",
  "/dashboard/reports": "تقارير وتحليلات الذكاء الاصطناعي",
  "/dashboard/settings": "الإعدادات",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const getPageTitle = () => {
    // Find the best match for the current path
    let bestMatch = null;
    for (const item of navItems) {
        if (pathname.match(item.match)) {
            if (!bestMatch || item.href.length > bestMatch.href.length) {
                bestMatch = item;
            }
        }
    }

    if (bestMatch) {
      return pageTitles[bestMatch.href];
    }
    
    // Fallback for sub-pages not explicitly in navItems
    if (pathname.startsWith('/dashboard/')) {
        const pathSegments = pathname.split('/');
        const lastSegment = pathSegments[pathSegments.length - 1];
        return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1).replace(/-/g, ' ');
    }

    return "لوحة التحكم";
  };

  return (
    <SidebarProvider>
      <Sidebar side="right" collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2 justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="w-8 h-8 text-primary"
              fill="currentColor"
            >
              <path d="M12.544 2.408a.75.75 0 0 0-1.088 0l-9 7.5A.75.75 0 0 0 2.25 11h3.328V12A3.75 3.75 0 0 0 9.328 15.75h5.344A3.75 3.75 0 0 0 18.422 12V11h3.328a.75.75 0 0 0 .544-1.28L12.544 2.408zM15.422 12a.75.75 0 0 1-.75.75H9.328a.75.75 0 0 1-.75-.75V11h6.844v1z"></path>
              <path d="M4.5 21.75a.75.75 0 0 1 .75-.75h13.5a.75.75 0 0 1 0 1.5H5.25a.75.75 0 0 1-.75-.75zM8.25 19.5a.75.75 0 0 1 .75-.75h6a.75.75 0 0 1 0 1.5H9a.75.75 0 0 1-.75-.75z"></path>
            </svg>
            <h2 className="text-xl font-semibold text-primary group-data-[collapsible=icon]:hidden">
              كاشيات
            </h2>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href}>
                  <SidebarMenuButton
                    isActive={!!pathname.match(item.match)}
                    tooltip={{ children: item.label, side: "left" }}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset className="flex flex-col">
        <PageHeader title={getPageTitle()} />
        <main className="flex-1 overflow-y-auto p-4 sm:px-6">
            <h1 className="text-2xl font-bold mb-4">{getPageTitle()}</h1>
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
