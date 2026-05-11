import { CatalogList } from '@/features/products/presentation/components/logic/CatalogList'

export function PresentationTestPage() {
  return (
    <main className="mx-auto flex w-full max-w-[980px] flex-1 flex-col items-stretch px-4 py-6 text-left sm:px-8 sm:py-10">
      <header className="mb-8">
        <span className="inline-flex rounded-full border border-violet-500/50 bg-violet-500/10 px-2.5 py-1 text-[0.74rem] font-medium uppercase tracking-widest text-neutral-900 dark:bg-violet-500/15 dark:text-neutral-100">
          Presentation demo
        </span>
        <h1 className="mb-2 mt-3 text-balance font-medium text-neutral-950 dark:text-neutral-50 text-[clamp(2rem,5vw,3rem)] leading-tight tracking-tight">
          Product catalog
        </h1>

      </header>

      <CatalogList />
    </main>
  )
}
