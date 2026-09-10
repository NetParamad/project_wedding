'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  currentPage: number
  totalPages: number
  searchParams: Record<string, string | undefined>
}

export function Pagination({ currentPage, totalPages, searchParams }: Props) {
  const pathname = usePathname()

  if (totalPages <= 1) return null

  function buildUrl(page: number) {
    const params = new URLSearchParams()
    if (searchParams.category) params.set('category', searchParams.category)
    if (searchParams.search) params.set('search', searchParams.search)
    if (page > 1) params.set('page', page.toString())
    const qs = params.toString()
    return qs ? `${pathname}?${qs}` : pathname
  }

  const pages: (number | '...')[] = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...')
    }
  }

  return (
    <div className="flex items-center justify-center gap-1 pt-4">
      <Button variant="outline" size="icon" asChild disabled={currentPage <= 1}>
        <Link
          href={buildUrl(currentPage - 1)}
          className={currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}
        >
          <ChevronLeft size={16} />
        </Link>
      </Button>

      {pages.map((page, idx) =>
        page === '...' ? (
          <span key={`dots-${idx}`} className="px-2 text-muted-foreground">
            ...
          </span>
        ) : (
          <Button
            key={page}
            variant={page === currentPage ? 'default' : 'outline'}
            size="sm"
            asChild
          >
            <Link href={buildUrl(page)}>{page}</Link>
          </Button>
        )
      )}

      <Button variant="outline" size="icon" asChild disabled={currentPage >= totalPages}>
        <Link
          href={buildUrl(currentPage + 1)}
          className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}
        >
          <ChevronRight size={16} />
        </Link>
      </Button>
    </div>
  )
}
