"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CircleDollarSign } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = () => {
    router.push("/dashboard");
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center mb-4">
            <CircleDollarSign className="h-16 w-16 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-primary">
            لوحة تحكم حولّي كاش
          </CardTitle>
          <CardDescription>
            اضغط على الزر للمتابعة إلى لوحة التحكم
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Button onClick={handleLogin} className="w-full">
              الدخول إلى لوحة التحكم
            </Button>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-center text-muted-foreground w-full">
            © {new Date().getFullYear()} لوحة تحكم حولّي كاش.
          </p>
        </CardFooter>
      </Card>
    </main>
  );
}
