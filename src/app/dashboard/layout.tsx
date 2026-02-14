"use client";

import Link from "next/link";
import Image from "next/image";
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
import {
  LayoutDashboard,
  BrainCircuit,
  ArrowRightLeft,
  Users,
  ReceiptText,
  UserCog,
  Settings,
  History,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";

const navItems = [
  {
    href: "/dashboard",
    icon: LayoutDashboard,
    label: "لوحة التحكم",
    match: /^\/dashboard\/?$/,
    color: "text-sky-500",
  },
  {
    href: "/dashboard/exchange-rate",
    icon: ArrowRightLeft,
    label: "سعر الصرف",
    match: /^\/dashboard\/exchange-rate/,
    color: "text-lime-500",
  },
  {
    href: "/dashboard/users",
    icon: Users,
    label: "المستخدمين",
    match: /^\/dashboard\/users/,
    color: "text-violet-500",
  },
  {
    href: "/dashboard/libyan-transactions",
    icon: ReceiptText,
    label: "المعاملات الليبية",
    match: /^\/dashboard\/libyan-transactions/,
    color: "text-orange-500",
  },
  {
    href: "/dashboard/egyptian-transactions",
    icon: ReceiptText,
    label: "التحويلات المصرية",
    match: /^\/dashboard\/egyptian-transactions/,
    color: "text-amber-500",
  },
  {
    href: "/dashboard/supervisors",
    icon: UserCog,
    label: "المشرفين والمندوبين",
    match: /^\/dashboard\/supervisors/,
    color: "text-rose-500",
  },
  {
    href: "/dashboard/reports",
    icon: BrainCircuit,
    label: "تقارير الذكاء الاصطناعي",
    match: /^\/dashboard\/reports/,
    color: "text-teal-500",
  },
  {
    href: "/dashboard/audit-log",
    icon: History,
    label: "سجل التدقيق",
    match: /^\/dashboard\/audit-log/,
    color: "text-blue-500",
  },
  {
    href: "/dashboard/settings",
    icon: Settings,
    label: "الإعدادات",
    match: /^\/dashboard\/settings/,
    color: "text-slate-500",
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
  "/dashboard/audit-log": "سجل التدقيق",
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
            <Image src="https://i.ibb.co/Y02vLp3/logo.png" alt="شعار حولّي كاش" width={32} height={32} />
            <h2 className="text-xl font-semibold text-primary group-data-[collapsible=icon]:hidden">
              حولّي كاش
            </h2>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => {
              const isActive = !!pathname.match(item.match);
              return (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href}>
                  <SidebarMenuButton
                    isActive={isActive}
                    tooltip={{ children: item.label, side: "left" }}
                  >
                    <item.icon className={isActive ? "" : item.color} />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            )})}
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
