"use client";

import Image from "next/image";
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
import { LogOut, User as UserIcon, Search, Clock } from "lucide-react";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import type { ImagePlaceholder } from "@/lib/placeholder-images";
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
  const avatar = PlaceHolderImages.find(
    (img) => img.id === "user-avatar"
  ) as ImagePlaceholder;

  const { data: settings, isLoading } = useRtdbObject<ExchangeControlSettings>('/settings/exchangeControl');
  const [serverTime, setServerTime] = useState(new Date());
  const [isSearchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const timerId = setInterval(() => setServerTime(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  return (
    <>
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-lg sm:px-8">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="md:hidden" />
        <h1 className="hidden text-2xl font-bold tracking-tight text-foreground md:block">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-4">
         <div className="relative hidden md:block">
            <Button
              variant="outline"
              onClick={() => setSearchOpen(true)}
              className="relative w-full justify-start rounded-lg bg-muted/30 pr-9 md:w-[200px] lg:w-[330px] border-transparent text-muted-foreground transition-colors hover:bg-muted/60"
            >
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <span>ابحث...</span>
              <kbd className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>
          </div>

        <div className="hidden items-center gap-3 rounded-full border bg-card/60 px-3 py-1.5 text-sm lg:flex">
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
                    <span className="font-bold text-primary">{settings?.currentRate?.toFixed(3)}</span>
                  </div>
                </>
              )}
            </>
          )}
          <Separator orientation="vertical" className="h-4 bg-border/70" />
          <div className="flex items-center gap-1.5" title="وقت السيرفر">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-mono text-xs font-medium text-foreground">
              {serverTime.toLocaleTimeString("en-GB")}
            </span>
          </div>
        </div>

        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="overflow-hidden rounded-full"
            >
              <Image
                src={avatar.imageUrl}
                width={40}
                height={40}
                alt="User Avatar"
                data-ai-hint={avatar.imageHint}
                className="overflow-hidden rounded-full"
              />
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
    <GlobalSearch open={isSearchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
