"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRtdbList } from "@/firebase";
import type { User, Supervisor, Transaction } from "@/lib/types";
import { Users, UserCog, ReceiptText, Search } from "lucide-react";
import { Skeleton } from "./ui/skeleton";

export function GlobalSearch({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: users, isLoading: usersLoading } = useRtdbList<User>(open ? '/users' : null);
  const { data: supervisors, isLoading: supervisorsLoading } = useRtdbList<Supervisor>(open ? '/supervisors' : null);
  const { data: transactions, isLoading: transactionsLoading } = useRtdbList<Transaction>(open ? '/transactions' : null);

  const isLoading = usersLoading || supervisorsLoading || transactionsLoading;

  const searchResults = useMemo(() => {
    if (!query) {
      return { users: [], supervisors: [], transactions: [] };
    }

    const lowerCaseQuery = query.toLowerCase();

    const filteredUsers = (users || []).filter(
      (user) =>
        user.name.toLowerCase().includes(lowerCaseQuery) ||
        user.phone.includes(lowerCaseQuery)
    ).slice(0, 5);

    const filteredSupervisors = (supervisors || []).filter(
      (supervisor) =>
        supervisor.name.toLowerCase().includes(lowerCaseQuery) ||
        supervisor.phone.includes(lowerCaseQuery)
    ).slice(0, 5);

    const filteredTransactions = (transactions || []).filter(
      (transaction) => transaction.id.toLowerCase().includes(lowerCaseQuery)
    ).slice(0, 5);

    return {
      users: filteredUsers,
      supervisors: filteredSupervisors,
      transactions: filteredTransactions,
    };
  }, [query, users, supervisors, transactions]);

  const handleSelect = (path: string) => {
    router.push(path);
    onOpenChange(false);
  };

  useEffect(() => {
    if (!open) {
      setQuery('');
    } else {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  const hasResults = searchResults.users.length > 0 || searchResults.supervisors.length > 0 || searchResults.transactions.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
        <div className="relative p-4">
            <Search className="absolute right-7 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث في المستخدمين، المشرفين، المعاملات..."
              className="h-12 text-lg pr-12"
            />
        </div>
        <div className="border-t">
          {isLoading && query && (
             <div className="p-4 space-y-4">
                <Skeleton className="h-8 w-1/4 mb-2" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-8 w-1/4 mt-4 mb-2" />
                <Skeleton className="h-10 w-full" />
             </div>
          )}
          {!isLoading && query && !hasResults && (
            <div className="p-10 text-center text-muted-foreground">
              <p>لا توجد نتائج بحث لـ "{query}"</p>
            </div>
          )}
          {hasResults && (
            <ScrollArea className="h-[50vh]">
                <div className="p-2 space-y-2">
                  {searchResults.users.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold text-muted-foreground px-2 py-1 flex items-center gap-2"><Users size={14}/> المستخدمون</h3>
                      <div className="space-y-1">
                        {searchResults.users.map(user => (
                          <div key={user.id} onClick={() => handleSelect('/dashboard/users')} className="p-2 rounded-md hover:bg-accent cursor-pointer">
                            <p className="font-medium text-sm">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.phone}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {searchResults.supervisors.length > 0 && (
                     <div>
                      <h3 className="text-xs font-semibold text-muted-foreground px-2 py-1 flex items-center gap-2"><UserCog size={14}/> المشرفون</h3>
                      <div className="space-y-1">
                        {searchResults.supervisors.map(supervisor => (
                          <div key={supervisor.id} onClick={() => handleSelect(`/dashboard/supervisors/${supervisor.id}/log`)} className="p-2 rounded-md hover:bg-accent cursor-pointer">
                            <p className="font-medium text-sm">{supervisor.name}</p>
                            <p className="text-xs text-muted-foreground">{supervisor.phone}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {searchResults.transactions.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold text-muted-foreground px-2 py-1 flex items-center gap-2"><ReceiptText size={14}/> المعاملات</h3>
                      <div className="space-y-1">
                        {searchResults.transactions.map(transaction => (
                          <div key={transaction.id} onClick={() => handleSelect('/dashboard/audit-log')} className="p-2 rounded-md hover:bg-accent cursor-pointer">
                            <p className="font-mono text-xs">{transaction.id}</p>
                            <p className="text-xs text-muted-foreground">
                                {new Date(transaction.timestamp).toLocaleString("ar-EG", { dateStyle: 'short', timeStyle: 'short' })}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
