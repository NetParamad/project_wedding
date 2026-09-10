import Link from 'next/link'
import { ImageIcon } from 'lucide-react'
import type { Product, ProductImage } from '@/lib/db.types'

interface Props {
  product: Product & { images?: ProductImage[] }
}

export async function ProductCard({ product }: Props) {
  const primaryImage = product.images?.find((img) => img.is_primary) ?? product.images?.[0]
  const displayName = product.name

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group rounded-lg border bg-background overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="aspect-square bg-muted relative overflow-hidden">
        {primaryImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={primaryImage.url}
            alt={product.name}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-muted-foreground">
            <ImageIcon size={40} strokeWidth={1.5} />
          </div>
        )}
      </div>
      <div className="p-3 space-y-1.5">
        <h3 className="font-medium text-sm line-clamp-1">{displayName}</h3>
        {Number(product.rental_price) > 0 && (
          <p className="text-xs text-muted-foreground">
            เช่า <span className="font-medium text-foreground">฿{Number(product.rental_price).toLocaleString()}</span>
            {Number(product.rental_deposit) > 0 && (
              <> + ประกัน ฿{Number(product.rental_deposit).toLocaleString()}</>
            )}
          </p>
        )}
      </div>
    </Link>
  )
}
