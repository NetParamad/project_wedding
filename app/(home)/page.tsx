import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getRandomProducts, getCategories } from "@/lib/supabase/queries";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Marquee } from "@/components/marquee";
import { HeroReveal, Reveal, RevealGroup } from "@/components/animations";



export default async function HomePage() {
  const supabase = await createClient();
  const [latest, categories] = await Promise.all([
    getRandomProducts(supabase),
    getCategories(supabase),
  ]);

  const servicesImages = [
    '/services/wd_sv_1.jpg',
    '/services/wd_sv_2.jpg',
    '/services/wd_sv_3.jpg',
  ];

  const testimonialImages = [
    '/review/Screenshot_20260804_175425_Instagram.jpg',
    '/review/Screenshot_20260804_175445_Instagram.jpg',
    '/review/Screenshot_20260804_175525_Instagram.jpg',
    '/review/Screenshot_20260804_175552_Instagram.jpg',
    '/review/Screenshot_20260804_175634_Instagram.jpg',
    '/review/Screenshot_20260804_175656_Instagram.jpg',
    '/review/Screenshot_20260804_175740_Instagram.jpg',
    '/review/Screenshot_20260804_175800_Instagram.jpg',
    '/review/Screenshot_20260804_175817_Instagram.jpg',
    '/review/Screenshot_20260804_175839_Instagram.jpg',
    '/review/Screenshot_20260804_175910_Instagram.jpg',
    '/review/Screenshot_20260804_175944_Instagram.jpg',
    '/review/Screenshot_20260804_180026_Instagram.jpg',
    '/review/Screenshot_20260804_180102_Instagram.jpg',
    '/review/Screenshot_20260804_180124_Instagram.jpg',
    '/review/Screenshot_20260804_180206_Instagram.jpg',
    '/review/Screenshot_20260804_180220_Instagram.jpg',
    '/review/Screenshot_20260804_180242_Instagram.jpg',
    '/review/Screenshot_20260804_180324_Instagram.jpg',
    '/review/Screenshot_20260804_180345_Instagram.jpg',
    '/review/Screenshot_20260804_180503_Instagram.jpg',
    '/review/Screenshot_20260804_180656_Instagram.jpg',
    '/review/Screenshot_20260804_180827_Instagram.jpg',
    '/review/Screenshot_20260804_180926_Instagram.jpg',
    '/review/Screenshot_20260804_181110_Instagram.jpg',
    '/review/Screenshot_20260804_181707_Instagram.jpg',
    '/review/Screenshot_20260804_181845_Instagram.jpg',
  ];


  const galleryImages = [
    '/gallery/wd_gal_1.jpg',
    '/gallery/wd_gal_2.jpg',
    '/gallery/wd_gal_3.jpg',
    '/gallery/wd_gal_4.jpg',
    '/gallery/wd_gal_5.jpg',
    '/gallery/wd_gal_6.jpg',
  ]

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/30 via-secondary/70 to-background py-20 lg:py-32">
        <div
          data-hero-bg
          className="absolute inset-0 bg-[url('/wallpaper/store.jpg')] bg-cover bg-center opacity-[0.08]"
        />
        <HeroReveal>
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
            <p data-hero className="text-primary font-medium tracking-[0.1em] uppercase text-lg">
              สัมผัสความงามอันอ่อนช้อย ด้วยเสน่ห์กลิ่นอายล้านนา
            </p>
            <h1 data-hero className="text-5xl lg:text-7xl font-bold tracking-tight leading-tight text-balance">
              ร้อยเรียงความฝันในวันวิวาห์ ด้วยเสน่ห์ผืนผ้าทางล้านนา
            </h1>
            <p data-hero className="text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed text-balance">
              ถักทอความรัก ความผูกพันผ่านเส้นสายผืนผ้าพร้อมเครื่องศิราภรณ์อันเลอค่า ให้คอลเลกชันชุดล้านนาทรงเสน่ห์ ชุดไทยสุดสง่า และชุดราตรีร่วมสมัย พาเนรมิตช่วงเวลาแห่งความสุข โอบล้อมคู่บ่าวสาวด้วยความงดงามดั่งบทกวีที่ไม่เคยลบเลือน
            </p>
            <div data-hero className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Button asChild size="lg" className="min-w-[180px]">
                <Link href="/products">เลือกชมสินค้า</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="min-w-[180px]">
                <Link href="/appointments/book">นัดลองชุด</Link>
              </Button>
            </div>
          </div>
        </HeroReveal>
      </section>

      {/* Services Section */}
      <Reveal>
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
      </Reveal>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="py-16 lg:py-24 bg-muted/60">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <Reveal className="flex items-center justify-between">
              <h2 className="text-3xl font-bold">หมวดหมู่</h2>
              <Link href="/products" className="text-sm text-primary hover:underline">
                ดูทั้งหมด
              </Link>
            </Reveal>
            <RevealGroup className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {categories.map((cat) => (
                <div key={cat.id} data-reveal-item>
                  <Card className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
                    <Link href={`/products?category=${cat.id}`}>
                      <div className="aspect-[3/2] bg-muted overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={cat.image_url || `https://picsum.photos/seed/category-${cat.id}/400/300`}
                          alt=""
                          className="h-full w-full object-cover hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="p-3 text-center space-y-1">
                        <p className="font-medium text-lg">{cat.name}</p>
                        {cat.description && (
                          <p className="text-xs text-muted-foreground leading-relaxed">{cat.description}</p>
                        )}
                      </div>
                    </Link>
                  </Card>
                </div>
              ))}
            </RevealGroup>
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="py-16 lg:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <Reveal>
            <div className="text-center space-y-2">
              <p className="text-primary font-medium tracking-[0.1em] uppercase text-lg">เลือกชมสินค้า</p>
            </div>
          </Reveal>
          {latest.length > 0 ? (
            <RevealGroup className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {latest.map((product) => (
                <div key={product.id} data-reveal-item>
                  <ProductCard product={product} />
                </div>
              ))}
            </RevealGroup>
          ) : (
            <p className="text-muted-foreground">ยังไม่มีสินค้า</p>
          )}
          <Reveal>
            <div className="text-center">
              <Button asChild variant="outline" size="lg">
                <Link href="/products">ดูทั้งหมด</Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 lg:py-24 bg-muted/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <Reveal>
            <div className="text-center space-y-2">
              <p className="text-primary font-medium tracking-[0.1em] uppercase text-lg">ความประทับใจจากคู่บ่าวสาว</p>
            </div>
          </Reveal>
          <Reveal>
            <Marquee>
              {[...testimonialImages, ...testimonialImages].map((img, i) => (
                <div key={i} className="shrink-0 w-[280px] sm:w-[320px] overflow-hidden rounded-lg shadow-sm bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img}
                    alt=""
                    className="h-full w-full object-cover aspect-square hover:scale-105 transition-transform duration-500"
                  />
                </div>
              ))}
            </Marquee>
          </Reveal>
        </div>
      </section>

      {/* Gallery */}
      <section className="py-16 lg:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <Reveal>
            <div className="text-center space-y-2">
              <p className="text-primary font-medium tracking-[0.1em] uppercase text-lg">แรงบันดาลใจสำหรับวันวิวาห์</p>
            </div>
          </Reveal>
          <RevealGroup className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {galleryImages.map((img, i) => (
              <div key={i} data-reveal-item className="aspect-square rounded-lg overflow-hidden bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img}
                  alt=""
                  className="h-full w-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
            ))}
          </RevealGroup>
        </div>
      </section>
    </div>
  );
}
