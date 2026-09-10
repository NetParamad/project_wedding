import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getFeaturedProducts, getCategories } from "@/lib/supabase/queries";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Marquee } from "@/components/marquee";



export default async function HomePage() {
  const supabase = await createClient();
  const [featured, categories] = await Promise.all([
    getFeaturedProducts(supabase),
    getCategories(supabase),
  ]);

  const servicesImages = [
    '/services/wd_sv_1.jpg',
    '/services/wd_sv_2.jpg',
    '/services/wd_sv_3.jpg',
  ];


  const galleryImages = [
    '/gallery/wd_gal_1.jpg',
    '/gallery/wd_gal_2.jpg',
    '/gallery/wd_gal_3.jpg',
    '/gallery/wd_gal_4.jpg',
    '/gallery/wd_gal_5.jpg',
    '/gallery/wd_gal_6.jpg',
  ]

  const testimonials = [
    { text: "รูปออกมาสวยทุกรูปเลยค่ะ ต้องขอบคุณพี่บาสและพี่เล็ก ที่คอยดูแลอย่างดีตอนถ่ายพรี ทั้งจัดเต็มเรื่องแต่งหน้า ทำผม รวมถึงชุดล้านนาที่งด งามมากๆ ทุกอย่างลงตัวจน ทำให้การถ่ายครั้งนี้เป็น ประสบการณ์ที่น่าประทับใจ และอบอุ่นจริงๆค่ะ", author: "— สาระ & เจมส์", initial: "ร" },
    { text: "ขอบคุณเหมือนกันค่ะ พี่บาสกับพี่เล็กน่ารักมากๆ ไม่ เป็นไรเลยค่ะพี่ ชุดสวยมากกก หน้าผมสวยหมดดด พี่ช่วยคิด ท่าโพสต์ให้ด้วยเริสมากกเลย ค่ะ", author: "— ไมเคิล & ปรียา", initial: "ข" },
    { text: "ชุดล้านนา โทนพาสเทลด้วยความที่ตรีมงานแต่งเป็นโทนพาสเทล กับสถานที่ เรือนไทยทางภาคเหนือ บวกกับเจ้าสาวอยากได้ชุดล้าน นาที่เข้ากับธีมงาน และก็ได้ถูกใจชุดล้านนาจาก ร้าน ซิน ณ กร จ. ลำปาง ซึ่งตรงตามตรีมงานมากพี่ๆจากร้าน ชิน ณ กร ดูแลดี ให้บริการดี ทั้งแต่งหน้า ทำผม และแต่งตัว (ชุดเป็นชุดนุ่งสด) ตั้งแต่วันฟิตติ้ง จนถึงวันงานเลยค่ะวันงานจริง พอแต่งหน้าทำผม แล้วสวย ถูกใจมากๆ แขก ในงานชมตลอดงาน ถ่ายรูปออกมาสวยเกินคาดมากๆ ค่ะเผื่อเป็นไอเดียให้เจ้าสาว ที่ชอบสไตล์ล้านนา นะคะ งานแต่งล้านนา ชุดล้านนา", author: "— เอมิลี่ & เดวิด", initial: "ช" },
    { text: "ขอบคุณพี่บาส พี่เล็กแบบ มากๆๆๆๆๆๆๆๆๆเลยนะคะ แบบไม่เสียใจเลยจริงๆที่ให้ พี่ๆดูแล งานประณีตมากๆๆ ดูแลอย่างดี ประทับใจมากๆ เลยค่ะ ขอบคุณอีกครั้งจริงๆ นะคะ", author: "— เอมิลี่ & เดวิด", initial: "ข" },
    { text: "รักชินกร เป็นมากกว่าร้าน คือการดูแลที่โคตรจะดี พี่บาส พี่เล็ก น่ารัก เป็นกันเองที่สุด เลยค่ะ ขอบคุณพี่ๆ อีกครั้งนะคะ", author: "— เอมิลี่ & เดวิด", initial: "ร" },
    { text: "ขอบคุณพี่บาส พี่เล็ก พี่ไก่ มากๆนะคะ ที่ทำให้วันสำคัญของน้องสองคน สวยงามและสมบูรณ์แบบทุกอย่างออกมาดีและดูแล มากกว่าการเป็นร้านเช่า ชุดเลย", author: "— เอมิลี่ & เดวิด", initial: "ข" },
    { text: "ขอบคุณ พี่เล็ก พี่บาส นะคะแขกชมสวยมากกๆ ทั้งที่ งาน ทั้งในโซเซียล เค้า บอกว่าชุดไทย หน้าผมเจ้าสาว สวยมากๆ และ ขอบคุณที่ดูแลเรา 2 คน ตลอดงานนะคะ", author: "— เอมิลี่ & เดวิด", initial: "ข" },
    { text: "งานละเมียดละมัย แต่งหน้าสวย ชุดสวย ดูแลดี แนะน่าร้าน ชิน ณ กร เลยค่ะ ไม่ผิดหวัง ประทับใจมาก ขอบคุณพี่เล็ก พี่บาส นะคะ", author: "— เอมิลี่ & เดวิด", initial: "ง" },
    { text: "พี่ทั้ง 2 เป็นพี่ที่น่ารักมากๆ ใส่ใจทุกรายละเอียดที่เกี่ยวกับเรา ปราณีต ทุกตรงคอยดูแลทั้งหน้าผม ชุด ตลอดงาน ไม่หยุดเลย จนเราเองแอบเกรงใจกลัวพี่ๆ จะเหนื่อยจะบอกว่า เลือกไม่ผิดจริงๆ กับการดูแลของทางชิน ณ กร ที่มอบให้เราในวันงาน ใครที่ยังลังเล เลือกเถอะ ค่ะ แล้วจะไม่ผิดหวังที่ได้เลือก ชิน ณ กร", author: "— เอมิลี่ & เดวิด", initial: "พ" },
    { text: "What a great experience! Did everything from consulting on style, full dress up, makeup and photography. Very friendly and welcoming as well, highly recommend.", author: "— เอมิลี่ & เดวิด", initial: "W" },
    { text: "ร้าน Pre wedding ใกล้วัดป่าตัน อำเภอแม่ทะ เป็นร้านเล็กๆน่ารัก พี่ๆใส่ใจทุกรายละเอียด เสื้อผ้าสวยๆ หรือจะให้ถ่ายรูปเลยก็ได้นะครับ รอบหมู่บ้านมีสถานที่สวยให้เลือกเยอะ เช่น ริมน้ำ ภูเขา วิวใต้ต้นไม้", author: "— เอมิลี่ & เดวิด", initial: "ร" },
    { text: "ช่างมืออาชีพ มากประสบการณ์ ชุดไทยมีรายละเอียดที่พิถีทันมาก แตกต่างจากเจ้าอื่นอย่างสิ้นเชิง คุณผู้หญิงที่ชื่นชอบในผ้าไทยลองมาสัมผัสด้วยตัวเองจะเห็นความแตกต่างในรายละเอียดอย่างแน่นอน", author: "— เอมิลี่ & เดวิด", initial: "ช" },
    { text: "คิดถูกมากที่เลือก ชิน ณ กร ให้จัดการเรื่องชุดแต่งงาน และแต่งหน้า ทำผม ไม่ผิดหวังเลยค่ะ :-)", author: "— เอมิลี่ & เดวิด", initial: "ค" },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-primary/[0.03] to-background py-20 lg:py-32">
        <div className="absolute inset-0 bg-[url('/wallpaper/store.jpg')] bg-cover bg-center opacity-[0.06]" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <p className="text-primary font-medium tracking-[0.1em] uppercase text-sm">
            ร้านเวดดิ้งเล็กๆ ที่เน้นคุณภาพ
          </p>
          <h1 className="text-4xl lg:text-6xl font-bold tracking-tight leading-tight">
            ความฝันในวันวิวาห์เริ่มต้นที่นี่
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            พบกับคอลเลกชันชุดแต่งงาน สูท และเครื่องประดับสุดพิเศษสำหรับวันสำคัญของคุณ
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Button asChild size="lg" className="min-w-[180px]">
              <Link href="/products">เลือกชมสินค้า</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="min-w-[180px]">
              <Link href="/appointments/book">จองนัดหมาย</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 lg:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <Marquee>
            {[...servicesImages, ...servicesImages].map((img, i) => (
              <div key={i} className="shrink-0 w-[320px] sm:w-[400px] overflow-hidden rounded-lg shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img}
                  alt=""
                  className="h-full w-full object-cover aspect-[4/3]"
                />
              </div>
            ))}
          </Marquee>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="py-16 lg:py-24 bg-muted/30">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">หมวดหมู่</h2>
              <Link href="/products" className="text-sm text-primary hover:underline">
                ดูทั้งหมด
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {categories.map((cat) => (
                <Card key={cat.id} className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
                  <Link href={`/products?category=${cat.id}`}>
                    <div className="aspect-[3/2] bg-muted overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={cat.image_url || `https://picsum.photos/seed/category-${cat.id}/400/300`}
                        alt=""
                        className="h-full w-full object-cover hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-3 text-center space-y-0.5">
                      <p className="font-medium text-sm">{cat.name}</p>
                    </div>
                  </Link>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="py-16 lg:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <p className="text-primary font-medium tracking-[0.1em] uppercase text-sm">เลือกชมสินค้า</p>
          </div>
          {featured.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">ยังไม่มีสินค้าแนะนำ</p>
          )}
          <div className="text-center">
            <Button asChild variant="outline" size="lg">
              <Link href="/products">ดูทั้งหมด</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2">
            <p className="text-primary font-medium tracking-[0.1em] uppercase text-sm">ความประทับใจจากคู่บ่าวสาว</p>
          </div>
          <Marquee>
            {[...testimonials, ...testimonials].map((item, idx) => (
              <Card key={idx} className="shrink-0 w-[320px] sm:w-[400px] border-0 shadow-sm">
                <CardContent className="p-6 text-center space-y-4">
                  <p className="text-sm text-muted-foreground italic leading-relaxed">
                    &ldquo;{item.text}&rdquo;
                  </p>
                </CardContent>
              </Card>
            ))}
          </Marquee>
        </div>
      </section>

      {/* Gallery */}
      <section className="py-16 lg:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2">
            <p className="text-primary font-medium tracking-[0.1em] uppercase text-sm">แรงบันดาลใจสำหรับวันวิวาห์</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {galleryImages.map((img, i) => (
              <div key={i} className="aspect-square rounded-lg overflow-hidden bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img}
                  alt=""
                  className="h-full w-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
