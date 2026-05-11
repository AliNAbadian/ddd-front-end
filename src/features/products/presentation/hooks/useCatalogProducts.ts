import { useMemo } from 'react'
import {
  ProductFilterService,
  type ProductFilters,
} from '@/features/products/domain/services/ProductFilterService'
import { useProductsQuery } from '@/features/products/infrastructure/api/productsQueries'

const filterService = new ProductFilterService()

export function useCatalogProducts(filters: ProductFilters) {
  const {
    data: catalog = [],
    ...queryRest
  } = useProductsQuery()

  const categories = useMemo(
    () => [...new Set(catalog.map((p) => p.category))].sort(),
    [catalog],
  )

  const products = useMemo(
    () => filterService.filterProducts(catalog, filters),
    [catalog, filters],
  )

  return {
    ...queryRest,
    products,
    categories,
  }
}
