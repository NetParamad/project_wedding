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
    '/review/Screenshot_20260804_180730_Instagram.jpg',
    '/review/Screenshot_20260804_180827_Instagram.jpg',
    '/review/Screenshot_20260804_180926_Instagram.jpg',
    '/review/Screenshot_20260804_181110_Instagram.jpg',
    '/review/Screenshot_20260804_181652_Instagram.jpg',
    '/review/Screenshot_20260804_181707_Instagram.jpg',
    '/review/Screenshot_20260804_181845_Instagram.jpg',
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/30 via-secondary/70 to-background py-20 lg:py-32">
        <div className="absolute inset-0 bg-[url('/wallpaper/store.jpg')] bg-cover bg-center opacity-[0.08]" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <p className="text-primary font-medium tracking-[0.1em] uppercase text-sm">
            ร้านเวดดิ้งเล็กๆ ที่เน้นคุณภาพ
          </p>
          <h1 className="text-4xl lg:text-6xl font-bold tracking-tight leading-tight">
            ความฝันในวันวิวาห์เริ่มต้นที่นี่
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            พบกับคอลเลกชันชุดจากทางร้าน ชุดล้านนา ชุดไทย ชุดเดรส ราตรี พร้อมเครื่องประดับให้กับวันสำคัญของบ่าวสาว
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Button asChild size="lg" className="min-w-[180px]">
              <Link href="/products">เลือกชมสินค้า</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="min-w-[180px]">
              <Link href="/appointments/book">นัดลองชุด</Link>
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
        <section className="py-16 lg:py-24 bg-muted/60">
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
      <section className="py-16 lg:py-24 bg-muted/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2">
            <p className="text-primary font-medium tracking-[0.1em] uppercase text-sm">ความประทับใจจากคู่บ่าวสาว</p>
          </div>
          <Marquee>
            {[...testimonialImages, ...testimonialImages].map((img, idx) => (
              <Card key={idx} className="shrink-0 w-[220px] sm:w-[260px] border-0 shadow-sm overflow-hidden bg-card p-0">
                <CardContent className="p-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img}
                    alt="รีวิวความประทับใจจากคู่บ่าวสาว"
                    className="h-[420px] w-full object-cover object-top"
                  />
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
