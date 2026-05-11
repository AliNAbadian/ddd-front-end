import { LoadingSpinner } from '@/shared/presentation/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/shared/presentation/components/ui/ErrorMessage'
import { CatalogToolbar } from '@/features/products/presentation/components/ui/CatalogToolbar'
import { ProductGrid } from '@/features/products/presentation/components/ui/ProductGrid'
import { useCatalogProducts } from '@/features/products/presentation/hooks/useCatalogProducts'
import { useCatalogFilters } from '@/features/products/presentation/hooks/useCatalogFilters'

export function CatalogList() {
  const {
    filters,
    setSearchTerm,
    setCategory,
    setInStockOnly,
    clearFilters,
  } = useCatalogFilters()

  const {
    products,
    categories,
    isPending,
    isError,
    error,
    refetch,
  } = useCatalogProducts(filters)

  if (isPending) {
    return <LoadingSpinner label="Loading catalog…" />
  }

  if (isError) {
    const message =
      error instanceof Error ? error.message : 'Unable to load catalog.'
    return (
      <ErrorMessage
        title="Catalog unavailable"
        message={message}
        onRetry={() => refetch()}
      />
    )
  }

  return (
    <div className="w-full">
      <CatalogToolbar
        filters={filters}
        categories={categories}
        searchValue={filters.searchTerm ?? ''}
        onSearchChange={setSearchTerm}
        onCategoryChange={setCategory}
        onToggleInStockOnly={() => setInStockOnly(!filters.inStock)}
        onClear={clearFilters}
      />
      <ProductGrid products={products} />
    </div>
  )
}
