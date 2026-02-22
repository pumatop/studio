"use client";

import React, { useState } from 'react';
import { Smartphone, Monitor, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface NotificationPreviewProps {
  title: string;
  body: string;
  imageUrl?: string;
  type: 'standard' | 'popup' | 'banner';
}

// --- Mock Notification Components ---
const StandardNotification = ({ title, body, imageUrl, isIOS }: { title: string, body: string, imageUrl?: string, isIOS: boolean }) => (
    isIOS ? (
        <div className="px-2">
             <div className="bg-white bg-opacity-80 backdrop-blur-md rounded-2xl p-3 shadow-md w-full">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">C</div>
                    <div className="flex-1 text-right">
                        <p className="font-semibold text-sm text-black">كاشيات</p>
                        <p className="font-bold text-sm text-black">{title}</p>
                        <p className="text-sm text-black">{body}</p>
                    </div>
                    <p className="text-xs text-gray-500">الآن</p>
                </div>
                {imageUrl && <img src={imageUrl} alt="Preview" className="mt-2 rounded-lg w-full" />}
            </div>
        </div>
    ) : (
        <div className="px-2">
            <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-3 w-full">
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">C</div>
                    <p className="text-xs font-semibold dark:text-white">كاشيات</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">· الآن</p>
                </div>
                <div className="mt-1 text-right">
                    <p className="font-bold text-sm dark:text-white">{title}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{body}</p>
                </div>
                {imageUrl && <img src={imageUrl} alt="Preview" className="mt-2 rounded-md w-full" />}
            </div>
        </div>
    )
);

const PopupNotification = ({ title, body, imageUrl }: { title: string, body: string, imageUrl?: string }) => (
    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center z-20">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-11/12 max-w-sm mx-auto p-4 text-center">
            <AlertCircle className="h-12 w-12 text-blue-500 mx-auto" />
            <h3 className="text-lg font-bold mt-3">{title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{body}</p>
            {imageUrl && <img src={imageUrl} alt="Preview" className="mt-4 rounded-md w-full max-h-48 object-contain" />}
            <Button className="mt-4 w-full">حسناً</Button>
        </div>
    </div>
);

const BannerNotification = ({ title, body }: { title: string, body: string }) => (
    <div className="absolute top-0 left-0 right-0 bg-blue-500 text-white p-3 text-center z-20 shadow-lg">
        <p className="font-bold text-sm">{title}</p>
        <p className="text-xs">{body}</p>
    </div>
);
// --- End Mock Notification Components ---

export function NotificationPreview({ title, body, imageUrl, type }: NotificationPreviewProps) {
  const [view, setView] = useState<'mobile' | 'desktop'>('mobile');
  const [isIOS, setIsIOS] = useState(false);

  const mockTitle = title || "عنوان الإشعار";
  const mockBody = body || "هذا هو نص الإشعار الذي سيظهر للمستخدم.";

  const renderMobilePreview = () => {
      switch(type) {
          case 'popup':
            return <PopupNotification title={mockTitle} body={mockBody} imageUrl={imageUrl} />;
          case 'banner':
             return <BannerNotification title={mockTitle} body={mockBody} />;
          case 'standard':
          default:
            return <StandardNotification title={mockTitle} body={mockBody} imageUrl={imageUrl} isIOS={isIOS} />;
      }
  }

  return (
    <div className="w-full">
        <div className="flex justify-center items-center gap-4 mb-4 border-b pb-4">
            <button onClick={() => setView('mobile')} className={cn("flex items-center gap-2 px-4 py-2 rounded-md transition-colors", view === 'mobile' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent')}><Smartphone size={18} /><span>الهاتف</span></button>
            <button onClick={() => setView('desktop')} className={cn("flex items-center gap-2 px-4 py-2 rounded-md transition-colors", view === 'desktop' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent')}><Monitor size={18} /><span>الحاسوب</span></button>
        </div>

      <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-900 min-h-[620px] flex items-center justify-center relative overflow-hidden">
        {/* Common UI for Mobile/Desktop Switchers */}
        {(view === 'mobile' && type === 'standard') && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 flex items-center space-x-2 bg-slate-200/50 dark:bg-slate-900/50 p-2 rounded-lg">
                <Label htmlFor="ios-mode">Android</Label>
                <Switch id="ios-mode" checked={isIOS} onCheckedChange={setIsIOS} />
                <Label htmlFor="ios-mode">iOS</Label>
            </div>
        )}
         {(view === 'desktop' && type === 'standard') && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 flex items-center space-x-2 bg-slate-200/50 dark:bg-slate-900/50 p-2 rounded-lg">
                <Label htmlFor="os-mode">Windows</Label>
                <Switch id="os-mode" checked={isIOS} onCheckedChange={setIsIOS} />
                <Label htmlFor="os-mode">macOS</Label>
            </div>
        )}

        {/* Mobile View */}
        {view === 'mobile' && (
            <div className="relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-800 border-[14px] rounded-[2.5rem] h-[600px] w-[300px]">
                <div className="h-[32px] w-[3px] bg-gray-800 dark:bg-gray-800 absolute -start-[17px] top-[72px] rounded-s-lg"></div>
                <div className="h-[46px] w-[3px] bg-gray-800 dark:bg-gray-800 absolute -start-[17px] top-[124px] rounded-s-lg"></div>
                <div className="h-[46px] w-[3px] bg-gray-800 dark:bg-gray-800 absolute -start-[17px] top-[178px] rounded-s-lg"></div>
                <div className="h-[64px] w-[3px] bg-gray-800 dark:bg-gray-800 absolute -end-[17px] top-[142px] rounded-e-lg"></div>
                <div className="rounded-[2rem] overflow-hidden w-full h-full bg-white dark:bg-gray-800 relative flex items-start pt-16 justify-center">
                    {renderMobilePreview()}
                </div>
            </div>
        )}

        {/* Desktop View */}
        {view === 'desktop' && (
             <div className="w-full h-[550px] flex flex-col items-center justify-center bg-gray-300 dark:bg-gray-800 bg-cover bg-center relative rounded-xl shadow-lg" style={{backgroundImage: "url('/img/desktop-bg.svg')"}}>
                {type === 'standard' && isIOS && ( // MacOS Preview
                    <div className="absolute top-14"><StandardNotification title={mockTitle} body={mockBody} imageUrl={imageUrl} isIOS={true} /></div>
                )}
                {type === 'standard' && !isIOS && ( // Windows Preview
                    <div className="absolute bottom-5 right-5"><StandardNotification title={mockTitle} body={mockBody} imageUrl={imageUrl} isIOS={false} /></div>
                )}
                 {type === 'popup' && <PopupNotification title={mockTitle} body={mockBody} imageUrl={imageUrl} />}
                 {type === 'banner' && <BannerNotification title={mockTitle} body={mockBody} />}
             </div>
        )}
      </div>
    </div>
  );
}
