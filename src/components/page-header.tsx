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
import { LogOut, User as UserIcon, Clock, ShieldCheck } from "lucide-react";
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
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between gap-4 border-b bg-background/50 backdrop-blur-xl px-4 sm:h-24 sm:px-8 transition-colors">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="md:hidden" />
        <h1 className="hidden text-2xl font-bold tracking-tight text-foreground md:block">
          {title}
        </h1>
      </div>

      <div className="flex flex-1 items-center justify-end gap-4">
        <div className="w-full max-w-sm lg:max-w-md">
          <GlobalSearch />
        </div>

        <div className="hidden items-center gap-3 rounded-full border bg-card/80 px-3 py-1.5 text-sm lg:flex shadow-sm">
          {isLoading ? (
            <>
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-20" />
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="font-medium text-muted-foreground">الصرف:</span>
                <Badge
                  className={cn(settings?.isOpen
                    ? "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-500/10 dark:text-green-400" 
                    : "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-500/10 dark:text-red-400",
                    'font-semibold'
                    )}
                >
                  {settings?.isOpen ? "مفتوح" : "مغلق"}
                </Badge>
              </div>
              {settings?.isOpen && (
                <>
                  <Separator orientation="vertical" className="h-4 bg-border/70" />
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-muted-foreground">السعر:</span>
                    <span className="font-bold text-primary">{settings?.currentRate}</span>
                  </div>
                </>
              )}
            </>
          )}
          <Separator orientation="vertical" className="h-4 bg-border/70" />
          <div className="flex items-center gap-1.5" title="وقت السيرفر">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-mono text-xs font-medium text-foreground min-w-[80px]">
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
              className="overflow-hidden rounded-full shadow-sm bg-primary/10 border-primary/20"
            >
              <ShieldCheck className="h-6 w-6 text-primary" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>حسابي</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <UserIcon className="w-4 h-4 ml-2" />
              الملف الشخصي
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="w-4 h-4 ml-2" />
              تسجيل الخروج
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
