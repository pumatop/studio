"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, ShieldCheck } from "lucide-react";
import { useAuth, useUser } from "@/firebase";
import { signInWithEmailAndPassword, AuthError } from "firebase/auth";
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const appLogo = PlaceHolderImages.find(img => img.id === 'app-logo')?.imageUrl || '/logo.png';
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // If user is already logged in, redirect to dashboard
  useEffect(() => {
    if (!isUserLoading && user) {
      router.push("/dashboard");
    }
  }, [user, isUserLoading, router]);

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/dashboard");
    } catch (e) {
      const authError = e as AuthError;
      switch (authError.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          setError("البريد الإلكتروني أو كلمة المرور غير صحيحة.");
          break;
        case 'auth/invalid-email':
          setError("البريد الإلكتروني غير صالح.");
          break;
        case 'auth/too-many-requests':
          setError("تم حظر هذا الحساب مؤقتًا بسبب كثرة محاولات تسجيل الدخول الفاشلة.");
          break;
        default:
          setError("حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.");
          break;
      }
    } finally {
      setLoading(false);
    }
  };
  
  if (isUserLoading || user) {
    return (
       <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
            <div className="relative h-16 w-16 md:h-20 md:w-20 p-2 bg-white dark:bg-slate-200 rounded-2xl shadow-2xl animate-pulse">
              <Image 
                src={appLogo} 
                alt="Loading Logo" 
                fill 
                className="object-contain p-1"
                data-ai-hint="finance logo"
              />
            </div>
        </div>
      </div>
    );
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-background p-4" dir="rtl">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-2 bg-white dark:bg-slate-200 rounded-2xl shadow-xl shadow-primary/10 border border-primary/5 shrink-0">
          <Image 
            src={appLogo} 
            alt="Logo" 
            width={64} 
            height={64} 
            className="h-12 w-12 md:h-14 md:w-12 object-contain" 
            data-ai-hint="finance logo"
          />
        </div>
        <h1 className="text-3xl font-black text-[#001F3D] dark:text-foreground">حولّي كاش</h1>
      </div>
      <Card className="w-full max-w-sm rounded-[2.5rem] border-none shadow-2xl overflow-hidden bg-card">
        <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b p-8">
          <CardTitle className="text-2xl font-black text-[#001F3D] dark:text-foreground text-right">تسجيل الدخول</CardTitle>
          <CardDescription className="text-sm font-bold text-slate-400 mt-2 text-right">
            الرجاء إدخال بيانات الاعتماد للوصول إلى مركز الإدارة.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 p-8">
          {error && (
            <Alert variant="destructive" className="rounded-2xl border-none bg-red-50 dark:bg-red-500/10 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="font-black text-xs mr-2">خطأ في الدخول</AlertTitle>
              <AlertDescription className="font-bold text-xs mr-2">{error}</AlertDescription>
            </Alert>
          )}
          <div className="grid gap-2 text-right">
            <Label htmlFor="email" className="font-black text-[10px] uppercase tracking-widest text-slate-400 mb-1">البريد الإلكتروني</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@hawelly.app"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="h-12 rounded-xl bg-background border-slate-200 dark:border-white/5 font-bold"
            />
          </div>
          <div className="grid gap-2 text-right">
            <Label htmlFor="password" className="font-black text-[10px] uppercase tracking-widest text-slate-400 mb-1">كلمة المرور</Label>
            <Input
              id="password"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="h-12 rounded-xl bg-background border-slate-200 dark:border-white/5 font-bold"
            />
          </div>
        </CardContent>
        <CardFooter className="p-8 pt-0">
          <Button className="w-full h-14 rounded-2xl font-black text-lg bg-[#1B69FF] hover:bg-[#1B69FF]/90 shadow-xl shadow-primary/20" onClick={handleLogin} disabled={loading}>
            {loading ? 'جاري التحقق...' : 'دخول النظام الآمن'}
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}