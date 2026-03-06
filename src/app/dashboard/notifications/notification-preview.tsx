
"use client";

import React, { useState } from 'react';
import { Smartphone, Monitor, AlertCircle, ShoppingCart, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { NotificationTypeSelector } from './notification-type-selector';

type NotificationType = 'standard' | 'popup' | 'banner' | 'banner-ad' | 'popup-ad' | 'image-only';

interface NotificationPreviewProps {
  title: string;
  body: string;
  imageUrl?: string;
  type: NotificationType;
}

// --- Mock Notification Components ---

const StandardNotification = ({ title, body, imageUrl, isIOS }: { title: string, body: string, imageUrl?: string, isIOS: boolean }) => (
    isIOS ? (
        <div className="px-2 w-full animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl p-3 shadow-md w-full">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white font-black">C</div>
                    <div className="flex-1 text-right">
                        <p className="font-black text-xs text-black/40 dark:text-white/40 uppercase tracking-tighter">حولّي كاش</p>
                        <p className="font-black text-sm text-black dark:text-white">{title}</p>
                        <p className="text-xs text-black/80 dark:text-white/80 font-medium leading-tight">{body}</p>
                    </div>
                    <p className="text-[10px] font-bold text-gray-500">الآن</p>
                </div>
                {imageUrl && <img src={imageUrl} alt="Preview" className="mt-2 rounded-lg w-full aspect-video object-cover" />}
            </div>
        </div>
    ) : (
        <div className="px-2 w-full animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="bg-[#f0f0f0] dark:bg-slate-700/90 backdrop-blur-sm rounded-2xl p-4 w-full shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center text-white text-[10px] font-black">C</div>
                    <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">حولّي كاش</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">· الآن</p>
                </div>
                <div className="mt-1 text-right space-y-0.5">
                    <p className="font-black text-sm text-[#001F3D] dark:text-foreground">{title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-bold leading-relaxed">{body}</p>
                </div>
                {imageUrl && <img src={imageUrl} alt="Preview" className="mt-3 rounded-xl w-full aspect-video object-cover" />}
            </div>
        </div>
    )
);

const PopupNotification = ({ title, body, imageUrl }: { title: string, body: string, imageUrl?: string }) => (
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-20 animate-in fade-in duration-300">
        <div className="bg-card dark:bg-slate-800 rounded-[2.5rem] shadow-2xl w-[85%] mx-auto p-6 text-center border-none">
            <div className="p-4 bg-primary/10 rounded-full w-fit mx-auto mb-4">
                <AlertCircle className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-lg font-black text-[#001F3D] dark:text-foreground">{title}</h3>
            <p className="text-sm font-bold text-slate-400 mt-2 leading-relaxed">{body}</p>
            {imageUrl && <img src={imageUrl} alt="Preview" className="mt-4 rounded-2xl w-full max-h-40 object-cover border border-slate-100 dark:border-white/5" />}
            <Button className="mt-6 w-full rounded-2xl h-12 font-black bg-primary shadow-lg shadow-primary/20">حسناً، فهمت</Button>
        </div>
    </div>
);

const BannerNotification = ({ title, body }: { title: string, body: string }) => (
    <div className="absolute top-12 left-2 right-2 bg-primary text-white p-4 rounded-2xl text-center z-20 shadow-xl shadow-primary/20 animate-in slide-in-from-top-full duration-500">
        <p className="font-black text-sm">{title}</p>
        <p className="text-[10px] font-bold opacity-90">{body}</p>
    </div>
);

const BannerAd = ({ title, body, imageUrl }: NotificationPreviewProps) => (
    <div className="absolute top-12 left-2 right-2 bg-gradient-to-r from-[#1B69FF] to-[#004ABB] text-white p-4 rounded-2xl z-20 shadow-xl flex items-center justify-between animate-in slide-in-from-top-full duration-500">
        <div className="flex items-center gap-3">
            {imageUrl && <img src={imageUrl} alt="Ad" className="h-10 w-10 rounded-xl object-cover border border-white/20" />}
            <div className="text-right">
                <p className="font-black text-xs">{title}</p>
                <p className="text-[10px] font-medium opacity-80">{body}</p>
            </div>
        </div>
        <Button variant="secondary" size="sm" className="h-8 rounded-lg text-[10px] font-black px-3">عرض الآن</Button>
    </div>
);

const PopupAd = ({ title, body, imageUrl }: NotificationPreviewProps) => (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-20 p-4 animate-in fade-in duration-300">
        <div className="bg-card dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-[260px] mx-auto overflow-hidden">
            {imageUrl && <img src={imageUrl} alt="Ad" className="w-full h-36 object-cover" />}
            <div className="p-6 text-center space-y-2">
                <h3 className="text-md font-black text-[#001F3D] dark:text-foreground">{title}</h3>
                <p className="text-[10px] font-bold text-slate-400 leading-relaxed">{body}</p>
                <Button className="mt-4 w-full h-11 rounded-xl bg-[#32CCAA] hover:bg-[#32CCAA]/90 text-white font-black text-xs gap-2">
                    <ShoppingCart className="h-3.5 w-3.5" />
                    اطلب العرض
                </Button>
                <button className="text-[9px] font-black text-slate-300 dark:text-slate-500 uppercase tracking-widest pt-2">تخطي الإعلان</button>
            </div>
        </div>
    </div>
);

const ImageOnlyAd = ({ imageUrl }: NotificationPreviewProps) => (
    <div className="absolute inset-0 bg-black flex items-center justify-center z-20 p-2 animate-in zoom-in-95 duration-500">
         {imageUrl ? 
            <img src={imageUrl} alt="Full screen ad" className="w-full h-full object-contain rounded-[1.5rem]" /> 
            : <div className="text-white/40 text-center font-black text-xs italic">يرجى رفع صورة لمعاينة الإعلان</div>}
        <Button variant="ghost" size="icon" className="absolute top-6 right-6 bg-black/50 hover:bg-black/70 text-white rounded-full h-10 w-10 border border-white/10"><X className="h-5 w-5" /></Button>
    </div>
);

export function NotificationPreview({ title, body, imageUrl, type }: NotificationPreviewProps) {
  const [isIOS, setIsIOS] = useState(false);

  const mockTitle = title || "عنوان الإشعار القادم";
  const mockBody = body || "هنا سيظهر نص الرسالة التي سيتلقاها المستخدمون على هواتفهم.";

  const renderPreview = () => {
      switch(type) {
          case 'popup': return <PopupNotification title={mockTitle} body={mockBody} imageUrl={imageUrl} />;
          case 'banner': return <BannerNotification title={mockTitle} body={mockBody} />;
          case 'banner-ad': return <BannerAd title={mockTitle} body={mockBody} imageUrl={imageUrl} type={type} />;
          case 'popup-ad': return <PopupAd title={mockTitle} body={mockBody} imageUrl={imageUrl} type={type} />;
          case 'image-only': return <ImageOnlyAd title={mockTitle} body={mockBody} imageUrl={imageUrl} type={type} />;
          case 'standard':
          default:
            return <StandardNotification title={mockTitle} body={mockBody} imageUrl={imageUrl} isIOS={isIOS} />;
      }
  }

  return (
    <div className="w-full">
        {/* OS Switcher */}
        <div className="flex justify-center items-center gap-3 mb-6 border-b dark:border-white/5 border-slate-50 pb-6">
            <button 
                onClick={() => setIsIOS(false)} 
                className={cn(
                    "flex items-center gap-2.5 px-6 py-2.5 rounded-2xl font-black text-xs transition-all", 
                    !isIOS ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                )}
            >
                <div className={cn("p-1 rounded-md", !isIOS ? "bg-white/20" : "bg-slate-200 dark:bg-slate-700")}>
                    <Smartphone size={14} />
                </div>
                Android
            </button>
            <button 
                onClick={() => setIsIOS(true)} 
                className={cn(
                    "flex items-center gap-2.5 px-6 py-2.5 rounded-2xl font-black text-xs transition-all", 
                    isIOS ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                )}
            >
                <div className={cn("p-1 rounded-md", isIOS ? "bg-white/20" : "bg-slate-200 dark:bg-slate-700")}>
                    <Smartphone size={14} />
                </div>
                iOS (iPhone)
            </button>
        </div>

      <div className="p-4 rounded-[3rem] bg-slate-50 dark:bg-slate-900/50 min-h-[620px] flex items-center justify-center relative overflow-hidden border-2 border-dashed border-slate-200/50 dark:border-white/5">
        
        {/* Mobile Mockup */}
        <div className="relative mx-auto border-slate-800 dark:border-slate-950 bg-slate-800 border-[12px] rounded-[3.5rem] h-[580px] w-[280px] shadow-2xl transition-all duration-500">
            {/* Speaker/Notch Area */}
            <div className="h-[24px] w-[100px] bg-slate-800 dark:bg-slate-950 absolute top-0 left-1/2 -translate-x-1/2 rounded-b-2xl z-30"></div>
            
            {/* Buttons UI */}
            <div className="h-[32px] w-[3px] bg-slate-800 dark:bg-slate-950 absolute -start-[15px] top-[72px] rounded-s-lg"></div>
            <div className="h-[46px] w-[3px] bg-slate-800 dark:bg-slate-950 absolute -start-[15px] top-[124px] rounded-s-lg"></div>
            <div className="h-[64px] w-[3px] bg-slate-800 dark:bg-slate-950 absolute -end-[15px] top-[142px] rounded-e-lg"></div>
            
            {/* Screen Content */}
            <div className="rounded-[2.8rem] overflow-hidden w-full h-full bg-white dark:bg-slate-900 relative flex items-start pt-16 justify-center bg-cover bg-center" style={{backgroundImage: "url('https://picsum.photos/seed/phone/600/1200')"}}>
                {/* Overlay to dim wallpaper */}
                <div className="absolute inset-0 bg-black/10"></div>
                
                {/* Actual Notification Preview */}
                <div className="relative z-10 w-full flex flex-col items-center">
                    {renderPreview()}
                </div>
            </div>
        </div>
      </div>

      <div className="mt-10">
        <NotificationTypeSelector />
      </div>
    </div>
  );
}
