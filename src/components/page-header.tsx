
"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
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
import { LogOut, User as UserIcon, Clock } from "lucide-react";
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
import { PlaceHolderImages } from '@/lib/placeholder-images';

export function PageHeader({ title }: { title: string }) {
  const router = useRouter();
  const auth = useAuth();
  const appLogo = PlaceHolderImages.find(img => img.id === 'app-logo')?.imageUrl || '/logo.png';

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
    <header className="sticky top-0 z-30 flex h-20 md:h-24 items-center justify-between gap-2 md:gap-4 border-b border-border/10 bg-background/60 backdrop-blur-xl px-3 md:px-10 transition-all">
      <div className="flex items-center gap-2 md:gap-6">
        <SidebarTrigger className="md:hidden text-primary h-10 w-10 shrink-0" />
      </div>

      <div className="flex flex-1 items-center justify-end gap-2 md:gap-6">
        <div className="w-full max-w-[140px] sm:max-w-sm lg:max-w-md">
          <GlobalSearch />
        </div>

        <div className="hidden items-center gap-3 md:gap-4 rounded-full md:rounded-3xl border border-border/40 bg-card/80 px-3 md:px-5 py-1.5 md:py-2 text-xs md:sm lg:flex shadow-sm hover:shadow-md transition-all">
          {isLoading ? (
            <div className="flex gap-2">
              <Skeleton className="h-5 w-20 md:h-6 md:w-24 rounded-full" />
              <Skeleton className="h-5 w-16 md:h-6 md:w-20 rounded-full" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 md:gap-3">
                <span className="hidden xl:inline font-black text-[9px] md:text-[10px] uppercase text-muted-foreground tracking-wider">حالة الصرف:</span>
                <Badge
                  className={cn(settings?.isOpen
                    ? "bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20" 
                    : "bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20",
                    'font-bold rounded-full px-2 md:px-3 py-0.5 border text-[10px] md:text-xs'
                    )}
                >
                  {settings?.isOpen ? "مفتوح" : "مغلق"}
                </Badge>
              </div>
              {settings?.isOpen && (
                <>
                  <Separator orientation="vertical" className="h-4 md:h-5 bg-border/50" />
                  <div className="flex items-center gap-2 md:gap-3">
                    <span className="hidden xl:inline font-black text-[9px] md:text-[10px] uppercase text-muted-foreground tracking-wider">السعر:</span>
                    <span className="font-black text-primary text-base md:text-lg tabular-nums">{settings?.currentRate}</span>
                  </div>
                </>
              )}
            </>
          )}
          <Separator orientation="vertical" className="h-4 md:h-5 bg-border/50" />
          <div className="flex items-center gap-1.5 md:gap-2" title="وقت السيرفر">
            <Clock className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary/40" />
            <span className="font-bold text-[10px] md:text-xs text-foreground min-w-[70px] md:min-w-[85px] tabular-nums text-left">
              {serverTime || '--:--:--'}
            </span>
          </div>
        </div>

        {/* زر الوضع الليلي - متاح الآن على كافة أحجام الشاشات */}
        <div className="flex items-center">
          <ThemeToggle />
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="overflow-hidden rounded-xl md:rounded-2xl shadow-sm bg-white dark:bg-slate-200 border-border/40 hover:scale-105 h-10 w-10 md:h-12 md:w-12 transition-all p-1.5 shrink-0"
            >
              <div className="relative h-full w-full">
                <Image 
                  src={appLogo} 
                  alt="Logo" 
                  fill 
                  className="object-contain" 
                  data-ai-hint="finance logo"
                />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-2xl border-none shadow-2xl p-2 min-w-[180px] md:min-w-[200px] bg-card text-right">
            <DropdownMenuLabel className="font-black text-foreground px-4 py-2 md:py-3 text-sm md:text-base">حسابي</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border/10" />
            <DropdownMenuItem className="rounded-xl px-4 py-2 md:py-3 cursor-pointer text-xs md:text-sm flex-row-reverse gap-3">
              <UserIcon className="w-4 h-4 text-primary/60" />
              <span className="font-bold">الملف الشخصي</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border/10" />
            <DropdownMenuItem onClick={handleLogout} className="rounded-xl px-4 py-2 md:py-3 cursor-pointer text-destructive focus:text-destructive text-xs md:text-sm flex-row-reverse gap-3">
              <LogOut className="w-4 h-4" />
              <span className="font-bold">تسجيل الخروج</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
