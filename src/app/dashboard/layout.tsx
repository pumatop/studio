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
    label: "Dashboard",
    match: /^\/dashboard\/?$/,
  },
  {
    href: "/dashboard/exchange-rate",
    icon: ArrowRightLeft,
    label: "Exchange Rate",
    match: /^\/dashboard\/exchange-rate/,
  },
  {
    href: "/dashboard/users",
    icon: Users,
    label: "Users",
    match: /^\/dashboard\/users/,
  },
  {
    href: "/dashboard/libyan-transactions",
    icon: ReceiptText,
    label: "Libyan Transactions",
    match: /^\/dashboard\/libyan-transactions/,
  },
  {
    href: "/dashboard/egyptian-transactions",
    icon: ReceiptText,
    label: "Egyptian Transactions",
    match: /^\/dashboard\/egyptian-transactions/,
  },
  {
    href: "/dashboard/supervisors",
    icon: UserCog,
    label: "Supervisors",
    match: /^\/dashboard\/supervisors/,
  },
  {
    href: "/dashboard/reports",
    icon: BrainCircuit,
    label: "AI Reports",
    match: /^\/dashboard\/reports/,
  },
  {
    href: "/dashboard/settings",
    icon: Settings,
    label: "Settings",
    match: /^\/dashboard\/settings/,
  },
];

const pageTitles: { [key: string]: string } = {
  "/dashboard": "Dashboard",
  "/dashboard/exchange-rate": "Exchange Rate",
  "/dashboard/users": "Users",
  "/dashboard/libyan-transactions": "Libyan Transactions",
  "/dashboard/egyptian-transactions": "Egyptian Transactions",
  "/dashboard/supervisors": "Supervisors",
  "/dashboard/reports": "AI Reports & Analytics",
  "/dashboard/settings": "Settings",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const getPageTitle = () => {
    const matchedItem = navItems.find(item => pathname.match(item.match));
    if (matchedItem) {
      return pageTitles[matchedItem.href];
    }
    return "Dashboard";
  };

  return (
    <SidebarProvider>
      <Sidebar side="left">
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <CircleDollarSign className="w-8 h-8" />
            <h2 className="text-xl font-semibold">Cashaat</h2>
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
                <div className="text-left">
                  <p className="text-sm font-medium">Admin</p>
                  <p className="text-xs text-sidebar-foreground/70">
                    admin@example.com
                  </p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/")}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
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
