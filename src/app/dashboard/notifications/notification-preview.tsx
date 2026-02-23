"use client";

import React, { useState } from 'react';
import { Smartphone, Monitor, AlertCircle, ShoppingCart, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

type NotificationType = 'standard' | 'popup' | 'banner' | 'banner-ad' | 'popup-ad' | 'image-only';

interface NotificationPreviewProps {
  title: string;
  body: string;
  imageUrl?: string;
  type: NotificationType;
}

// --- Mock Notification Components ---

// ... (StandardNotification, PopupNotification, BannerNotification remain the same)
const StandardNotification = ({ title, body, imageUrl, isIOS }: { title: string, body: string, imageUrl?: string, isIOS: boolean }) => (
    isIOS ? (
        <div className="px-2"><div className="bg-white bg-opacity-80 backdrop-blur-md rounded-2xl p-3 shadow-md w-full"><div className="flex items-start gap-3"><div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">C</div><div className="flex-1 text-right"><p className="font-semibold text-sm text-black">كاشيات</p><p className="font-bold text-sm text-black">{title}</p><p className="text-sm text-black">{body}</p></div><p className="text-xs text-gray-500">الآن</p></div>{imageUrl && <img src={imageUrl} alt="Preview" className="mt-2 rounded-lg w-full" />}</div></div>
    ) : (
        <div className="px-2"><div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-3 w-full"><div className="flex items-center gap-2"><div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">C</div><p className="text-xs font-semibold dark:text-white">كاشيات</p><p className="text-xs text-gray-500 dark:text-gray-400">· الآن</p></div><div className="mt-1 text-right"><p className="font-bold text-sm dark:text-white">{title}</p><p className="text-sm text-gray-600 dark:text-gray-300">{body}</p></div>{imageUrl && <img src={imageUrl} alt="Preview" className="mt-2 rounded-md w-full" />}</div></div>
    )
);
const PopupNotification = ({ title, body, imageUrl }: { title: string, body: string, imageUrl?: string }) => (<div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center z-20"><div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-11/12 max-w-sm mx-auto p-4 text-center"><AlertCircle className="h-12 w-12 text-blue-500 mx-auto" /><h3 className="text-lg font-bold mt-3">{title}</h3><p className="text-sm text-muted-foreground mt-1">{body}</p>{imageUrl && <img src={imageUrl} alt="Preview" className="mt-4 rounded-md w-full max-h-48 object-contain" />}<Button className="mt-4 w-full">حسناً</Button></div></div>);
const BannerNotification = ({ title, body }: { title: string, body: string }) => (<div className="absolute top-0 left-0 right-0 bg-blue-500 text-white p-3 text-center z-20 shadow-lg"><p className="font-bold text-sm">{title}</p><p className="text-xs">{body}</p></div>);

// --- NEW Ad Mock Components ---
const BannerAd = ({ title, body, imageUrl }: NotificationPreviewProps) => (
    <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-4 z-20 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-4">
            {imageUrl && <img src={imageUrl} alt="Ad" className="h-12 w-12 rounded-md object-cover" />}
            <div>
                <p className="font-bold text-md">{title}</p>
                <p className="text-sm opacity-90">{body}</p>
            </div>
        </div>
        <Button variant="secondary" size="sm">شاهد الآن</Button>
    </div>
);

const PopupAd = ({ title, body, imageUrl }: NotificationPreviewProps) => (
    <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center z-20 p-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-sm mx-auto overflow-hidden">
            {imageUrl && <img src={imageUrl} alt="Ad" className="w-full h-48 object-cover" />}
            <div className="p-6 text-center">
                <h3 className="text-xl font-bold">{title}</h3>
                <p className="text-muted-foreground mt-2">{body}</p>
                <Button className="mt-6 w-full bg-green-500 hover:bg-green-600">
                    <ShoppingCart className="ml-2 h-4 w-4" />
                    اطلب الآن
                </Button>
                <Button variant="link" className="mt-2 text-muted-foreground">لا شكراً</Button>
            </div>
        </div>
    </div>
);

const ImageOnlyAd = ({ imageUrl }: NotificationPreviewProps) => (
    <div className="absolute inset-0 bg-black flex items-center justify-center z-20 p-2">
         {imageUrl ? 
            <img src={imageUrl} alt="Full screen ad" className="w-full h-full object-contain rounded-lg" /> 
            : <div className="text-white text-center">يرجى رفع صورة لعرض هذا الإعلان</div>}
        <Button variant="ghost" size="icon" className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full"><X className="h-5 w-5" /></Button>
    </div>
);

export function NotificationPreview({ title, body, imageUrl, type }: NotificationPreviewProps) {
  const [view, setView] = useState<'mobile' | 'desktop'>('mobile');
  const [isIOS, setIsIOS] = useState(false);

  const mockTitle = title || "عنوان الإشعار/الإعلان";
  const mockBody = body || "هذا هو نص الإشعار الذي سيظهر للمستخدم.";

  const renderPreview = () => {
      switch(type) {
          case 'popup': return <PopupNotification title={mockTitle} body={mockBody} imageUrl={imageUrl} />;
          case 'banner': return <BannerNotification title={mockTitle} body={mockBody} />;
          
          // Ad types
          case 'banner-ad': return <BannerAd title={mockTitle} body={mockBody} imageUrl={imageUrl} type={type} />;
          case 'popup-ad': return <PopupAd title={mockTitle} body={mockBody} imageUrl={imageUrl} type={type} />;
          case 'image-only': return <ImageOnlyAd title={mockTitle} body={mockBody} imageUrl={imageUrl} type={type} />;

          case 'standard':
          default: // Render standard for both mobile and desktop if type is standard
            if (view === 'desktop') {
                 if (isIOS) return <div className="absolute top-14"><StandardNotification title={mockTitle} body={mockBody} imageUrl={imageUrl} isIOS={true} /></div>
                 return <div className="absolute bottom-5 right-5"><StandardNotification title={mockTitle} body={mockBody} imageUrl={imageUrl} isIOS={false} /></div>
            }
            return <StandardNotification title={mockTitle} body={mockBody} imageUrl={imageUrl} isIOS={isIOS} />;
      }
  }

  return (
    <div className="w-full">
        {/* ... (View switcher remains the same) ... */}
        <div className="flex justify-center items-center gap-4 mb-4 border-b pb-4">
            <button onClick={() => setView('mobile')} className={cn("flex items-center gap-2 px-4 py-2 rounded-md transition-colors", view === 'mobile' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent')}><Smartphone size={18} /><span>الهاتف</span></button>
            <button onClick={() => setView('desktop')} className={cn("flex items-center gap-2 px-4 py-2 rounded-md transition-colors", view === 'desktop' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent')}><Monitor size={18} /><span>الحاسوب</span></button>
        </div>

      <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-900 min-h-[620px] flex items-center justify-center relative overflow-hidden">
        {/* OS Switchers (only for standard notifications) */}
        {type === 'standard' && (
             <> 
                {view === 'mobile' && <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 flex items-center space-x-2 bg-slate-200/50 dark:bg-slate-900/50 p-2 rounded-lg"><Label htmlFor="ios-mode">Android</Label><Switch id="ios-mode" checked={isIOS} onCheckedChange={setIsIOS} /><Label htmlFor="ios-mode">iOS</Label></div>}
                {view === 'desktop' && <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 flex items-center space-x-2 bg-slate-200/50 dark:bg-slate-900/50 p-2 rounded-lg"><Label htmlFor="os-mode">Windows</Label><Switch id="os-mode" checked={isIOS} onCheckedChange={setIsIOS} /><Label htmlFor="os-mode">macOS</Label></div>}
             </>
        )}

        {/* Mockups Container */}
        {view === 'mobile' && (
            <div className="relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-800 border-[14px] rounded-[2.5rem] h-[600px] w-[300px]">
                <div className="h-[32px] w-[3px] bg-gray-800 dark:bg-gray-800 absolute -start-[17px] top-[72px] rounded-s-lg"></div><div className="h-[46px] w-[3px] bg-gray-800 dark:bg-gray-800 absolute -start-[17px] top-[124px] rounded-s-lg"></div><div className="h-[46px] w-[3px] bg-gray-800 dark:bg-gray-800 absolute -start-[17px] top-[178px] rounded-s-lg"></div><div className="h-[64px] w-[3px] bg-gray-800 dark:bg-gray-800 absolute -end-[17px] top-[142px] rounded-e-lg"></div>
                <div className="rounded-[2rem] overflow-hidden w-full h-full bg-white dark:bg-gray-800 relative flex items-start pt-16 justify-center">
                    {renderPreview()}
                </div>
            </div>
        )}
        {view === 'desktop' && (
             <div className="w-full h-[550px] flex flex-col items-center justify-center bg-gray-300 dark:bg-gray-800 bg-cover bg-center relative rounded-xl shadow-lg" style={{backgroundImage: "url('/img/desktop-bg.svg')"}}>
                {renderPreview()}
             </div>
        )}
      </div>
    </div>
  );
}
