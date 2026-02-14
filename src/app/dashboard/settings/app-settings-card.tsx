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
import type { Agent, Region } from "@/lib/types";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const initialRegions: Region[] = [
    {
        id: "region_1",
        name: "طرابلس",
        agents: [
            { id: "agent_1_1", name: "وكيل الظهرة", phone: "091-1111111", address: "الظهرة، بجانب مقهى المدينة" },
            { id: "agent_1_2", name: "وكيل قرقارش", phone: "092-2222222", address: "قرقارش، شارع عشرة" },
        ]
    },
    {
        id: "region_2",
        name: "بنغازي",
        agents: [
            { id: "agent_2_1", name: "وكيل الكيش", phone: "091-3333333", address: "الكيش، مقابل جامعة بنغازي" },
        ]
    },
];

const initialBanners: string[] = ["banner1.jpg", "banner2.jpg", "banner3.jpg"];

export function AppSettingsCard() {
    const { toast } = useToast();
    const [regions, setRegions] = useState<Region[]>(initialRegions);
    const [banners, setBanners] = useState<(string | null)[]>(initialBanners);
    const [supportNumbers, setSupportNumbers] = useState({
        libyan: "091-0000000",
        egyptian: "010-00000000"
    });
    
    const bannerPlaceholder = PlaceHolderImages.find(p => p.id === 'promo-banner-placeholder');

    const handleAddRegion = () => {
        setRegions(prev => [...prev, { id: `region_${Date.now()}`, name: "منطقة جديدة", agents: [] }]);
    };
    
    const handleDeleteRegion = (regionId: string) => {
        setRegions(prev => prev.filter(region => region.id !== regionId));
        toast({ title: "تم حذف المنطقة", variant: "destructive" });
    };

    const handleRegionNameChange = (regionId: string, newName: string) => {
        setRegions(prev => prev.map(region => region.id === regionId ? { ...region, name: newName } : region));
    };

    const handleAddAgent = (regionId: string) => {
        setRegions(prev => prev.map(region => {
            if (region.id === regionId) {
                const newAgent: Agent = { id: `agent_${Date.now()}`, name: "", phone: "", address: "" };
                return { ...region, agents: [...region.agents, newAgent] };
            }
            return region;
        }));
    };

    const handleDeleteAgent = (regionId: string, agentId: string) => {
        setRegions(prev => prev.map(region => {
            if (region.id === regionId) {
                return { ...region, agents: region.agents.filter(agent => agent.id !== agentId) };
            }
            return region;
        }));
        toast({ title: "تم حذف الوكيل", variant: "destructive" });
    };
    
    const handleAgentChange = (regionId: string, agentId: string, field: keyof Omit<Agent, "id">, value: string) => {
        setRegions(prev => prev.map(region => {
            if (region.id === regionId) {
                const updatedAgents = region.agents.map(agent => 
                    agent.id === agentId ? { ...agent, [field]: value } : agent
                );
                return { ...region, agents: updatedAgents };
            }
            return region;
        }));
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
                             <Button variant="outline" size="sm" onClick={handleAddRegion}>
                                <PlusCircle className="ml-2 h-4 w-4" />
                                إضافة منطقة
                            </Button>
                        </div>
                        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                             {regions.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">لا توجد مناطق حالياً.</p>}
                             <Accordion type="multiple" className="w-full">
                                {regions.map((region) => (
                                    <AccordionItem value={region.id} key={region.id} className="border-b-0 mb-2">
                                        <div className="flex items-center gap-2">
                                            <AccordionTrigger className="border rounded-md px-3 hover:no-underline flex-1">
                                                <Input
                                                    value={region.name}
                                                    onChange={e => handleRegionNameChange(region.id, e.target.value)}
                                                    placeholder="اسم المنطقة"
                                                    className="font-semibold border-0 shadow-none focus-visible:ring-0 p-0 h-auto bg-transparent"
                                                    onClick={e => e.stopPropagation()}
                                                />
                                            </AccordionTrigger>
                                            <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive shrink-0" onClick={() => handleDeleteRegion(region.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <AccordionContent className="pt-2">
                                          <div className="space-y-3 border-r pr-4 mr-4">
                                            {region.agents.length === 0 && <p className="text-sm text-muted-foreground text-center py-2">لا يوجد وكلاء في هذه المنطقة.</p>}
                                            {region.agents.map(agent => (
                                                 <div key={agent.id} className="flex flex-col gap-2 rounded-md border p-3">
                                                     <div className="flex items-center justify-between">
                                                        <Input
                                                            value={agent.name}
                                                            onChange={e => handleAgentChange(region.id, agent.id, 'name', e.target.value)}
                                                            placeholder="اسم الوكيل"
                                                            className="font-semibold border-0 shadow-none focus-visible:ring-0 p-0 h-auto"
                                                        />
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={() => handleDeleteAgent(region.id, agent.id)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                     </div>
                                                      <div className="space-y-2">
                                                        <div className="relative">
                                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                             <Input value={agent.phone} onChange={e => handleAgentChange(region.id, agent.id, 'phone', e.target.value)} placeholder="رقم الهاتف" className="pl-10" />
                                                        </div>
                                                         <div className="relative">
                                                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                            <Input value={agent.address} onChange={e => handleAgentChange(region.id, agent.id, 'address', e.target.value)} placeholder="العنوان" className="pl-10" />
                                                        </div>
                                                      </div>
                                                 </div>
                                            ))}
                                            <Button variant="outline" size="sm" onClick={() => handleAddAgent(region.id)} className="mt-2">
                                                <PlusCircle className="ml-2 h-4 w-4" />
                                                إضافة وكيل
                                            </Button>
                                          </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                             </Accordion>
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
