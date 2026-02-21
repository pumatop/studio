"use client";

import { useState, useRef } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/lib/types';
import { useStorage, useFunctions } from '@/firebase';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { httpsCallable } from 'firebase/functions';
import { Loader2, Upload, Image as ImageIcon, X, CircleDollarSign } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const notificationSchema = z.object({
  title: z.string().min(3, "العنوان يجب أن يكون 3 أحرف على الأقل"),
  body: z.string().min(5, "النص يجب أن يكون 5 أحرف على الأقل"),
  type: z.enum(['standard', 'popup', 'banner'], { required_error: "يجب اختيار نوع الإشعار" }),
});

type NotificationFormData = z.infer<typeof notificationSchema>;

function NotificationPreview({ title, body, imagePreview }: { title: string, body: string, imagePreview: string | null }) {
    return (
        <div className="sticky top-28">
            <h3 className="text-lg font-semibold mb-4 text-center">معاينة الإشعار</h3>
            <div className="w-80 h-[600px] mx-auto bg-gray-800 rounded-[40px] border-[14px] border-gray-800 shadow-xl overflow-hidden">
                <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800')" }}>
                    <div className="w-full h-full bg-black/30 backdrop-blur-sm p-4">
                        <div className="mt-8 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-3 shadow-md animate-in fade-in-50">
                            <div className="flex items-start gap-3">
                                <div className="p-1 mt-1 bg-gradient-to-br from-primary/80 to-primary rounded-lg text-primary-foreground">
                                    <CircleDollarSign size={16} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="font-bold text-gray-800 dark:text-gray-200">حولّي كاش</span>
                                        <span className="text-gray-500 dark:text-gray-400">الآن</span>
                                    </div>
                                    <p className="font-semibold text-sm mt-1 text-gray-900 dark:text-gray-100 break-words">{title || 'عنوان الإشعار'}</p>
                                    <p className="text-xs text-gray-600 dark:text-gray-300 break-words">{body || 'نص الإشعار يظهر هنا...'}</p>
                                </div>
                            </div>
                            {imagePreview && (
                                <div className="mt-2 aspect-video rounded-lg overflow-hidden relative">
                                    <Image src={imagePreview} layout="fill" objectFit="cover" alt="معاينة الصورة" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function SendNotificationForm({ targetUser, onNotificationSent }: { targetUser: User | null; onNotificationSent: () => void }) {
  const { toast } = useToast();
  const storage = useStorage();
  const functions = useFunctions();

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, formState: { errors }, watch, setValue, reset } = useForm<NotificationFormData>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      type: 'standard',
    }
  });

  const title = watch("title");
  const body = watch("body");
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const onSubmit = async (data: NotificationFormData) => {
    setIsSubmitting(true);
    let imageUrl: string | undefined = undefined;

    try {
      if (imageFile) {
        toast({ title: "جاري رفع الصورة..." });
        const fileRef = storageRef(storage, `notification_images/${Date.now()}_${imageFile.name}`);
        const uploadTask = uploadBytesResumable(fileRef, imageFile);

        await new Promise<void>((resolve, reject) => {
          uploadTask.on('state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(progress);
            },
            (error) => {
              console.error("Upload failed:", error);
              reject(error);
            },
            async () => {
              imageUrl = await getDownloadURL(uploadTask.snapshot.ref);
              setUploadProgress(null);
              resolve();
            }
          );
        });
      }

      toast({ title: "جاري إرسال الإشعار..." });
      
      const sendNotification = httpsCallable(functions, 'sendNotification');
      const payload = {
        ...data,
        target: targetUser ? targetUser.id : 'all',
        imageUrl,
      };

      await sendNotification(payload);

      toast({
        title: "تم إرسال الإشعار بنجاح!",
        description: `تم إرسال "${data.title}" بنجاح.`,
      });
      
      reset();
      removeImage();
      onNotificationSent();

    } catch (error: any) {
      console.error("Error sending notification:", error);
      toast({
        title: "فشل إرسال الإشعار",
        description: error.message || "حدث خطأ غير متوقع.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 lg:col-span-3">
        <div className="space-y-2">
            <Label htmlFor="title">عنوان الإشعار</Label>
            <Input id="title" {...register("title")} disabled={isSubmitting} />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
        </div>

        <div className="space-y-2">
            <Label htmlFor="body">نص الإشعار</Label>
            <Textarea id="body" {...register("body")} disabled={isSubmitting} />
            {errors.body && <p className="text-sm text-destructive">{errors.body.message}</p>}
        </div>

        <div className="space-y-3">
            <Label>نوع الإشعار</Label>
            <RadioGroup
            onValueChange={(value) => setValue('type', value as 'standard' | 'popup' | 'banner')}
            defaultValue="standard"
            className="grid grid-cols-2 md:grid-cols-3 gap-4"
            >
            <Label className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                <RadioGroupItem value="standard" className="sr-only" />
                <span>عادي</span>
            </Label>
            <Label className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                <RadioGroupItem value="popup" className="sr-only" />
                <span>منبثق</span>
            </Label>
            <Label className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                <RadioGroupItem value="banner" className="sr-only" />
                <span>شريط جانبي</span>
            </Label>
            </RadioGroup>
            {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
        </div>

        <div className="space-y-2">
            <Label htmlFor="image">صورة الإشعار (اختياري)</Label>
            {imagePreview ? (
            <div className="relative w-full h-48 rounded-md border overflow-hidden">
                <Image src={imagePreview} alt="معاينة الصورة" layout="fill" objectFit="contain" />
                <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7"
                onClick={removeImage}
                disabled={isSubmitting}
                >
                <X className="h-4 w-4" />
                </Button>
            </div>
            ) : (
            <div 
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-md cursor-pointer hover:bg-muted/50 transition-colors"
            >
                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-muted-foreground">
                    <Upload className="w-8 h-8 mb-2" />
                    <p className="mb-2 text-sm">انقر للرفع أو قم بسحب وإفلات الصورة هنا</p>
                    <p className="text-xs">PNG, JPG, GIF up to 1MB</p>
                </div>
            </div>
            )}
            <Input 
            id="image-upload" 
            type="file" 
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange} 
            accept="image/png, image/jpeg, image/gif"
            disabled={isSubmitting}
            />
            {uploadProgress !== null && <Progress value={uploadProgress} className="w-full mt-2" />}
        </div>
        
        <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            إرسال الإشعار {targetUser ? `إلى ${targetUser.name}` : "للجميع"}
        </Button>
        </form>
        <div className="hidden lg:block lg:col-span-2">
            <NotificationPreview title={title || ""} body={body || ""} imagePreview={imagePreview} />
        </div>
    </div>
  );
}
