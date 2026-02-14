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
import { Button } from "@/components/ui/button";
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
            <Image
              src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAABWElEQVR42mP4//8/AyUYyADCgAyqApQ4Mfr/b2D+B8x/A/lP0B/G+J8h/k/A/E+w/w/l/8H+P5L/l93/t/w/1//3/L8Z////y/5/hf8f8v9f4v+f4v5f8v8f6f8/of//hP4/M/+fGf9/ov+f0v8/0f9/ov+fkv//Qv6/M/+fGf/fkv9/k//+Iv5/Qv6/M/+/If/fkv+/kf9/I/+/Jf9/k/9/k///hf9/y//f+P//+P//+P//GP9/Yf5/wf//wf//wP//of9fuv+fWf/f+v9/4/9/4/+///8D/f+D9f9F+v+y/f+v7f+v7f9/y/5/Zf//4P//wP//wP//gP//gP//Af0/QP8/oP8/oP8/oP9/Qf8/IP8/IP8/If8/oP9/Qf8/If8/If8/IP8/IP//gP5/QP//kP8/AP//gP5/QP//kP//AP//AP9/AP9/If9/gP4f8v8H/P8A/P8D8P8P8P8X8P8n4P8v4P8/wP9fwP9vwP9/wP///P/38P/fxf9/F/3/V/T/p/T/d/X/f9X/v9X/P9n/L9v/D9//D/D/P8D//wD//wEA//8BABhYB/QLbllDAAAAAElFTkSuQmCC"
              alt="Logo"
              width={32}
              height={32}
              className="w-8 h-8"
            />
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
