"use client";

import React, { useState } from 'react';
import { Smartphone, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface NotificationPreviewProps {
  title: string;
  body: string;
  imageUrl?: string;
}

const MacOSNotification = ({ title, body, imageUrl }: NotificationPreviewProps) => (
  <div className="bg-gray-800 bg-opacity-90 backdrop-blur-sm text-white p-3 rounded-lg w-80 shadow-lg border border-gray-700">
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 bg-blue-500 rounded-md flex items-center justify-center text-xs font-bold">C</div>
      <p className="font-semibold text-sm">كاشيات</p>
    </div>
    <div className="mt-2 text-right">
      <p className="font-bold text-sm">{title || "عنوان الإشعار"}</p>
      <p className="text-xs">{body || "هذا هو نص الإشعار الذي سيظهر للمستخدم."}</p>
    </div>
    {imageUrl && <img src={imageUrl} alt="Preview" className="mt-2 rounded-md w-full max-h-40 object-cover" />}
  </div>
);

const WindowsNotification = ({ title, body, imageUrl }: NotificationPreviewProps) => (
    <div className="bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 p-4 rounded-lg w-80 shadow-lg border border-gray-300 dark:border-gray-700">
        <div className="flex justify-between items-center">
            <p className="font-semibold text-sm">كاشيات</p>
            <p className="text-xs text-gray-500">الآن</p>
        </div>
        <div className="mt-2 text-right">
            <p className="font-bold">{title || "عنوان الإشعار"}</p>
            <p className="text-sm">{body || "هذا هو نص الإشعار الذي سيظهر للمستخدم."}</p>
        </div>
        {imageUrl && <img src={imageUrl} alt="Preview" className="mt-3 rounded w-full max-h-40 object-cover" />}
    </div>
);


export function NotificationPreview({ title, body, imageUrl }: NotificationPreviewProps) {
  const [view, setView] = useState<'mobile' | 'desktop'>('mobile');
  const [isIOS, setIsIOS] = useState(false);

  const mockTitle = title || "عنوان الإشعار";
  const mockBody = body || "هذا هو نص الإشعار الذي سيظهر للمستخدم.";

  return (
    <div className="w-full">
        <div className="flex justify-center items-center gap-4 mb-4 border-b pb-4">
            <button
                onClick={() => setView('mobile')}
                className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-md transition-colors",
                    view === 'mobile' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                )}
            >
                <Smartphone size={18} />
                <span>الهاتف</span>
            </button>
            <button
                onClick={() => setView('desktop')}
                className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-md transition-colors",
                    view === 'desktop' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                )}
            >
                <Monitor size={18} />
                <span>الحاسوب</span>
            </button>
      </div>

      <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-900 min-h-[450px] flex items-center justify-center relative overflow-hidden">
        {view === 'mobile' && (
            <div className="relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-800 border-[14px] rounded-[2.5rem] h-[600px] w-[300px]">
                <div className="h-[32px] w-[3px] bg-gray-800 dark:bg-gray-800 absolute -start-[17px] top-[72px] rounded-s-lg"></div>
                <div className="h-[46px] w-[3px] bg-gray-800 dark:bg-gray-800 absolute -start-[17px] top-[124px] rounded-s-lg"></div>
                <div className="h-[46px] w-[3px] bg-gray-800 dark:bg-gray-800 absolute -start-[17px] top-[178px] rounded-s-lg"></div>
                <div className="h-[64px] w-[3px] bg-gray-800 dark:bg-gray-800 absolute -end-[17px] top-[142px] rounded-e-lg"></div>
                <div className="rounded-[2rem] overflow-hidden w-full h-full bg-white dark:bg-gray-800">
                    <div className="flex justify-center pt-4 mb-4">
                        <div className="flex items-center space-x-2">
                            <Label htmlFor="ios-mode">Android</Label>
                            <Switch id="ios-mode" checked={isIOS} onCheckedChange={setIsIOS} />
                            <Label htmlFor="ios-mode">iOS</Label>
                        </div>
                    </div>

                    {/* iOS Notification */}
                    {isIOS && (
                         <div className="px-2">
                             <div className="bg-white bg-opacity-80 backdrop-blur-md rounded-2xl p-3 shadow-md w-full">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">C</div>
                                    <div className="flex-1 text-right">
                                        <p className="font-semibold text-sm text-black">كاشيات</p>
                                        <p className="font-bold text-sm text-black">{mockTitle}</p>
                                        <p className="text-sm text-black">{mockBody}</p>
                                    </div>
                                    <p className="text-xs text-gray-500">الآن</p>
                                </div>
                                {imageUrl && <img src={imageUrl} alt="Preview" className="mt-2 rounded-lg w-full" />}
                            </div>
                         </div>
                    )}

                    {/* Android Notification */}
                    {!isIOS && (
                        <div className="px-2">
                            <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-3 w-full">
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">C</div>
                                    <p className="text-xs font-semibold dark:text-white">كاشيات</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">· الآن</p>
                                </div>
                                <div className="mt-1 text-right">
                                    <p className="font-bold text-sm dark:text-white">{mockTitle}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">{mockBody}</p>
                                </div>
                                {imageUrl && <img src={imageUrl} alt="Preview" className="mt-2 rounded-md w-full" />}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )}

        {view === 'desktop' && (
             <div className="w-full h-full flex flex-col items-center justify-center bg-gray-300 dark:bg-gray-800 bg-cover bg-center relative" style={{backgroundImage: "url('/img/desktop-bg.svg')"}}>
                 <div className="flex justify-center pt-4 mb-4">
                    <div className="flex items-center space-x-2 bg-slate-200/50 dark:bg-slate-900/50 p-2 rounded-lg">
                        <Label htmlFor="os-mode">Windows</Label>
                        <Switch id="os-mode" checked={isIOS} onCheckedChange={setIsIOS} />
                        <Label htmlFor="os-mode">macOS</Label>
                    </div>
                </div>

                {isIOS && ( // MacOS Preview
                    <div className="absolute top-5">
                       <MacOSNotification title={mockTitle} body={mockBody} imageUrl={imageUrl} />
                    </div>
                )}
                {!isIOS && ( // Windows Preview
                    <div className="absolute bottom-5 right-5">
                       <WindowsNotification title={mockTitle} body={mockBody} imageUrl={imageUrl} />
                    </div>
                )}
             </div>
        )}
      </div>
    </div>
  );
}
