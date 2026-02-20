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
  SidebarGroupLabel,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton
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
  PiggyBank,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { useUser, FirebaseClientProvider } from "@/firebase";

const navGroups = [
    {
        label: null,
        items: [
            { href: "/dashboard", icon: LayoutDashboard, label: "لوحة التحكم", match: /^\/dashboard\/?$/ },
        ]
    },
    {
        label: "الإدارة والمالية",
        items: [
            { href: "/dashboard/users", icon: Users, label: "المستخدمين", match: /^\/dashboard\/users/ },
            { href: "/dashboard/supervisors", icon: UserCog, label: "المشرفين", match: /^\/dashboard\/supervisors/ },
            { href: "/dashboard/exchange-rate", icon: ArrowRightLeft, label: "سعر الصرف", match: /^\/dashboard\/exchange-rate/ },

        ]
    },
    {
        label: "المعاملات",
        items: [
            { 
                icon: ReceiptText, 
                label: "التحويلات", 
                match: /^\/dashboard\/(dg-transfers|card-transactions|transfers)/,
                subItems: [
                    { href: '/dashboard/transfers/dd', label: 'دينار لدينار (DD)' },
                    { href: '/dashboard/dg-transfers', label: 'دينار لجنيه (DG)' },
                    { href: '/dashboard/card-transactions', label: 'شراء الكروت (DC)' },
                    { href: '/dashboard/transfers/ec', label: 'محفظة كاش (EC)' },
                    { href: '/dashboard/transfers/ei', label: 'انستاباي (EI)' },
                    { href: '/dashboard/transfers/ew', label: 'وصلي للبيت (EW)' },
                ]
            },
            { href: "/dashboard/fakka-log", icon: PiggyBank, label: "حصالة الفكة", match: /^\/dashboard\/fakka-log/ },
        ]
    },
    {
        label: "الأدوات والإعدادات",
        items: [
            { href: "/dashboard/reports", icon: BrainCircuit, label: "تقارير الذكاء الاصطناعي", match: /^\/dashboard\/reports/ },
            { href: "/dashboard/audit-log", icon: History, label: "سجل التدقيق", match: /^\/dashboard\/audit-log/ },
            { href: "/dashboard/settings", icon: Settings, label: "الإعدادات", match: /^\/dashboard\/settings/ },
        ]
    }
];

const pageTitles: { [key: string]: string } = {
  "/dashboard": "لوحة التحكم",
  "/dashboard/exchange-rate": "سعر الصرف",
  "/dashboard/users": "المستخدمين",
  "/dashboard/libyan-transactions": "المعاملات المالية",
  "/dashboard/card-transactions": "شراء الكروت (DC)",
  "/dashboard/egyptian-transactions": "التحويلات المصرية",
  "/dashboard/dg-transfers": "التحويل من دينار لجنيه (DG)",
  "/dashboard/supervisors": "المشرفين والمندوبين",
  "/dashboard/fakka-log": "حصالة الفكة",
  "/dashboard/reports": "تقارير وتحليلات الذكاء الاصطناعي",
  "/dashboard/audit-log": "سجل التدقيق",
  "/dashboard/settings": "الإعدادات",
  "/dashboard/transfers/dd": "التحويل من دينار لدينار (DD)",
  "/dashboard/transfers/ec": "تحويل محفظة كاش (EC)",
  "/dashboard/transfers/ei": "تحويل انستاباي (EI)",
  "/dashboard/transfers/ew": "وصلي للبيت (EW)",
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
    // Exact match first
    if (pageTitles[pathname]) {
      return pageTitles[pathname];
    }
    
    // Check main items and sub-items for prefix match
    let bestMatch: { href: string } | null = null;
    for (const group of navGroups) {
      for (const item of group.items) {
        if (item.href && pathname.startsWith(item.href)) {
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
    }
    
    if (bestMatch && pageTitles[bestMatch.href]) {
      return pageTitles[bestMatch.href];
    }
    
    // Fallback for dynamic pages like supervisor logs
    if (pathname.startsWith('/dashboard/')) {
        const pathSegments = pathname.split('/');
        const lastSegment = pathSegments[pathSegments.length - 1];
        if (pageTitles[pathname]) return pageTitles[pathname];
        if (pathname.includes('/log')) return `سجل عمليات`;
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
          <div className="flex items-center gap-3 p-4 justify-start group-data-[collapsible=icon]:justify-center h-20 sm:h-24">
            <CircleDollarSign className="h-9 w-9 text-primary shrink-0" />
            <div className="font-bold text-primary group-data-[collapsible=icon]:hidden leading-tight text-md">
                حولّي كاش
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navGroups.map((group) => (
              <React.Fragment key={group.label || 'main'}>
                {group.label && <SidebarGroupLabel className="mt-3">{group.label}</SidebarGroupLabel>}
                {group.items.map((item) => {
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
                                <item.icon />
                                <span>{item.label}</span>
                              </div>
                              <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[collapsible=icon]:hidden data-[state=open]:rotate-180" />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="group-data-[collapsible=icon]:hidden">
                            <SidebarMenuSub>
                              {item.subItems.map((subItem) => {
                                const isSubActive = pathname.startsWith(subItem.href);
                                return (
                                  <SidebarMenuSubItem key={subItem.href}>
                                    <Link href={subItem.href}>
                                      <SidebarMenuSubButton isActive={isSubActive} size="sm">
                                        <ChevronsRight className="h-3 w-3" />
                                        <span>{subItem.label}</span>
                                      </SidebarMenuSubButton>
                                    </Link>
                                  </SidebarMenuSubItem>
                                );
                              })}
                            </SidebarMenuSub>
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
                        <item.icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                )})}
              </React.Fragment>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset className="flex flex-col">
        <PageHeader title={getPageTitle()} />
        <main className="flex-1 overflow-y-auto p-4 pt-4 sm:p-6 sm:pt-6">
            <h1 className="text-2xl font-bold mb-4 md:hidden">{getPageTitle()}</h1>
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
