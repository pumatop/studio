"use client";

import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { storage } from '@/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useToast } from "@/components/ui/use-toast";
import { Button } from '@/components/ui/button';
import { Loader2, Upload, X, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

export function ImageUploader() {
    const { setValue, watch } = useFormContext();
    const imageUrl = watch('imageUrl');
    const [isUploading, setIsUploading] = useState(false);
    const { toast } = useToast();

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const storageRef = ref(storage, `notification-images/${Date.now()}_${file.name}`);
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            
            setValue('imageUrl', downloadURL, { shouldValidate: true });

            toast({
                title: "نجاح",
                description: "تم رفع الصورة بنجاح.",
            });
        } catch (error) {
            console.error("Image upload error: ", error);
            toast({
                title: "خطأ في الرفع",
                description: "فشل رفع الصورة. يرجى المحاولة مرة أخرى.",
                variant: "destructive",
            });
        } finally {
            setIsUploading(false);
        }
    };

    const triggerFileInput = () => {
        document.getElementById('image-upload-input')?.click();
    };
    
    const removeImage = () => {
        setValue('imageUrl', '', { shouldValidate: true });
    }

    return (
        <div className="space-y-2">
            <label className="font-semibold text-sm">صورة الإشعار (اختياري)</label>
            <div className="w-full h-48 border-2 border-dashed rounded-lg flex items-center justify-center relative">
                {isUploading ? (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <p>جارٍ رفع الصورة...</p>
                    </div>
                ) : imageUrl ? (
                     <>
                        <Image src={imageUrl} alt="preview" layout="fill" objectFit="contain" className="rounded-lg p-1" />
                        <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-7 w-7"
                            onClick={removeImage}
                         >
                             <X className="h-4 w-4" />
                        </Button>
                     </>
                ) : (
                    <div className="text-center text-muted-foreground cursor-pointer" onClick={triggerFileInput}>
                        <ImageIcon className="h-10 w-10 mx-auto" />
                        <p className="mt-2 text-sm">اسحب وأفلت الصورة هنا أو اضغط للاختيار</p>
                    </div>
                )}
                 <input
                    type="file"
                    id="image-upload-input"
                    className="hidden"
                    onChange={handleFileChange}
                    accept="image/png, image/jpeg, image/gif"
                    disabled={isUploading}
                />
            </div>
        </div>
    );
}
