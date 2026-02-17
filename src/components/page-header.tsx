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
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "./theme-toggle";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/firebase";
import { signOut } from "firebase/auth";

export function PageHeader({ title }: { title: string }) {
  const router = useRouter();
  const auth = useAuth();
  const avatar = PlaceHolderImages.find(
    (img) => img.id === "user-avatar"
  ) as ImagePlaceholder;

  // Mock state for exchange info. In a real app, this would come from a global state or context.
  const [isExchangeOpen, setExchangeOpen] = useState(true);
  const [currentRate, setCurrentRate] = useState(9.65);
  const [serverTime, setServerTime] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => setServerTime(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);
  
  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };


  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
      <SidebarTrigger className="md:hidden" />
      <div className="relative flex-1 md:grow-0">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="ابحث..."
          className="w-full rounded-lg bg-card pr-8 md:w-[200px] lg:w-[320px]"
        />
      </div>

      <div className="hidden md:flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-muted-foreground">حالة الصرف:</span>
          <Badge
            className={cn(isExchangeOpen 
              ? "bg-green-100 text-green-800 hover:bg-green-200" 
              : "bg-red-100 text-red-800 hover:bg-red-200",
              'font-semibold'
              )}
          >
            {isExchangeOpen ? "مفتوح" : "مغلق"}
          </Badge>
        </div>
        {isExchangeOpen && (
          <div className="flex items-center gap-2">
            <span className="font-semibold text-muted-foreground">السعر:</span>
            <span className="text-primary font-bold">{currentRate.toFixed(2)}</span>
          </div>
        )}
         <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold text-muted-foreground">وقت السيرفر:</span>
            <span className="text-primary font-bold">{serverTime.toLocaleTimeString('en-US').replace('AM', 'ص').replace('PM', 'م')}</span>
        </div>
      </div>

      <div className="flex-1" />
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
    </header>
  );
}
