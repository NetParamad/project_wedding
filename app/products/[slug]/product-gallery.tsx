'use client'

import { useState } from 'react'
import type { ProductImage } from '@/lib/db.types'

interface Props {
  images: ProductImage[]
  productName: string
}

export function ProductGallery({ images, productName }: Props) {
  const sortedImages = [...images].sort((a, b) =>
    a.is_primary ? -1 : b.is_primary ? 1 : 0
  )
  const [selectedIdx, setSelectedIdx] = useState(0)

  if (images.length === 0) return null

  const selected = sortedImages[selectedIdx]

  return (
    <div className="space-y-3">
      <div className="aspect-square rounded-lg border bg-muted overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={selected.url}
          alt={productName}
          className="h-full w-full object-cover"
        />
      </div>
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {sortedImages.map((img, idx) => (
            <div
              key={img.id}
              className={`aspect-square rounded-md border bg-muted overflow-hidden cursor-pointer transition-all ${
                idx === selectedIdx ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedIdx(idx)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
