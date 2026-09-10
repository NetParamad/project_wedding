import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { ColorThemeProvider } from "@/components/color-theme-provider";
import { createClient } from "@/lib/supabase/server";
import { getStoreSettings } from "@/lib/supabase/queries";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient()
  const settings = await getStoreSettings(supabase)
  const storeName = settings?.store_name || 'Project Store'

  return {
    metadataBase: new URL(defaultUrl),
    title: storeName,
    description: `ยินดีต้อนรับสู่ ${storeName}`,
  }
}

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body className={`${geistSans.className} antialiased`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ColorThemeProvider>
          <div className="min-h-screen flex flex-col pb-16 md:pb-0">
            <Header />
            <main className="flex-1">
              {children}
            </main>
            <Suspense fallback={null}><Footer /></Suspense>
            <Suspense fallback={null}><MobileBottomNav /></Suspense>
          </div>
          </ColorThemeProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
