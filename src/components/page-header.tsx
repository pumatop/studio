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
import { LogOut, User as UserIcon } from "lucide-react";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import type { ImagePlaceholder } from "@/lib/placeholder-images";

export function PageHeader({ title }: { title: string }) {
  const router = useRouter();
  const avatar = PlaceHolderImages.find(
    (img) => img.id === "user-avatar"
  ) as ImagePlaceholder;

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-2">
      <SidebarTrigger className="sm:hidden" />
      <h1 className="text-xl font-semibold">{title}</h1>
      <div className="flex-1" />
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
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <UserIcon className="w-4 h-4 mr-2" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push("/")}>
            <LogOut className="w-4 h-4 mr-2" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
