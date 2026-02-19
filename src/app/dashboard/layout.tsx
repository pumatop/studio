"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  LayoutDashboard,
  BrainCircuit,
  ArrowRightLeft,
  Users,
  ReceiptText,
  UserCog,
  Settings,
  History,
  CircleDollarSign,
  CreditCard,
  ChevronDown,
  ChevronsRight,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { useUser, FirebaseClientProvider } from "@/firebase";

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
    icon: ReceiptText,
    label: "التحويلات والمعاملات",
    match: /^\/dashboard\/(dg-transfers|card-transactions|transfers)/,
    color: "text-orange-500",
    subItems: [
        { href: '/dashboard/dg-transfers', label: 'تحويلات DG' },
        { href: '/dashboard/card-transactions', label: 'معاملات الكروت (DC)' },
        { href: '/dashboard/transfers/dd', label: 'تحويلات داخلية (DD)' },
        { href: '/dashboard/transfers/ec', label: 'تحويلات EC' },
        { href: '/dashboard/transfers/el', label: 'تحويلات EL' },
        { href: '/dashboard/transfers/ew', label: 'تحويلات EW' },
    ]
  },
  {
    href: "/dashboard/users",
    icon: Users,
    label: "المستخدمين",
    match: /^\/dashboard\/users/,
    color: "text-violet-500",
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
  "/dashboard/libyan-transactions": "المعاملات المالية",
  "/dashboard/card-transactions": "معاملات الكروت",
  "/dashboard/egyptian-transactions": "التحويلات المصرية",
  "/dashboard/dg-transfers": "تحويلات DG",
  "/dashboard/supervisors": "المشرفين والمندوبين",
  "/dashboard/reports": "تقارير وتحليلات الذكاء الاصطناعي",
  "/dashboard/audit-log": "سجل التدقيق",
  "/dashboard/settings": "الإعدادات",
  "/dashboard/transfers/dd": "تحويلات داخلية (DD)",
  "/dashboard/transfers/ec": "تحويلات EC",
  "/dashboard/transfers/el": "تحويلات EL",
  "/dashboard/transfers/ew": "تحويلات EW",
};

function InnerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace("/");
    }
  }, [user, isUserLoading, router]);

  const getPageTitle = () => {
    let bestMatch = null;
    // Check main items and sub-items
    for (const item of navItems) {
      if (item.href && pathname.match(item.match)) {
         if (!bestMatch || item.href.length > bestMatch.href.length) {
          bestMatch = item;
        }
      }
      if (item.subItems) {
        for (const subItem of item.subItems) {
          if (pathname.startsWith(subItem.href)) {
            return pageTitles[subItem.href] || subItem.label;
          }
        }
      }
    }
    
    if (bestMatch) {
      return pageTitles[bestMatch.href];
    }
    
    if (pathname.startsWith('/dashboard/')) {
        const pathSegments = pathname.split('/');
        const lastSegment = pathSegments[pathSegments.length - 1];
        if (pageTitles[pathname]) return pageTitles[pathname];
        return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1).replace(/-/g, ' ');
    }

    return "لوحة التحكم";
  };
  
  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <CircleDollarSign className="h-12 w-12 animate-pulse text-primary" />
          <p className="text-muted-foreground">جاري التحقق من الهوية...</p>
        </div>
      </div>
    );
  }
  
  return (
    <SidebarProvider>
      <Sidebar side="right" collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-3 p-4 justify-start group-data-[collapsible=icon]:justify-center h-20">
            <CircleDollarSign className="h-9 w-9 text-primary shrink-0" />
            <div className="font-bold text-primary group-data-[collapsible=icon]:hidden leading-tight text-md">
                حولّي كاش
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => {
              const isActive = !!pathname.match(item.match);
              
              if (item.subItems) {
                return (
                  <SidebarMenuItem key={item.label}>
                    <Collapsible>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          isActive={isActive}
                          tooltip={{ children: item.label, side: "left" }}
                          className="w-full justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <item.icon className={isActive ? "" : item.color} />
                            <span>{item.label}</span>
                          </div>
                          <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[collapsible=icon]:hidden data-[state=open]:rotate-180" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="group-data-[collapsible=icon]:hidden">
                        <div className="pl-7 pt-1 space-y-1">
                          {item.subItems.map((subItem) => {
                            const isSubActive = pathname.startsWith(subItem.href);
                            return (
                              <Link href={subItem.href} key={subItem.href}>
                                <SidebarMenuButton isActive={isSubActive} size="sm" className="w-full h-8 justify-start">
                                  <ChevronsRight className="h-3 w-3" />
                                  <span>{subItem.label}</span>
                                </SidebarMenuButton>
                              </Link>
                            );
                          })}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </SidebarMenuItem>
                )
              }

              return (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href!}>
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
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
            <h1 className="text-2xl font-bold mb-4 sr-only">{getPageTitle()}</h1>
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FirebaseClientProvider>
      <InnerLayout>{children}</InnerLayout>
    </FirebaseClientProvider>
  );
}
