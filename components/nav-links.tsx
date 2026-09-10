"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Package, Store, Mail } from "lucide-react";

const icons = { home: House, products: Package, about: Store, contact: Mail } as const;

export function NavLinks({ labels }: { labels: Record<keyof typeof icons, string> }) {
  const pathname = usePathname();

  return (Object.entries(labels) as [keyof typeof icons, string][]).map(([key, label]) => {
    const href = key === "home" ? "/" : `/${key}`;
    const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
    const Icon = icons[key];

    return (
      <Link
        key={href}
        href={href}
        className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
          isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Icon size={16} />
        {label}
      </Link>
    );
  });
}
