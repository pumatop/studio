"use client";

import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { LogOut, User as UserIcon, Clock, ShieldCheck, Activity } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth, useRtdbObject } from "@/firebase";
import { signOut } from "firebase/auth";
import type { ExchangeControlSettings } from "@/lib/types";
import { Skeleton } from "./ui/skeleton";
import { Separator } from "./ui/separator";
import { GlobalSearch } from "./global-search";

export function PageHeader({ title }: { title: string }) {
  const router = useRouter();
  const auth = useAuth();

  const { data: settings, isLoading } = useRtdbObject<ExchangeControlSettings>('/settings/exchangeControl');
  const [serverTime, setServerTime] = useState<string | null>(null);

  useEffect(() => {
    const updateTime = () => {
        setServerTime(new Date().toLocaleTimeString("ar-EG-u-nu-latn", {
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
        }));
    };
    updateTime();
    const timerId = setInterval(updateTime, 1000);
    return () => clearInterval(timerId);
  }, []);
  
  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-30 flex h-24 items-center justify-between gap-4 border-b border-[#1A4B84]/5 bg-white/60 backdrop-blur-xl px-6 sm:px-10 transition-all">
      <div className="flex items-center gap-6">
        <SidebarTrigger className="md:hidden text-[#1A4B84]" />
        <div className="hidden md:flex flex-col">
            <h1 className="text-2xl font-black tracking-tight text-[#1A4B84]">
            {title}
            </h1>
            <div className="accent-gradient-line"></div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-end gap-6">
        <div className="w-full max-w-sm lg:max-w-md">
          <GlobalSearch />
        </div>

        <div className="hidden items-center gap-4 rounded-3xl border border-[#1A4B84]/10 bg-white/80 px-5 py-2 text-sm lg:flex shadow-sm hover:shadow-md transition-all">
          {isLoading ? (
            <div className="flex gap-2">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <span className="font-black text-[10px] uppercase text-muted-foreground/60 tracking-wider">حالة الصرف:</span>
                <Badge
                  className={cn(settings?.isOpen
                    ? "bg-green-50 text-green-700 hover:bg-green-100 border-green-100" 
                    : "bg-red-50 text-red-700 hover:bg-red-100 border-red-100",
                    'font-bold rounded-full px-3 py-0.5 border'
                    )}
                >
                  {settings?.isOpen ? "مفتوح" : "مغلق"}
                </Badge>
              </div>
              {settings?.isOpen && (
                <>
                  <Separator orientation="vertical" className="h-5 bg-border/50" />
                  <div className="flex items-center gap-3">
                    <span className="font-black text-[10px] uppercase text-muted-foreground/60 tracking-wider">السعر:</span>
                    <span className="font-black text-[#1A4B84] text-lg tabular-nums">{settings?.currentRate}</span>
                  </div>
                </>
              )}
            </>
          )}
          <Separator orientation="vertical" className="h-5 bg-border/50" />
          <div className="flex items-center gap-2" title="وقت السيرفر">
            <Clock className="h-4 w-4 text-[#1A4B84]/40" />
            <span className="font-bold text-xs text-[#1A4B84] min-w-[85px] tabular-nums text-left">
              {serverTime || '--:--:--'}
            </span>
          </div>
        </div>

        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="overflow-hidden rounded-2xl shadow-sm bg-[#1A4B84]/5 border-[#1A4B84]/10 hover:bg-[#1A4B84]/10 h-12 w-12 transition-all"
            >
              <ShieldCheck className="h-7 w-7 text-[#1A4B84]" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-2xl border-none shadow-2xl p-2 min-w-[200px]">
            <DropdownMenuLabel className="font-black text-[#1A4B84] px-4 py-3">حسابي</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-100" />
            <DropdownMenuItem className="rounded-xl px-4 py-3 cursor-pointer">
              <UserIcon className="w-4 h-4 ml-3 text-[#1A4B84]/60" />
              <span className="font-bold">الملف الشخصي</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-100" />
            <DropdownMenuItem onClick={handleLogout} className="rounded-xl px-4 py-3 cursor-pointer text-destructive focus:text-destructive">
              <LogOut className="w-4 h-4 ml-3" />
              <span className="font-bold">تسجيل الخروج</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}