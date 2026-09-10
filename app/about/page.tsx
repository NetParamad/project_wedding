import { createClient } from "@/lib/supabase/server";
import { getStoreSettings } from "@/lib/supabase/queries";
import { Store, Shield, Heart, Calendar, Truck, Headphones } from "lucide-react";
import { Card } from "@/components/ui/card";

export default async function AboutPage() {
  const supabase = await createClient();
  const [settings] = await Promise.all([
    getStoreSettings(supabase),
  ]);

  const storeName = settings?.store_name || "My Store";

  const features = [
    {
      icon: Store,
      title: "สินค้าคุณภาพ",
      desc: "เราเลือกสรรสินค้าคุณภาพดีมาให้คุณเลือกชม",
    },
    {
      icon: Shield,
      title: "มั่นใจได้",
      desc: "เราพร้อมให้บริการลูกค้าอย่างดีที่สุด",
    },
    {
      icon: Heart,
      title: "บริการประทับใจ",
      desc: "ทีมงานพร้อมให้คำแนะนำและดูแลคุณตั้งแต่เลือกสินค้าจนถึงส่งมอบ",
    },
    {
      icon: Calendar,
      title: "จองง่าย",
      desc: "จองสินค้าหรือรับคำปรึกษาได้ในไม่กี่คลิก",
    },
    {
      icon: Truck,
      title: "จัดส่งรวดเร็ว",
      desc: "จัดส่งรวดเร็วถึงหน้าบ้านคุณ",
    },
    {
      icon: Headphones,
      title: "ดูแลลูกค้า",
      desc: "ทีมงานพร้อมตอบคำถามทุกเมื่อ",
    },
  ];

  return (
    <div className="flex flex-col">
      <section className="bg-gradient-to-b from-primary/5 to-background py-12 sm:py-20 lg:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight">
            เกี่ยวกับเรา {storeName}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            เรียนรู้เพิ่มเติมเกี่ยวกับร้านของเรา
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold">{storeName}</h2>
            <p className="text-muted-foreground leading-relaxed">
              เราเป็นร้านค้าที่พร้อมให้บริการสินค้าคุณภาพหลากหลายประเภท พันธกิจของเราคือการมอบสินค้าที่มีคุณภาพในราคาที่เป็นธรรม พร้อมให้บริการลูกค้าอย่างดีที่สุด ไม่ว่าคุณกำลังมองหาชุดแต่งงาน ของแต่งงาน หรือของใช้ทั่วไป เราก็พร้อมให้บริการ เลือกชมสินค้าของเราได้เลย
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f) => (
              <Card key={f.title} className="p-6 space-y-3">
                <f.icon className="h-8 w-8 text-primary" />
                <h3 className="font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
