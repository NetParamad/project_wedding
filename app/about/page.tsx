import { createClient } from "@/lib/supabase/server";
import { getStoreSettings } from "@/lib/supabase/queries";
import { Store, Shield, Heart, Calendar, Truck, Headphones } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Reveal, RevealGroup } from "@/components/animations";

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
      desc: "เราพร้อมให้คำแนะนำและดูแลคุณตั้งแต่เลือกสินค้าจนถึงส่งมอบ",
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
      desc: "เราพร้อมตอบคำถามทุกเมื่อ",
    },
  ];

  return (
    <div className="flex flex-col">
      <section className="bg-gradient-to-b from-primary/30 via-secondary/70 to-background py-12 sm:py-20 lg:py-28">
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
          <Reveal className="max-w-2xl mx-auto space-y-6 text-center">
            <h2 className="text-2xl font-bold">{storeName}</h2>
            <p className="text-lg text-foreground font-medium leading-relaxed [text-wrap:balance]">
              ยินดีต้อนรับสู่ร้านของเรา เราคือร้านเวดดิ้งเล็กๆ ที่ตั้งใจดูแลทุกคู่บ่าวสาวอย่างใกล้ชิด
            </p>
            <div className="text-left mx-2 sm:mx-4 border-l-4 border-primary/25 bg-muted/50 rounded-r-lg px-5 py-4 space-y-3">
              <p className="font-medium text-foreground [text-wrap:balance]">
                และนี่คือเรื่องราวของเรา
              </p>
              <p className="text-muted-foreground leading-loose [text-wrap:pretty]">
                พี่เล็ก เป็นช่างแต่งหน้า และ พี่บาส เป็นช่างทำผม เราทำงานกันแค่ 2 คน ดูแลลูกค้าเองทั้งหมดรวมถึงการแต่งตัวให้บ่าวสาว จึงรับลูกค้าได้แค่ 1-3 คู่ต่อรอบต่อวัน ประสบการณ์การทำงานของเราทั้งคู่ทำมาไม่ต่ำกว่า 10 ปี เราตั้งใจทำบ้านให้เป็นร้าน &ldquo;home office&rdquo; ย้ายที่ทำงานเดิมจากกรุงเทพมหานคร มายังบ้านเกิดจังหวัดลำปาง และวางแผนจะทำบ้านให้เป็นออฟฟิศ ทางร้านเราเน้นใส่ใจลูกค้าคู่ต่อคู่ ดูแลเป็นกันเอง พร้อมดูแลคุณตลอดทั้งวันงานที่แสนพิเศษของท่านจนจบงาน
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="py-16 bg-muted/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <RevealGroup className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f) => (
              <Card key={f.title} data-reveal-item className="p-6 space-y-3">
                <f.icon className="h-8 w-8 text-primary" />
                <h3 className="font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </Card>
            ))}
          </RevealGroup>
        </div>
      </section>
    </div>
  );
}
