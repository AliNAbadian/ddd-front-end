import type { Product } from '@/features/products/domain/models/Product'
import { cn } from '@/shared/lib/cn'

type ProductCardProps = {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const stockState = stockStateFor(product)

  return (
    <article className="rounded-xl border border-neutral-200 bg-white p-4 text-left shadow-md dark:border-neutral-700 dark:bg-neutral-900">
      <header className="flex items-baseline justify-between gap-3">
        <h3 className="m-0 text-base font-semibold text-neutral-900 dark:text-neutral-50">
          {product.name}
        </h3>
        <span className="whitespace-nowrap tabular-nums text-neutral-900 dark:text-neutral-100">
          $
          {product.price.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          })}
        </span>
      </header>
      <p className="mt-1 capitalize text-sm text-neutral-500 dark:text-neutral-400">
        {product.category}
      </p>
      <div className="mt-3 flex items-center justify-between gap-2">
        <span
          className={cn(
            'text-sm font-medium',
            stockState === 'ok' &&
              'text-emerald-600 dark:text-emerald-400',
            stockState === 'low' &&
              'text-amber-600 dark:text-amber-300',
            stockState === 'out' &&
              'text-red-600 dark:text-red-300',
          )}
        >
          {product.getStockStatusLabel()}
        </span>
        <span className="tabular-nums text-sm text-neutral-600 dark:text-neutral-400">
          {product.stock} in stock
        </span>
      </div>
    </article>
  )
}

function stockStateFor(product: Product): 'ok' | 'low' | 'out' {
  if (!product.isInStock()) return 'out'
  if (product.isLowStock()) return 'low'
  return 'ok'
}
