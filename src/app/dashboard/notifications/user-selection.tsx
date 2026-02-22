"use client";

import React from 'react';
import type { User } from '@/lib/types';
import Image from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export function UserSelection({ users, onUserSelect }: { users: User[], onUserSelect: (user: User) => void }) {
    const avatar = PlaceHolderImages.find(p => p.id === 'user-avatar');

    if (users.length === 0) {
        return <p className="text-center text-sm text-muted-foreground py-4">لا يوجد مستخدمون مشتركون في الإشعارات حالياً.</p>
    }

  return (
    <ScrollArea className="h-96">
        <div className="space-y-2 pr-4">
            {users.map((user) => (
                <button
                    key={user.id}
                    onClick={() => onUserSelect(user)}
                    className="w-full text-right p-3 rounded-lg hover:bg-accent transition-colors flex items-center gap-3"
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
                </button>
            ))}
        </div>
    </ScrollArea>
  );
}
