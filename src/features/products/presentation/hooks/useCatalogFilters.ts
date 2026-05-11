import { useCallback, useState } from 'react'
import type { ProductFilters } from '@/features/products/domain/services/ProductFilterService'

export function useCatalogFilters() {
  const [filters, setFilters] = useState<ProductFilters>({})

  const setSearchTerm = useCallback((value: string) => {
    setFilters((prev) => ({
      ...prev,
      searchTerm: value === '' ? undefined : value,
    }))
  }, [])

  const setCategory = useCallback((value: string) => {
    setFilters((prev) => ({
      ...prev,
      category: value === '' ? undefined : value,
    }))
  }, [])

  const setInStockOnly = useCallback((value: boolean) => {
    setFilters((prev) => ({
      ...prev,
      inStock: value ? true : undefined,
    }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({})
  }, [])

  return {
    filters,
    setSearchTerm,
    setCategory,
    setInStockOnly,
    clearFilters,
  }
}
