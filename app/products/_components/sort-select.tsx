'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

const SORT_OPTIONS = [
  { value: '', label: 'ล่าสุด' },
  { value: 'oldest', label: 'นานสุด' },
  { value: 'price_desc', label: 'ราคาสูงสุด' },
  { value: 'price_asc', label: 'ราคาต่ำสุด' },
] as const

export function SortSelect() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const current = searchParams.get('sort') ?? ''

  const valid = SORT_OPTIONS.some((opt) => opt.value === current) ? current : ''

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set('sort', value)
    } else {
      params.delete('sort')
    }
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <select
      value={valid}
      onChange={(e) => handleChange(e.target.value)}
      aria-label="จัดเรียงสินค้า"
      className="h-9 w-full min-w-0 cursor-pointer rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
    >
      {SORT_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}