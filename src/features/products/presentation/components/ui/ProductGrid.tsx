import type { Product } from '@/features/products/domain/models/Product'
import { ProductCard } from '@/features/products/presentation/components/ui/ProductCard'

type ProductGridProps = {
  products: Product[]
}

export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <p className="m-0 text-left text-neutral-600 opacity-90 dark:text-neutral-400">
        No items match these filters.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
