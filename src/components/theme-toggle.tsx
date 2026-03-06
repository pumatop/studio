"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const [mounted, setMounted] = React.useState(false);
  const [theme, setTheme] = React.useState<"light" | "dark">("light");

  React.useEffect(() => {
    setMounted(true);
    // جلب الثيم المفضل من التخزين المحلي أو من تفضيلات النظام
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const initialTheme = savedTheme || systemTheme;
    
    setTheme(initialTheme);
    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // تجنب أخطاء الهيدريشن عن طريق عدم رندر الأيقونة حتى يتم تحميل الكومبوننت في الكلاينت
  if (!mounted) {
    return <Button variant="outline" size="icon" className="rounded-full h-11 w-11" disabled />;
  }

  return (
    <Button 
      variant="outline" 
      size="icon" 
      onClick={toggleTheme} 
      className="rounded-xl md:rounded-2xl h-11 w-11 md:h-12 md:w-12 bg-[#1B69FF]/5 border-[#1B69FF]/10 hover:bg-[#1B69FF]/10 transition-all shadow-sm"
      title="تبديل وضع النهار/الليل"
    >
      {theme === "light" ? (
        <Sun className="h-5 w-5 md:h-6 md:w-6 text-orange-500 animate-in zoom-in duration-300" />
      ) : (
        <Moon className="h-5 w-5 md:h-6 md:w-6 text-sky-400 animate-in zoom-in duration-300" />
      )}
      <span className="sr-only">تغيير المظهر</span>
    </Button>
  );
}