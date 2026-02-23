"use client";

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const notificationTypeGroups = [
    {
        groupName: "الإشعارات القياسية",
        types: [
            { id: 'standard', name: 'عادي', description: 'إشعار قياسي يظهر في مركز الإشعارات.' },
            { id: 'popup', name: 'نافذة منبثقة', description: 'يظهر كرسالة منبثقة مباشرة على الشاشة.' },
            { id: 'banner', name: 'شريط تنبيه', description: 'شريط يظهر في أعلى أو أسفل التطبيق.' },
        ]
    },
    {
        groupName: "الإعلانات",
        types: [
            { id: 'banner-ad', name: 'بانر إعلاني', description: 'شريط إعلاني بصري في أعلى التطبيق.' },
            { id: 'popup-ad', name: 'إعلان منبثق', description: 'نافذة إعلانية مع صورة بارزة وزر CTA.' },
            { id: 'image-only', name: 'إعلان صورة فقط', description: 'إشعار يركز بشكل كامل على الصورة.' },
        ]
    }
];

export function NotificationTypeSelector() {
  const { setValue, watch } = useFormContext();
  const selectedType = watch('type');

  return (
    <div className="space-y-4">
        <label className="font-semibold text-sm">نوع الإشعار</label>
        {notificationTypeGroups.map(group => (
            <div key={group.groupName} className="space-y-3">
                 <h3 className="text-sm font-medium text-muted-foreground">{group.groupName}</h3>
                 <div className="grid grid-cols-1 gap-4">
                    {group.types.map((type) => (
                        <Card
                            key={type.id}
                            onClick={() => setValue('type', type.id, { shouldValidate: true })}
                            className={cn(
                                "cursor-pointer transition-all relative",
                                selectedType === type.id ? 'border-primary ring-2 ring-primary' : 'hover:border-gray-400 dark:hover:border-gray-600'
                            )}
                        >
                            <CardContent className="p-4">
                                <h3 className="font-semibold">{type.name}</h3>
                                <p className="text-sm text-muted-foreground">{type.description}</p>
                                {selectedType === type.id && (
                                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                                        <CheckCircle className="h-4 w-4" />
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                 </div>
            </div>
        ))}
    </div>
  );
}
