"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, ShoppingBag, CalendarDays, LayoutDashboard } from "lucide-react";
import type { Profile } from "@/lib/db.types";

export function AuthButton() {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        setProfile(data);
      }
    };
    fetch();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  if (!profile) {
    return (
      <Button asChild variant="default" size="sm">
        <Link href="/auth/login">เข้าสู่ระบบ</Link>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <User size={18} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[170px]">
        <DropdownMenuItem className="font-medium text-sm" disabled>
          {profile.display_name || profile.id.slice(0, 8)}
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
            <User size={14} />
            โปรไฟล์
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/rentals" className="flex items-center gap-2 cursor-pointer">
            <ShoppingBag size={14} />
            รายการเช่า
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/appointments" className="flex items-center gap-2 cursor-pointer">
            <CalendarDays size={14} />
            การนัดหมาย
          </Link>
        </DropdownMenuItem>
        {profile.role === 'admin' && (
          <DropdownMenuItem asChild>
            <Link href="/admin" className="flex items-center gap-2 cursor-pointer">
              <LayoutDashboard size={14} />
              แผงจัดการ
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 cursor-pointer text-destructive">
          <LogOut size={14} />
          ออกจากระบบ
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
