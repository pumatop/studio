"use client";

import { useState, useEffect } from "react";
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

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  
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
            <ShieldCheck className="h-12 w-12 text-primary animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="flex items-center gap-3 mb-8 text-primary">
        <ShieldCheck className="h-12 w-12" />
        <h1 className="text-3xl font-bold">حولّي كاش</h1>
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">تسجيل الدخول</CardTitle>
          <CardDescription>
            الرجاء إدخال البريد الإلكتروني وكلمة المرور للوصول إلى لوحة التحكم.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>خطأ في تسجيل الدخول</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="grid gap-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">كلمة المرور</Label>
            <Input
              id="password"
              type="password"
              required
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handleLogin} disabled={loading}>
            {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
