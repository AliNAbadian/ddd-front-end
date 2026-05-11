import type { Product } from '@/features/products/domain/models/Product'

export interface ProductFilters {
  category?: string
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  searchTerm?: string
}

export class ProductFilterService {
  filterProducts(products: Product[], filters: ProductFilters): Product[] {
    let filtered = [...products]

    if (filters.category) {
      filtered = filtered.filter((p) => p.category === filters.category)
    }

    if (filters.minPrice !== undefined) {
      filtered = filtered.filter((p) => p.price >= filters.minPrice!)
    }

    if (filters.maxPrice !== undefined) {
      filtered = filtered.filter((p) => p.price <= filters.maxPrice!)
    }

    if (filters.inStock !== undefined) {
      filtered = filtered.filter((p) => p.isInStock() === filters.inStock)
    }

    if (filters.searchTerm !== undefined) {
      const term = filters.searchTerm.trim().toLowerCase()
      if (term.length > 0) {
        filtered = filtered.filter((p) =>
          p.name.toLowerCase().includes(term),
        )
      }
    }

    return filtered
  }
}
