export function LoadingSpinner({ label }: { label?: string }) {
  return (
    <output className="inline-flex items-center gap-3" aria-live="polite">
      <span
        className="size-5 animate-spin rounded-full border-2 border-neutral-300 border-t-violet-600 dark:border-neutral-600 dark:border-t-violet-400"
        aria-hidden
      />
      <span className="text-sm text-neutral-700 dark:text-neutral-300">
        {label ?? 'Loading…'}
      </span>
    </output>
  )
}
