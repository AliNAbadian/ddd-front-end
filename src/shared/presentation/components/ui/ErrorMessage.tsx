type ErrorMessageProps = {
  title?: string
  message: string
  onRetry?: () => void
}

export function ErrorMessage({
  title = 'Something went wrong',
  message,
  onRetry,
}: ErrorMessageProps) {
  return (
    <div
      className="rounded-lg border border-neutral-200 bg-violet-500/[0.06] p-4 text-left dark:border-neutral-600 dark:bg-violet-500/10"
      role="alert"
    >
      <strong className="mb-1 block text-sm font-semibold text-neutral-950 dark:text-neutral-50">
        {title}
      </strong>
      <p className="mb-3 m-0 text-neutral-700 dark:text-neutral-300">{message}</p>
      {onRetry && (
        <button
          type="button"
          className="rounded-lg border border-violet-500/50 bg-transparent px-3.5 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-100 dark:text-neutral-100 dark:hover:bg-neutral-800"
          onClick={onRetry}
        >
          Retry
        </button>
      )}
    </div>
  )
}
