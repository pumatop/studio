"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect } from "react";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarSeparator,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroupLabel,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  PiggyBank,
  ChevronDown,
  DatabaseZap,
  RefreshCw,
  FolderKanban,
  Wallet,
  Landmark,
  Banknote,
  Truck,
  CreditCard as CreditCardIcon,
  Sparkles,
  Shield,
  Coins,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { useUser, FirebaseClientProvider } from "@/firebase";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navGroups = [
    {
        label: null,
        items: [
            { href: "/dashboard", icon: LayoutDashboard, label: "لوحة التحكم", description: "نظرة عامة وإحصائيات", match: /^\/dashboard\/?$/, bgColor: "bg-blue-100 dark:bg-blue-900/50", iconColor: "text-blue-600 dark:text-blue-400" },
        ]
    },
    {
        label: "الإدارة والمالية",
        items: [
            { href: "/dashboard/users", icon: Users, label: "المستخدمين", description: "إدارة حسابات المستخدمين", match: /^\/dashboard\/users/, bgColor: "bg-purple-100 dark:bg-purple-900/50", iconColor: "text-purple-600 dark:text-purple-400" },
            { href: "/dashboard/supervisors", icon: UserCog, label: "المشرفين", description: "إدارة المشرفين والمندوبين", match: /^\/dashboard\/supervisors/, bgColor: "bg-orange-100 dark:bg-orange-900/50", iconColor: "text-orange-600 dark:text-orange-400" },
            { href: "/dashboard/exchange-rate", icon: ArrowRightLeft, label: "سعر الصرف", description: "مراقبة وتعديل الأسعار", match: /^\/dashboard\/exchange-rate/, bgColor: "bg-teal-100 dark:bg-teal-900/50", iconColor: "text-teal-600 dark:text-teal-400" },
            { href: "/dashboard/fakka-log", icon: PiggyBank, label: "حصالة الفكة", description: "سجل كسور التحويلات", match: /^\/dashboard\/fakka-log/, bgColor: "bg-pink-100 dark:bg-pink-900/50", iconColor: "text-pink-600 dark:text-pink-400" },
        ]
    },
    {
        label: "المعاملات",
        items: [
            { 
                icon: FolderKanban, 
                label: "سجلات التحويلات", 
                description: "تصفح جميع أنواع المعاملات",
                match: /^\/dashboard\/(dg-transfers|card-transactions|transfers|egyptian-transactions)/,
                bgColor: "bg-yellow-100 dark:bg-yellow-900/50", 
                iconColor: "text-yellow-600 dark:text-yellow-400",
                subItems: [
                    { href: '/dashboard/transfers/dd', label: 'دينار لدينار (DD)', icon: Wallet, bgColor: "bg-green-100 dark:bg-green-900/50", iconColor: "text-green-600 dark:text-green-400" },
                    { href: '/dashboard/dg-transfers', label: 'دينار لجنيه (DG)', icon: ArrowRightLeft, bgColor: "bg-teal-100 dark:bg-teal-900/50", iconColor: "text-teal-600 dark:text-teal-400" },
                    { href: '/dashboard/card-transactions', label: 'شراء الكروت (DC)', icon: CreditCardIcon, bgColor: "bg-sky-100 dark:bg-sky-900/50", iconColor: "text-sky-600 dark:text-sky-400" },
                    { href: '/dashboard/transfers/ec', label: 'محفظة كاش (EC)', icon: Landmark, bgColor: "bg-indigo-100 dark:bg-indigo-900/50", iconColor: "text-indigo-600 dark:text-indigo-400" },
                    { href: '/dashboard/transfers/ei', label: 'انستاباي (EI)', icon: Banknote, bgColor: "bg-emerald-100 dark:bg-emerald-900/50", iconColor: "text-emerald-600 dark:text-emerald-400" },
                    { href: '/dashboard/transfers/ew', label: 'وصلي للبيت (EW)', icon: Truck, bgColor: "bg-rose-100 dark:bg-rose-900/50", iconColor: "text-rose-600 dark:text-rose-400" },
                ]
            },
        ]
    },
    {
        label: "الأدوات والإعدادات",
        items: [
            { href: "/dashboard/reports", icon: BrainCircuit, label: "تقارير AI", description: "تحليلات ذكية للبيانات", match: /^\/dashboard\/reports/, bgColor: "bg-indigo-100 dark:bg-indigo-900/50", iconColor: "text-indigo-600 dark:text-indigo-400" },
            { href: "/dashboard/audit-log", icon: History, label: "سجل التدقيق", description: "عرض جميع المعاملات", match: /^\/dashboard\/audit-log/, bgColor: "bg-cyan-100 dark:bg-cyan-900/50", iconColor: "text-cyan-600 dark:text-cyan-400" },
            { href: "/dashboard/settings", icon: Settings, label: "الإعدادات", description: "إعدادات النظام والتطبيق", match: /^\/dashboard\/settings/, bgColor: "bg-gray-200 dark:bg-gray-700/50", iconColor: "text-gray-600 dark:text-gray-400" },
        ]
    }
];

