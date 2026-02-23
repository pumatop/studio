"use client";

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const notificationTypeGroups = [
    {
        groupName: "الإشعارات القياسية",
        types: [
            { id: 'standard', name: 'عادي', description: 'إشعار نظام قياسي يظهر في درج الإشعارات.' },
            { id: 'popup', name: 'نافذة منبثقة', description: 'رسالة تنبيهية تظهر فوق محتوى التطبيق.' },
            { id: 'banner', name: 'شريط علوي', description: 'شريط تنبيه يظهر في أعلى شاشة التطبيق.' },
        ]
    },
    {
        groupName: "الإعلانات والعروض",
        types: [
            { id: 'banner-ad', name: 'بانر إعلاني', description: 'شريط إعلاني جذاب بصريًا في الأعلى.' },
            { id: 'popup-ad', name: 'إعلان منبثق', description: 'نافذة إعلانية بارزة مع صورة وزر دعوة لاتخاذ إجراء (CTA).' },
            { id: 'image-only', name: 'إعلان صورة فقط', description: 'إعلان بملء الشاشة يركز بشكل كامل على الصورة.' },
        ]
    }
];

// Mini-previews for each notification type
const MiniPreview = ({ type }: { type: string }) => {
    const baseClasses = "w-full h-24 rounded-md border bg-gray-200 dark:bg-gray-800 p-2 flex flex-col items-center justify-center relative overflow-hidden";

    switch(type) {
        case 'standard':
            return (
                <div className={baseClasses}>
                    <div className="w-11/12 bg-white/80 dark:bg-black/50 backdrop-blur-sm rounded-md p-1.5 shadow-md">
                        <div className="flex items-center gap-1">
                            <div className="w-4 h-4 bg-blue-500 rounded-full flex-shrink-0"></div>
                            <div className="flex-1 text-right w-full">
                                <div className="h-2 w-10/12 bg-gray-600 dark:bg-gray-400 rounded-sm mb-1"></div>
                                <div className="h-1.5 w-full bg-gray-500 dark:bg-gray-500 rounded-sm"></div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        case 'popup':
            return (
                <div className={baseClasses}>
                     <div className="absolute inset-0 bg-black/30"></div>
                     <div className="relative w-9/12 bg-white dark:bg-gray-700 rounded-lg shadow-xl p-2 text-center">
                        <AlertCircle className="h-4 w-4 text-blue-500 mx-auto" />
                        <div className="h-2 w-8/12 bg-gray-600 dark:bg-gray-400 rounded-sm mt-1 mx-auto"></div>
                        <div className="h-1.5 w-10/12 bg-gray-500 dark:bg-gray-500 rounded-sm mt-1 mx-auto"></div>
                        <div className="h-4 w-full bg-blue-500 rounded-md mt-2"></div>
                     </div>
                </div>
            );
        case 'banner':
             return (
                <div className={baseClasses}>
                     <div className="absolute top-0 left-0 right-0 bg-blue-500 text-white p-1 text-center shadow-lg">
                        <div className="h-1.5 w-8/12 bg-white/50 rounded-sm mx-auto"></div>
                     </div>
                </div>
            );
        case 'banner-ad':
             return (
                <div className={baseClasses}>
                     <div className="absolute top-0 left-0 right-0 bg-indigo-600 p-2 z-10 shadow-xl flex items-center justify-between">
                         <div className="flex items-center gap-1">
                             <div className="h-6 w-6 rounded bg-purple-400"></div>
                             <div className="space-y-1">
                                <div className="h-1.5 w-12 bg-white/80 rounded-sm"></div>
                                <div className="h-1 w-16 bg-white/60 rounded-sm"></div>
                             </div>
                         </div>
                         <div className="h-4 w-8 bg-white/90 rounded-md"></div>
                     </div>
                </div>
            );
        case 'popup-ad':
             return (
                <div className={baseClasses}>
                    <div className="absolute inset-0 bg-black/50"></div>
                     <div className="relative w-10/12 bg-white dark:bg-gray-900 rounded-lg shadow-xl overflow-hidden">
                        <div className="h-8 w-full bg-gray-400 dark:bg-gray-600"></div>
                        <div className="p-2">
                             <div className="h-2 w-8/12 bg-gray-600 dark:bg-gray-400 rounded-sm mx-auto"></div>
                             <div className="h-4 w-full bg-green-500 rounded-md mt-2"></div>
                        </div>
                     </div>
                </div>
            );
        case 'image-only':
            return (
                <div className={cn(baseClasses, "bg-cover bg-center")} style={{backgroundImage: "url('https://images.unsplash.com/photo-1599549341011-39a34934a317?w=100&h=60&fit=crop')"}}>
                     <div className="absolute inset-0 bg-black/20"></div>
                </div>
            );
        default:
            return <div className={baseClasses} />;
    }
}


export function NotificationTypeSelector() {
  const { setValue, watch, formState: { errors } } = useFormContext();
  const selectedType = watch('type');

  return (
     <Card>
        <CardHeader>
            <CardTitle>اختر نوع الإشعار</CardTitle>
            <CardDescription>سيؤثر اختيارك على كيفية ظهور الإشعار للمستخدمين.</CardDescription>
             {errors.type && <p className="text-sm text-red-500 pt-2">{errors.type.message as string}</p>}
        </CardHeader>
        <CardContent>
             {notificationTypeGroups.map(group => (
                <div key={group.groupName} className="mb-6 last:mb-0">
                     <h3 className="text-base font-semibold text-muted-foreground mb-3">{group.groupName}</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {group.types.map((type) => (
                            <div
                                key={type.id}
                                onClick={() => setValue('type', type.id, { shouldValidate: true })}
                                className={cn(
                                    "cursor-pointer transition-all relative rounded-lg border-2",
                                    selectedType === type.id ? 'border-primary ring-2 ring-primary/50' : 'border-transparent hover:border-gray-400 dark:hover:border-gray-600'
                                )}
                            >
                                <MiniPreview type={type.id} />
                                <div className="p-3 bg-card rounded-b-md">
                                    <h4 className="font-semibold text-sm">{type.name}</h4>
                                    <p className="text-xs text-muted-foreground">{type.description}</p>
                                </div>
                                {selectedType === type.id && (
                                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1 shadow-lg">
                                        <CheckCircle className="h-4 w-4" />
                                    </div>
                                )}
                            </div>
                        ))}
                     </div>
                </div>
            ))}
        </CardContent>
     </Card>
  );
}
