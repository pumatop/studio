
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, ForwardRefExoticComponent, RefAttributes } from 'react';
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
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  LayoutDashboard,
  BrainCircuit,
  ArrowRightLeft,
  Users,
  ReceiptText,
  UserCog,
  Settings,
  History,
  ShieldCheck,
  PiggyBank,
  ChevronDown,
  FolderKanban,
  Wallet,
  Landmark,
  Banknote,
  Truck,
  CreditCard as CreditCardIcon,
  Bell,
  LucideProps,
} from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { useUser, FirebaseClientProvider } from '@/firebase';
import { cn } from '@/lib/utils';

// Type definitions for navigation items
type SubItem = {
  href: string;
  label: string;
  icon: ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>;
  bgColor: string;
  iconColor: string;
};

type NavItem = {
  href?: string;
  icon: ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>;
  label: string;
  description: string;
  match: RegExp;
  bgColor: string;
  iconColor: string;
  subItems?: SubItem[];
};


const navGroups: { label: string | null; items: NavItem[] }[] = [
  {
    label: null,
    items: [
      {
        href: '/dashboard',
        icon: LayoutDashboard,
        label: 'لوحة التحكم',
        description: 'نظرة عامة وإحصائيات',
        match: /^\/dashboard\/?$/,
        bgColor: 'bg-[#E3F2FD]',
        iconColor: 'text-[#1A4B84]',
      },
    ],
  },
  {
    label: 'الإدارة والمالية',
    items: [
      {
        href: '/dashboard/users',
        icon: Users,
        label: 'المستخدمين',
        description: 'إدارة حسابات المستخدمين',
        match: /^\/dashboard\/users/,
        bgColor: 'bg-purple-50',
        iconColor: 'text-purple-600',
      },
      {
        href: '/dashboard/supervisors',
        icon: UserCog,
        label: 'المشرفين',
        description: 'إدارة المشرفين والمندوبين',
        match: /^\/dashboard\/supervisors/,
        bgColor: 'bg-orange-50',
        iconColor: 'text-orange-600',
      },
      {
        href: '/dashboard/exchange-rate',
        icon: ArrowRightLeft,
        label: 'سعر الصرف',
        description: 'مراقبة وتعديل الأسعار',
        match: /^\/dashboard\/exchange-rate/,
        bgColor: 'bg-teal-50',
        iconColor: 'text-teal-600',
      },
      {
        href: '/dashboard/fakka-log',
        icon: PiggyBank,
        label: 'حصالة الفكة',
        description: 'سجل كسور التحويلات',
        match: /^\/dashboard\/fakka-log/,
        bgColor: 'bg-pink-50',
        iconColor: 'text-pink-600',
      },
    ],
  },
  {
    label: 'المعاملات',
    items: [
      {
        icon: FolderKanban,
        label: 'سجلات التحويلات',
        description: 'تصفح جميع أنواع المعاملات',
        match: /^\/dashboard\/(dg-transfers|card-transactions|transfers|egyptian-transactions)/,
        bgColor: 'bg-yellow-50',
        iconColor: 'text-yellow-600',
        subItems: [
          {
            href: '/dashboard/transfers/dd',
            label: 'دينار لدينار (DD)',
            icon: Wallet,
            bgColor: 'bg-green-50',
            iconColor: 'text-green-600',
          },
          {
            href: '/dashboard/dg-transfers',
            label: 'دينار لجنيه (DG)',
            icon: ArrowRightLeft,
            bgColor: 'bg-teal-50',
            iconColor: 'text-teal-600',
          },
          {
            href: '/dashboard/card-transactions',
            label: 'شراء الكروت (DC)',
            icon: CreditCardIcon,
            bgColor: 'bg-sky-50',
            iconColor: 'text-sky-600',
          },
          {
            href: '/dashboard/transfers/ec',
            label: 'محفظة كاش (EC)',
            icon: Landmark,
            bgColor: 'bg-indigo-50',
            iconColor: 'text-indigo-600',
          },
          {
            href: '/dashboard/transfers/ei',
            label: 'انستاباي (EI)',
            icon: Banknote,
            bgColor: 'bg-emerald-50',
            iconColor: 'text-emerald-600',
          },
          {
            href: '/dashboard/transfers/ew',
            label: 'وصلي للبيت (EW)',
            icon: Truck,
            bgColor: 'bg-rose-50',
            iconColor: 'text-rose-600',
          },
        ],
      },
      {
        href: '/dashboard/pending-egypt-transfers',
        icon: ReceiptText,
        label: 'مراجعة الحوالات المصرية',
        description: 'تأكيد الحوالات المعلقة',
        match: /^\/dashboard\/pending-egypt-transfers/,
        bgColor: 'bg-cyan-50',
        iconColor: 'text-cyan-600',
      },
    ],
  },
  {
    label: 'الأدوات والإعدادات',
    items: [
      {
        href: '/dashboard/notifications',
        icon: Bell,
        label: 'الإشعارات',
        description: 'إرسال وإدارة الإشعارات',
        match: /^\/dashboard\/notifications/,
        bgColor: 'bg-red-50',
        iconColor: 'text-red-600',
      },
      {
        href: '/dashboard/reports',
        icon: BrainCircuit,
        label: 'تقارير AI',
        description: 'تحليلات ذكية للبيانات',
        match: /^\/dashboard\/reports/,
        bgColor: 'bg-indigo-50',
        iconColor: 'text-indigo-600',
      },
      {
        href: '/dashboard/audit-log',
        icon: History,
        label: 'سجل التدقيق',
        description: 'عرض جميع المعاملات',
        match: /^\/dashboard\/audit-log/,
        bgColor: 'bg-cyan-50',
        iconColor: 'text-cyan-600',
      },
      {
        href: '/dashboard/settings',
        icon: Settings,
        label: 'الإعدادات',
        description: 'إعدادات النظام والتطبيق',
        match: /^\/dashboard\/settings/,
        bgColor: 'bg-gray-100',
        iconColor: 'text-gray-600',
      },
    ],
  },
];

