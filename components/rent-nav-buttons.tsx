'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function RentNavButtons() {
  const pathname = usePathname()
  const onRent = pathname.startsWith('/rentals/new')
  const onBook = pathname.startsWith('/appointments/book')

  function variant(key: 'rent' | 'book'): 'default' | 'outline' {
    if (key === 'rent') return onRent ? 'default' : 'outline'
    return onBook ? 'default' : 'outline'
  }

  return (
    <>
      <Button asChild variant={variant('rent')} size="sm">
        <Link href="/rentals/new">เช่าชุด</Link>
      </Button>
      <Button asChild variant={variant('book')} size="sm">
        <Link href="/appointments/book">นัดลองชุด</Link>
      </Button>
    </>
  )
}