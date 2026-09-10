"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { Category } from "@/lib/db.types";
import { cn } from "@/lib/utils";

interface Props {
  categories: Category[];
  selected?: number;
  mobile?: boolean;
}

export function CategoryFilter({
  categories,
  selected,
  mobile,
}: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function buildUrl(categoryId?: number) {
    const p = new URLSearchParams(searchParams.toString());
    if (categoryId) {
      p.set("category", categoryId.toString());
    } else {
      p.delete("category");
    }
    p.delete("page");
    const qs = p.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  if (mobile) {
    return (
      <>
        <Link
          href={buildUrl()}
          className={cn(
            "whitespace-nowrap px-3 py-1.5 rounded-full text-sm border transition-colors",
            !selected
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background hover:bg-accent",
          )}
        >
          ทุกหมวดหมู่
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={buildUrl(cat.id)}
            className={cn(
              "whitespace-nowrap px-3 py-1.5 rounded-full text-sm border transition-colors",
              selected === cat.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background hover:bg-accent",
            )}
          >
            {cat.name}
          </Link>
        ))}
      </>
    );
  }

  return (
    <div className="space-y-1">
      <h3 className="text-sm font-medium text-muted-foreground mb-2">
        หมวดหมู่
      </h3>
      <Link
        href={buildUrl()}
        className={cn(
          "block px-3 py-2 rounded-md text-sm transition-colors",
          !selected
            ? "bg-primary/10 text-primary font-medium"
            : "hover:bg-accent text-muted-foreground",
        )}
      >
        ทุกหมวดหมู่
      </Link>
      {categories.map((cat) => (
        <Link
          key={cat.id}
          href={buildUrl(cat.id)}
          className={cn(
            "block px-3 py-2 rounded-md text-sm transition-colors",
            selected === cat.id
              ? "bg-primary/10 text-primary font-medium"
              : "hover:bg-accent text-muted-foreground",
          )}
        >
          {cat.name}
        </Link>
      ))}
    </div>
  );
}
