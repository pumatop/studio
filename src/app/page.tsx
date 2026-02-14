"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CircleDollarSign } from "lucide-react";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.push("/dashboard");
  }, [router]);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-background text-center p-4">
       <CircleDollarSign className="h-16 w-16 text-primary animate-pulse mb-4" />
      <h1 className="text-xl font-semibold text-primary">حولّي كاش</h1>
      <p className="text-muted-foreground mt-2">جاري تحويلك إلى لوحة التحكم...</p>
    </main>
  );
}