const pageTitles: { [key: string]: string } = {
  "/dashboard": "لوحة التحكم",
  "/dashboard/exchange-rate": "سعر الصرف",
  "/dashboard/users": "المستخدمين",
  "/dashboard/libyan-transactions": "المعاملات المالية",
  "/dashboard/card-transactions": "شراء الكروت (DC)",
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
    if (pageTitles[pathname]) {
      return pageTitles[pathname];
    }
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
        <SidebarHeader className="h-24 border-b border-sidebar-border/20 sticky top-0 bg-card/80 dark:bg-card/60 backdrop-blur-xl z-10">
           <div className="flex items-center gap-3 p-4 justify-start group-data-[collapsible=icon]:justify-center relative">
            <div className="p-3 bg-gradient-to-br from-primary/80 to-primary rounded-xl text-primary-foreground shadow-lg shadow-primary/30">
              <CircleDollarSign className="h-8 w-8 shrink-0" />
            </div>
             <Sparkles className="h-4 w-4 text-primary/50 absolute top-2 right-14 group-data-[collapsible=icon]:hidden" />
             <Shield className="h-4 w-4 text-accent/50 absolute bottom-2 right-2 group-data-[collapsible=icon]:hidden" />
            <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                <h2 className="font-bold text-lg text-sidebar-foreground">حولّي كاش</h2>
                <p className="text-xs text-sidebar-foreground/70">لوحة تحكم الإدارة</p>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navGroups.map((group, i) => (
              <React.Fragment key={group.label || `group-${i}`}>
                {i > 0 && <SidebarSeparator className="my-1" />}
                {group.label && <SidebarGroupLabel className="mt-3">{group.label}</SidebarGroupLabel>}
                {group.items.map((item) => {
                  const isActive = !!(item.match && pathname.match(item.match));
                  
                  if (item.subItems) {
                    return (
                      <SidebarMenuItem key={item.label}>
                        <Collapsible defaultOpen={isActive}>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton
                              isActive={isActive}
                              tooltip={{ children: item.label, side: "left" }}
                              className="w-full justify-between"
                              size="lg"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={cn("p-2 rounded-lg", item.bgColor)}>
                                        <item.icon className={cn("h-5 w-5", item.iconColor)} />
                                    </div>
                                    <div className="flex flex-col items-start">
                                        <span className="font-semibold">{item.label}</span>
                                        {item.description && <span className="text-xs text-sidebar-foreground/60">{item.description}</span>}
                                    </div>
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
                                      <SidebarMenuSubButton isActive={isSubActive} size="md">
                                        <div className={cn("p-1.5 rounded-md", subItem.bgColor)}>
                                            <subItem.icon className={cn("h-4 w-4", subItem.iconColor)} />
                                        </div>
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
                  <SidebarMenuItem key={item.href!}>
                    <Link href={item.href!}>
                       <SidebarMenuButton isActive={isActive} tooltip={{ children: item.label, side: "left" }} size="lg">
                            <div className={cn("p-2 rounded-lg", item.bgColor)}>
                                <item.icon className={cn("h-5 w-5", item.iconColor)} />
                            </div>
                            <div className="flex flex-col items-start">
                                <span className="font-semibold">{item.label}</span>
                                {item.description && <span className="text-xs text-sidebar-foreground/60">{item.description}</span>}
                            </div>
                        </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                )})}
              </React.Fragment>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-2 group-data-[collapsible=icon]:hidden sticky bottom-0 bg-card/80 dark:bg-card/60 backdrop-blur-xl border-t border-sidebar-border/20">
            <Card className="bg-primary/5 border-primary/20">
                <CardHeader className="p-3">
                    <CardTitle className="flex items-center gap-2 text-sm">
                        <DatabaseZap className="h-5 w-5 text-primary"/>
                        <span>بيانات مباشرة</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                    <p className="text-xs text-muted-foreground">
                        انقر للتحديث ومزامنة آخر البيانات من قاعدة البيانات.
                    </p>
                </CardContent>
                <CardFooter className="p-3 pt-0">
                    <Button className="w-full" size="sm" onClick={() => window.location.reload()}>
                        <RefreshCw className="ml-2 h-4 w-4"/>
                        تحديث الآن
                    </Button>
                </CardFooter>
            </Card>
        </SidebarFooter>
      </Sidebar>
      <div className="relative flex min-h-svh flex-1 flex-col bg-background">
        <PageHeader title={getPageTitle()} />
        <main className="flex-1 overflow-y-auto p-4 pt-4 sm:p-6 sm:pt-6">
            <h1 className="text-2xl font-bold mb-4 md:hidden">{getPageTitle()}</h1>
            {children}
        </main>
      </div>
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
