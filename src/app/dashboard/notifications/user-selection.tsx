"use client";

import React from 'react';
import type { User } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface UserSelectionProps {
    users: User[];
    selectedUserIds: string[];
    onToggleUser: (userId: string) => void;
    onToggleAll: () => void;
}

export function UserSelection({ users, selectedUserIds, onToggleUser, onToggleAll }: UserSelectionProps) {
    if (users.length === 0) {
        return <p className="text-center text-sm text-muted-foreground py-4">لا يوجد مستخدمون مشتركون في الإشعارات حالياً.</p>
    }

    const allSelected = users.length > 0 && selectedUserIds.length === users.length;

    return (
        <div className="space-y-4" dir="rtl">
            {/* Header with Select All */}
            <div className="flex items-center justify-between px-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <Checkbox 
                        id="select-all" 
                        checked={allSelected} 
                        onCheckedChange={onToggleAll}
                        className="rounded-md border-slate-300 data-[state=checked]:bg-[#1B69FF]"
                    />
                    <label htmlFor="select-all" className="text-sm font-black text-[#001F3D] cursor-pointer select-none">
                        تحديد الكل ({users.length})
                    </label>
                </div>
                {selectedUserIds.length > 0 && (
                    <Badge className="bg-[#E3F2FD] text-[#1B69FF] hover:bg-[#E3F2FD] border-none font-black text-[10px] px-2.5 py-0.5 rounded-full">
                        {selectedUserIds.length} محدد
                    </Badge>
                )}
            </div>

            {/* Users List */}
            <ScrollArea className="h-96">
                <div className="space-y-1.5 pl-3">
                    {users.map((user) => {
                        const isSelected = selectedUserIds.includes(user.id);
                        return (
                            <div
                                key={user.id}
                                onClick={() => onToggleUser(user.id)}
                                className={cn(
                                    "w-full flex items-center gap-4 p-3.5 rounded-2xl transition-all cursor-pointer border-2",
                                    isSelected 
                                        ? "bg-[#E3F2FD]/30 border-[#1B69FF]/20 shadow-sm" 
                                        : "bg-white border-transparent hover:bg-slate-50"
                                )}
                            >
                                <Checkbox 
                                    id={`user-${user.id}`}
                                    checked={isSelected}
                                    onCheckedChange={() => onToggleUser(user.id)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="rounded-md border-slate-300 data-[state=checked]:bg-[#1B69FF]"
                                />
                                <div className="flex-1 text-right">
                                    <p className="font-black text-sm text-[#001F3D]">{user.name || 'مستخدم بدون اسم'}</p>
                                    <p className="text-[11px] text-slate-400 font-bold tabular-nums mt-0.5">{user.phone}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </ScrollArea>
        </div>
    );
}
