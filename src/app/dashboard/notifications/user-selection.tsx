"use client";

import React from 'react';
import type { User } from '@/lib/types';
import Image from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { BellOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export function UserSelection({ users, onUserSelect }: { users: User[], onUserSelect: (user: User) => void }) {
    const avatar = PlaceHolderImages.find(p => p.id === 'user-avatar');

    if (users.length === 0) {
        return <p className="text-center text-sm text-muted-foreground py-4">لا يوجد مستخدمون لعرضهم.</p>
    }

  return (
    <TooltipProvider>
        <ScrollArea className="h-96">
        <div className="space-y-2 pr-4">
            {users.map((user) => {
            const canReceiveNotifications = user.fcmTokens && Object.keys(user.fcmTokens).length > 0;
            const buttonContent = (
                <button
                    key={user.id}
                    onClick={() => canReceiveNotifications && onUserSelect(user)}
                    disabled={!canReceiveNotifications}
                    className={cn(
                        "w-full text-right p-3 rounded-lg hover:bg-accent transition-colors flex items-center gap-3",
                        !canReceiveNotifications && "opacity-50 cursor-not-allowed"
                    )}
                >
                    {avatar && (
                    <Image
                        src={avatar.imageUrl}
                        width={40}
                        height={40}
                        alt="Avatar"
                        className="rounded-full"
                        data-ai-hint={avatar.imageHint}
                    />
                    )}
                    <div className="flex-1">
                    <p className="font-semibold text-sm">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.phone}</p>
                    </div>
                    {!canReceiveNotifications && (
                        <BellOff className="h-4 w-4 text-muted-foreground" />
                    )}
                </button>
            );

            if (!canReceiveNotifications) {
                return (
                    <Tooltip key={user.id}>
                        <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
                        <TooltipContent>
                            <p>هذا المستخدم لم يسجل جهازه لتلقي الإشعارات.</p>
                        </TooltipContent>
                    </Tooltip>
                );
            }

            return buttonContent;
            })}
        </div>
        </ScrollArea>
    </TooltipProvider>
  );
}
