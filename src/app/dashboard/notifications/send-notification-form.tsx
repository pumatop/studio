"use client";

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ImageUploader } from './image-uploader';

export function SendNotificationForm() {
  const { register, formState: { errors } } = useFormContext();

  return (
    <div className="space-y-6">
        <div className="space-y-2">
            <label htmlFor="title" className="font-semibold text-sm">العنوان</label>
            <Input id="title" {...register('title')} placeholder="عنوان الإشعار" />
            {errors.title && <p className="text-sm text-red-500">{errors.title.message as string}</p>}
        </div>

        <div className="space-y-2">
            <label htmlFor="body" className="font-semibold text-sm">المحتوى</label>
            <Textarea id="body" {...register('body')} placeholder="محتوى رسالة الإشعار" />
            {errors.body && <p className="text-sm text-red-500">{errors.body.message as string}</p>}
        </div>
        
        <ImageUploader />
    </div>
  );
}
