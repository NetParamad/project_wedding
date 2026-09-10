# Project Store

ระบบร้านเช่าชุดแต่งงานพร้อมระบบนัดหมาย — สร้างด้วย [Next.js](https://nextjs.org) (App Router) + [Supabase](https://supabase.com)

## Features

- **สินค้า/หมวดหมู่** — จัดการชุดแต่งงาน, รูปภาพ, ราคาเช่า, เงินมัดจำ
- **การจองเช่า (Rentals)** — จองเช่าชุดตามช่วงวันที่, ตรวจสอบวันว่าง/ไม่ว่าง
- **การนัดหมาย (Appointments)** — นัดลองชุด/ปรึกษา, จองช่วงเวลา
- **ล็อควันจอง (Date Locks)** — Admin ล็อคช่วงวันที่ไม่ให้จอง
- **Admin Dashboard** — จัดการสินค้า, การจอง, นัดหมาย, ตั้งค่าร้าน
- **ปฏิทินวันว่าง** — แสดงวันว่าง/ไม่ว่าง (ล็อค + เช่า + นัด) พร้อมรายละเอียดเมื่อคลิก

## Tech Stack

- **Next.js 15** (App Router, Server Actions)
- **Supabase** (Auth, PostgreSQL, RLS, Storage)
- **Tailwind CSS + shadcn/ui**
- **vitest** สำหรับ unit tests

## Getting Started

### 1. Setup Environment Variables

สร้าง `.env.local` จากตัวอย่าง:

```env
NEXT_PUBLIC_SUPABASE_URL=[SUPABASE PROJECT URL]
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=[SUPABASE ANON KEY]
```

### 2. รัน Database Migration

> **สำคัญ:** ต้องรัน migration ก่อนใช้งาน เพราะระบบตรวจสอบวันว่างใช้ SQL Functions (SECURITY DEFINER) ที่ต้องสร้างใน database

```bash
supabase db push
```

หรือรันจากไฟล์ใน Supabase Dashboard → SQL Editor:

- `supabase/migrations/00001_initial_schema.sql`
- `supabase/migrations/00002_storage_bucket.sql`

Functions สำคัญ (bypass RLS เพื่อตรวจสอบวันว่าง):

| Function | ใช้ทำอะไร |
|----------|-----------|
| `check_product_available` | ตรวจว่าสินค้าว่างในช่วงวันที่หรือไม่ |
| `get_product_unavailable_dates` | หาวันที่ที่ไม่ว่าง (lock + เช่า + นัด) |
| `get_appointments_for_date` | หาเวลาที่จองแล้วของวัน |
| `get_rentals_for_calendar` | หาข้อมูลการเช่าของสินค้า |

### 3. รัน Development Server

```bash
npm install
npm run dev
```

เปิด [http://localhost:3000](http://localhost:3000)

## Scripts

| คำสั่ง | คำอธิบาย |
|--------|----------|
| `npm run dev` | รัน dev server |
| `npm run build` | build production |
| `npm run start` | รัน production build |
| `npm run lint` | ตรวจ ESLint |
| `npm test` | รัน unit tests (vitest) |

## Architecture Notes

### `/api/store-asset` Proxy

รูปภาพโลโก้/QR ของร้านถูกเก็บใน bucket `store-assets` (ไม่ใช่ public bucket) ดังนั้นจึง serve ผ่าน API route:

```
/api/store-asset?path=<relative-path>
```

Route handler อ่านไฟล์จาก Supabase Storage ฝั่ง server แล้วคืนเป็น response พร้อม cache 1 ปี

### การตรวจสอบวันว่าง

- **ฝั่ง UI** — `get_product_unavailable_dates` (RPC) เพื่อแสดงวันที่ไม่ว่างในปฏิทิน
- **ฝั่ง Server (submit)** — `check_product_available` (RPC) เพื่อตรวจอีกครั้งก่อนบันทึก
- **Rental** ใช้ `block_appointments = true` (นัดแต่งตัวก็ block วันเช่าได้)
- **Appointment** ใช้ `block_appointments = false` (จองหลายช่วงเวลาในวันเดียวกันได้)

### Tests

```bash
npm test
```

Tests อยู่ที่ `lib/__tests__/` ครอบคลุมฟังก์ชัน pure ใน `lib/date-utils.ts` (การสร้างช่วงวันที่, การตรวจ overlap, การ format วันที่)