const pageTitles: { [key: string]: string } = {
  '/dashboard': 'لوحة التحكم',
  '/dashboard/exchange-rate': 'سعر الصرف',
  '/dashboard/users': 'المستخدمين',
  '/dashboard/libyan-transactions': 'المعاملات المالية',
  '/dashboard/card-transactions': 'شراء الكروت (DC)',
  '/dashboard/dg-transfers': 'التحويل من دينار لجنيه (DG)',
  '/dashboard/supervisors': 'المشرفين والمندوبين',
  '/dashboard/fakka-log': 'حصالة الفكة',
  '/dashboard/reports': 'تقارير وتحليلات الذكاء الاصطناعي',
  '/dashboard/audit-log': 'سجل التدقيق',
  '/dashboard/settings': 'الإعدادات',
  '/dashboard/notifications': 'الإشعارات',
  '/dashboard/transfers/dd': 'التحويل من دينار لدينار (DD)',
  '/dashboard/transfers/ec': 'تحويل محفظة كاش (EC)',
  '/dashboard/transfers/ei': 'تحويل انستاباي (EI)',
  '/dashboard/transfers/ew': 'وصلي للبيت (EW)',
  '/dashboard/pending-egypt-transfers': 'مراجعة الحوالات المصرية',
};

function InnerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/');
    }
  }, [user, isUserLoading, router]);

  const getPageTitle = () => {
    if (pageTitles[pathname]) {
      return pageTitles[pathname];
    }
    let bestMatch: NavItem | null = null;
    for (const group of navGroups) {
      for (const item of group.items) {
        if (item.href && pathname.startsWith(item.href)) {
          if (!bestMatch || (bestMatch.href && item.href.length > bestMatch.href.length)) {
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
    if (bestMatch && bestMatch.href && pageTitles[bestMatch.href]) {
      return pageTitles[bestMatch.href];
    }
    if (pathname.startsWith('/dashboard/')) {
      const pathSegments = pathname.split('/');
      const lastSegment = pathSegments[pathSegments.length - 1];
      if (pageTitles[pathname]) return pageTitles[pathname];
      if (pathname.includes('/log')) return `سجل عمليات`;
      return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1).replace(/-/g, ' ');
    }
    return 'لوحة التحكم';
  };

  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#e1ecf3]">
        <div className="flex flex-col items-center gap-4">
          <ShieldCheck className="h-16 w-16 animate-pulse text-[#1A4B84]" />
          <p className="text-[#1A4B84] font-bold text-lg">جاري التحقق من الهوية...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar side="right" collapsible="icon">
        <SidebarHeader className="h-24 md:h-28 border-b border-sidebar-border/10 sticky top-0 bg-white/80 backdrop-blur-xl z-10">
          <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 justify-start group-data-[collapsible=icon]:justify-center relative">
            <div className="p-2.5 md:p-3 bg-gradient-to-br from-[#1A4B84] to-[#2563EB] rounded-xl md:rounded-[1.2rem] text-primary-foreground shadow-xl shadow-primary/20">
              <ShieldCheck className="h-8 w-8 md:h-10 md:w-10 shrink-0" />
            </div>
            <div className="flex flex-col group-data-[collapsible=icon]:hidden">
              <h2 className="font-black text-lg md:text-xl text-[#1A4B84]">حولّي كاش</h2>
              <p className="text-[9px] md:text-[10px] uppercase tracking-widest text-[#1A4B84]/60 font-bold">لوحة تحكم الإدارة</p>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent className="p-2 md:p-4 gap-2 md:gap-4">
          <SidebarMenu>
            {navGroups.map((group, i) => (
              <React.Fragment key={group.label || `group-${i}`}>
                {group.label && <SidebarGroupLabel className="mt-4 md:mt-6 mb-1 md:mb-2 px-2 text-[#1A4B84]/70 font-black text-[9px] md:text-[10px] uppercase tracking-widest">{group.label}</SidebarGroupLabel>}
                {group.items.map((item: NavItem) => {
                  const isActive = !!(item.match && pathname.match(item.match));

                  if (item.subItems) {
                    return (
                      <SidebarMenuItem key={item.label} className="mb-1">
                        <Collapsible defaultOpen={isActive}>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton
                              isActive={isActive}
                              tooltip={{ children: item.label, side: 'left' }}
                              className={cn(
                                "w-full justify-between rounded-xl md:rounded-2xl transition-all duration-300",
                                isActive ? "bg-[#E3F2FD] shadow-sm" : "hover:bg-[#E3F2FD]/50"
                              )}
                              size="lg"
                            >
                              <div className="flex items-center gap-3">
                                <div className={cn('p-2 md:p-2.5 rounded-lg md:rounded-xl shadow-sm transition-transform duration-300', item.bgColor, isActive && "scale-110")}>
                                  <item.icon className={cn('h-4 w-4 md:h-5 md:w-5', item.iconColor)} />
                                </div>
                                <div className="flex flex-col items-start">
                                  <span className={cn("font-bold text-xs md:text-sm transition-colors", isActive ? "text-[#1A4B84]" : "text-slate-800")}>{item.label}</span>
                                </div>
                              </div>
                              <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[collapsible=icon]:hidden data-[state=open]:rotate-180" />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="group-data-[collapsible=icon]:hidden">
                            <SidebarMenuSub className="mt-1 border-r-2 border-l-0 border-slate-100 pr-3 md:pr-4 mr-4 md:mr-6">
                              {item.subItems.map((subItem: SubItem) => {
                                const isSubActive = pathname.startsWith(subItem.href);
                                return (
                                  <SidebarMenuSubItem key={subItem.href}>
                                    <Link href={subItem.href} passHref>
                                      <SidebarMenuSubButton isActive={isSubActive} size="md" className="rounded-lg md:rounded-xl">
                                        <div className={cn('p-1 md:p-1.5 rounded-md md:rounded-lg', subItem.bgColor)}>
                                          <subItem.icon className={cn('h-3 w-3 md:h-3.5 md:w-3.5', subItem.iconColor)} />
                                        </div>
                                        <span className={cn("text-[11px] md:text-xs font-bold transition-colors", isSubActive ? "text-primary" : "text-slate-700")}>{subItem.label}</span>
                                      </SidebarMenuSubButton>
                                    </Link>
                                  </SidebarMenuSubItem>
                                );
                              })}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </Collapsible>
                      </SidebarMenuItem>
                    );
                  }

                  return (
                    <SidebarMenuItem key={item.href!} className="mb-1">
                      <Link href={item.href!}>
                        <SidebarMenuButton 
                          isActive={isActive} 
                          tooltip={{ children: item.label, side: 'left' }} 
                          size="lg"
                          className={cn(
                            "rounded-xl md:rounded-2xl transition-all duration-300",
                            isActive ? "bg-[#E3F2FD] shadow-sm" : "hover:bg-[#E3F2FD]/50"
                          )}
                        >
                          <div className={cn('p-2 md:p-2.5 rounded-lg md:rounded-xl shadow-sm transition-transform duration-300', item.bgColor, isActive && "scale-110")}>
                            <item.icon className={cn('h-4 w-4 md:h-5 md:w-5', item.iconColor)} />
                          </div>
                          <div className="flex flex-col items-start">
                            <span className={cn("font-bold text-xs md:text-sm transition-colors", isActive ? "text-[#1A4B84]" : "text-slate-800")}>{item.label}</span>
                          </div>
                        </SidebarMenuButton>
                      </Link>
                    </SidebarMenuItem>
                  );
                })}
              </React.Fragment>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-3 md:p-4 group-data-[collapsible=icon]:hidden sticky bottom-0 bg-white/80 backdrop-blur-xl border-t border-sidebar-border/10">
          {/* Sidebar Footer empty as requested */}
        </SidebarFooter>
      </Sidebar>
      <div className="relative flex min-h-svh flex-1 flex-col bg-transparent overflow-x-hidden">
        <PageHeader title={getPageTitle()} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-10">
          <div className="flex flex-col mb-6 md:hidden">
             <h1 className="text-2xl font-black text-[#1A4B84]">{getPageTitle()}</h1>
             <div className="accent-gradient-line"></div>
          </div>
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseClientProvider>
      <InnerLayout>{children}</InnerLayout>
    </FirebaseClientProvider>
  );
}
