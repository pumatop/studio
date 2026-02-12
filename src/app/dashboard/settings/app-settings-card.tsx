"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PlusCircle, Trash2, Upload, Phone, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Agent } from "@/lib/types";
import { PlaceHolderImages } from "@/lib/placeholder-images";

const initialAgents: Agent[] = [
    { id: "agent_1", name: "وكيل 1", phone: "091-1111111", address: "طرابلس، حي الأندلس" },
    { id: "agent_2", name: "وكيل 2", phone: "092-2222222", address: "بنغازي، شارع جمال عبد الناصر" },
];

const initialBanners = Array(5).fill("promo-banner-placeholder");

export function AppSettingsCard() {
    const { toast } = useToast();
    const [agents, setAgents] = useState<Agent[]>(initialAgents);
    const [banners, setBanners] = useState<(string | null)[]>(initialBanners);
    const [supportNumbers, setSupportNumbers] = useState({
        libyan: "091-0000000",
        egyptian: "010-00000000"
    });
    
    const bannerPlaceholder = PlaceHolderImages.find(p => p.id === 'promo-banner-placeholder');

    const handleAddAgent = () => {
        setAgents(prev => [...prev, { id: `agent_${Date.now()}`, name: "", phone: "", address: "" }]);
    };

    const handleDeleteAgent = (id: string) => {
        setAgents(prev => prev.filter(agent => agent.id !== id));
        toast({ title: "تم حذف الوكيل", variant: "destructive" });
    };
    
    const handleAgentChange = (id: string, field: keyof Omit<Agent, "id">, value: string) => {
        setAgents(prev => prev.map(agent => agent.id === id ? { ...agent, [field]: value } : agent));
    };
    
    const handleSupportNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSupportNumbers(prev => ({...prev, [name]: value}));
    };

    const handleSave = () => {
        toast({
            title: "تم حفظ إعدادات التطبيق",
        });
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>إعدادات التطبيق</CardTitle>
                <CardDescription>إدارة الإعدادات العامة واللوحة الدعائية وبيانات الدعم.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Promotional Banners */}
                <div className="space-y-4 rounded-lg border p-4">
                    <h3 className="font-semibold text-lg">اللوحة الدعائية للتطبيق</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {banners.map((banner, index) => (
                            <div key={index} className="relative aspect-video rounded-md border-2 border-dashed flex items-center justify-center bg-muted/50 overflow-hidden">
                                {banner && bannerPlaceholder ? (
                                     <Image src={bannerPlaceholder.imageUrl} alt={`Banner ${index + 1}`} layout="fill" objectFit="cover" data-ai-hint={bannerPlaceholder.imageHint} />
                                ) : (
                                    <span className="text-xs text-muted-foreground">صورة {index + 1}</span>
                                )}
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2 opacity-0 hover:opacity-100 transition-opacity">
                                    <Button size="icon" variant="outline" className="h-8 w-8">
                                        <Upload className="h-4 w-4" />
                                    </Button>
                                    <Button size="icon" variant="destructive" className="h-8 w-8">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                
                <Separator />

                {/* Agents & Support */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Wallet Charging Agents */}
                    <div className="space-y-4 rounded-lg border p-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-lg">صفحة شحن المحفظة (الوكلاء)</h3>
                             <Button variant="outline" size="sm" onClick={handleAddAgent}>
                                <PlusCircle className="ml-2 h-4 w-4" />
                                إضافة وكيل
                            </Button>
                        </div>
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                             {agents.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">لا يوجد وكلاء حالياً.</p>}
                             {agents.map(agent => (
                                 <div key={agent.id} className="flex flex-col gap-2 rounded-md border p-3">
                                     <div className="flex items-center justify-between">
                                        <Input
                                            value={agent.name}
                                            onChange={e => handleAgentChange(agent.id, 'name', e.target.value)}
                                            placeholder="اسم الوكيل"
                                            className="font-semibold border-0 shadow-none focus-visible:ring-0 p-0 h-auto"
                                        />
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={() => handleDeleteAgent(agent.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                     </div>
                                      <div className="space-y-2">
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                             <Input value={agent.phone} onChange={e => handleAgentChange(agent.id, 'phone', e.target.value)} placeholder="رقم الهاتف" className="pl-10" />
                                        </div>
                                         <div className="relative">
                                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input value={agent.address} onChange={e => handleAgentChange(agent.id, 'address', e.target.value)} placeholder="العنوان" className="pl-10" />
                                        </div>
                                      </div>
                                 </div>
                             ))}
                        </div>
                    </div>

                    {/* Technical Support */}
                     <div className="space-y-4 rounded-lg border p-4">
                        <h3 className="font-semibold text-lg">صفحة الدعم الفني</h3>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="support-ly">رقم الهاتف الليبي</Label>
                                <Input id="support-ly" name="libyan" value={supportNumbers.libyan} onChange={handleSupportNumberChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="support-eg">رقم الهاتف المصري</Label>
                                <Input id="support-eg" name="egyptian" value={supportNumbers.egyptian} onChange={handleSupportNumberChange} />
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
             <CardFooter>
                <Button onClick={handleSave} className="w-full">حفظ إعدادات التطبيق</Button>
            </CardFooter>
        </Card>
    );
}
