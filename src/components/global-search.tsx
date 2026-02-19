"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useRtdbList } from "@/firebase";
import type { User, Supervisor, Transaction, RechargePurchaseTransaction, AccountTransferTransaction, EgyptTransferTransaction } from "@/lib/types";
import { 
    Users, UserCog, ReceiptText, Search, LayoutDashboard, 
    ArrowRightLeft, PiggyBank, BrainCircuit, History, Settings, FileSearch 
} from "lucide-react";
import { Skeleton } from "./ui/skeleton";

const searchablePages = [
  { group: 'الصفحات', title: 'لوحة التحكم', href: '/dashboard', icon: LayoutDashboard },
  { group: 'الصفحات', title: 'سعر الصرف', href: '/dashboard/exchange-rate', icon: ArrowRightLeft },
  { group: 'الصفحات', title: 'المستخدمين', href: '/dashboard/users', icon: Users },
  { group: 'الصفحات', title: 'المشرفين والمندوبين', href: '/dashboard/supervisors', icon: UserCog },
  { group: 'الصفحات', title: 'حصالة الفكة', href: '/dashboard/fakka-log', icon: PiggyBank },
  { group: 'الصفحات', title: 'تقارير الذكاء الاصطناعي', href: '/dashboard/reports', icon: BrainCircuit },
  { group: 'الصفحات', title: 'سجل التدقيق', href: '/dashboard/audit-log', icon: History },
  { group: 'الصفحات', title: 'الإعدادات', href: '/dashboard/settings', icon: Settings },
  { group: 'المعاملات', title: 'التحويل من دينار لدينار (DD)', href: '/dashboard/transfers/dd', icon: ReceiptText },
  { group: 'المعاملات', title: 'التحويل من دينار لجنيه (DG)', href: '/dashboard/dg-transfers', icon: ReceiptText },
  { group: 'المعاملات', title: 'شراء الكروت (DC)', href: '/dashboard/card-transactions', icon: ReceiptText },
  { group: 'المعاملات', title: 'تحويل محفظة كاش (EC)', href: '/dashboard/transfers/ec', icon: ReceiptText },
  { group: 'المعاملات', title: 'تحويل انستاباي (EI)', href: '/dashboard/transfers/ei', icon: ReceiptText },
  { group: 'المعاملات', title: 'وصلي للبيت (EW)', href: '/dashboard/transfers/ew', icon: ReceiptText },
];

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: users, isLoading: usersLoading } = useRtdbList<User>(open ? '/users' : null);
  const { data: supervisors, isLoading: supervisorsLoading } = useRtdbList<Supervisor>(open ? '/supervisors' : null);
  const { data: transactions, isLoading: transactionsLoading } = useRtdbList<Transaction>(open ? '/transactions' : null);

  const isLoading = usersLoading || supervisorsLoading || transactionsLoading;

  const searchResults = useMemo(() => {
    if (!query) {
      return { pages: [], users: [], supervisors: [], transactions: [] };
    }

    const lowerCaseQuery = query.toLowerCase();

    const filteredPages = searchablePages.filter(
      (page) => page.title.toLowerCase().includes(lowerCaseQuery)
    );

    const filteredUsers = (users || []).filter(
      (user) =>
        (user.name && user.name.toLowerCase().includes(lowerCaseQuery)) ||
        (user.phone && user.phone.includes(lowerCaseQuery))
    ).slice(0, 5);

    const filteredSupervisors = (supervisors || []).filter(
      (supervisor) =>
        (supervisor.name && supervisor.name.toLowerCase().includes(lowerCaseQuery)) ||
        (supervisor.phone && supervisor.phone.includes(lowerCaseQuery))
    ).slice(0, 5);

    const filteredTransactions = (transactions || []).filter(
      (transaction) => {
        if (transaction.id.toLowerCase().includes(lowerCaseQuery)) return true;
        
        const castedTransaction = transaction as RechargePurchaseTransaction | AccountTransferTransaction | EgyptTransferTransaction;

        switch (castedTransaction.type) {
          case 'recharge_purchase':
            return (castedTransaction.userName && castedTransaction.userName.toLowerCase().includes(lowerCaseQuery)) ||
                   (castedTransaction.userPhone && castedTransaction.userPhone.includes(lowerCaseQuery));
          case 'account_transfer':
            return (castedTransaction.senderName && castedTransaction.senderName.toLowerCase().includes(lowerCaseQuery)) ||
                   (castedTransaction.senderPhone && castedTransaction.senderPhone.includes(lowerCaseQuery)) ||
                   (castedTransaction.recipientName && castedTransaction.recipientName.toLowerCase().includes(lowerCaseQuery)) ||
                   (castedTransaction.recipientPhone && castedTransaction.recipientPhone.includes(lowerCaseQuery));
          case 'egypt_transfer':
            return (castedTransaction.userName && castedTransaction.userName.toLowerCase().includes(lowerCaseQuery)) ||
                   (castedTransaction.userPhone && castedTransaction.userPhone.includes(lowerCaseQuery)) ||
                   (castedTransaction.recipientName && castedTransaction.recipientName.toLowerCase().includes(lowerCaseQuery)) ||
                   (castedTransaction.recipientNumber && castedTransaction.recipientNumber.includes(lowerCaseQuery));
          default:
            return false;
        }
      }
    ).slice(0, 5);

    return {
      pages: filteredPages,
      users: filteredUsers,
      supervisors: filteredSupervisors,
      transactions: filteredTransactions,
    };
  }, [query, users, supervisors, transactions]);

  const handleSelect = (path: string) => {
    router.push(path);
    setOpen(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery('');
    } else {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  const hasResults = searchResults.pages.length > 0 || searchResults.users.length > 0 || searchResults.supervisors.length > 0 || searchResults.transactions.length > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="relative w-full justify-start rounded-lg bg-muted/30 px-9 text-muted-foreground transition-colors hover:bg-muted/60 md:w-[200px] lg:w-[330px]"
        >
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <span>ابحث...</span>
          <kbd className="pointer-events-none absolute left-3 top-1/2 hidden h-5 -translate-y-1/2 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[330px] lg:w-[450px] p-0" align="start">
        <div className="relative p-4">
            <Search className="absolute right-7 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث في الصفحات، المستخدمين، المعاملات..."
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
            <ScrollArea className="h-[40vh] max-h-[300px]">
                <div className="p-2 space-y-4">
                  {searchResults.pages.length > 0 && (
                     <div>
                      <h3 className="text-xs font-semibold text-muted-foreground px-2 py-1 flex items-center gap-2"><FileSearch size={14}/> الصفحات</h3>
                      <div className="space-y-1">
                        {searchResults.pages.map(page => (
                          <div key={page.href} onClick={() => handleSelect(page.href)} className="p-2 rounded-md hover:bg-accent cursor-pointer flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <page.icon className="h-4 w-4 text-muted-foreground" />
                                <p className="font-medium text-sm">{page.title}</p>
                            </div>
                            <p className="text-xs text-muted-foreground">{page.group}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
      </PopoverContent>
    </Popover>
  );
}
