import type { ProductFilters } from '@/features/products/domain/services/ProductFilterService'

type CatalogToolbarProps = {
  filters: ProductFilters
  categories: string[]
  searchValue: string
  onSearchChange: (value: string) => void
  onCategoryChange: (value: string) => void
  onToggleInStockOnly: () => void
  onClear: () => void
}

export function CatalogToolbar({
  filters,
  categories,
  searchValue,
  onSearchChange,
  onCategoryChange,
  onToggleInStockOnly,
  onClear,
}: CatalogToolbarProps) {
  return (
    <div className="mb-6 flex flex-wrap items-end gap-4 text-left">
      <div className="flex min-w-[200px] flex-1 flex-col gap-1.5 basis-[210px]">
        <label
          className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400"
          htmlFor="catalog-search"
        >
          Search
        </label>
        <input
          id="catalog-search"
          className="rounded-lg border border-neutral-300 bg-white px-2.5 py-2 font-inherit text-inherit outline-none ring-violet-500/40 placeholder:text-neutral-400 focus-visible:ring-2 dark:border-neutral-600 dark:bg-neutral-950"
          type="search"
          placeholder="By product name…"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="flex min-w-[160px] flex-col gap-1.5">
        <label
          className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400"
          htmlFor="catalog-category"
        >
          Category
        </label>
        <select
          id="catalog-category"
          className="rounded-lg border border-neutral-300 bg-white px-2.5 py-2 font-inherit text-inherit outline-none ring-violet-500/40 focus-visible:ring-2 dark:border-neutral-600 dark:bg-neutral-950"
          value={filters.category ?? ''}
          onChange={(e) => onCategoryChange(e.target.value)}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <fieldset className="m-0 border-0 p-0">
        <legend className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
          Stock
        </legend>
        <label className="inline-flex items-center gap-2 text-sm text-neutral-800 dark:text-neutral-200">
          <input
            className="size-4 rounded border-neutral-300 text-violet-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 dark:border-neutral-600"
            type="checkbox"
            checked={Boolean(filters.inStock)}
            onChange={onToggleInStockOnly}
          />
          In stock only
        </label>
      </fieldset>

      <button
        type="button"
        className="self-center rounded-lg border border-violet-500/50 bg-violet-500/10 px-4 py-2 text-sm font-medium text-neutral-900 hover:opacity-90 dark:bg-violet-500/15 dark:text-neutral-100"
        onClick={onClear}
      >
        Reset
      </button>
    </div>
  )
}
