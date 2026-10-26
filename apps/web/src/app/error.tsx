'use client'
 
import { useEffect } from 'react'
 
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])
 
  return (
    <div className="flex h-screen flex-col items-center justify-center p-6 text-center">
      <h2 className="mb-4 text-2xl font-bold text-red-600">Something went wrong!</h2>
      <div className="mb-6 rounded-lg bg-red-50 p-4 text-left border border-red-200 overflow-auto max-w-2xl w-full">
        <p className="font-mono text-sm text-red-800 break-words">{error.message}</p>
        {error.stack && (
          <pre className="mt-4 font-mono text-xs text-red-700 whitespace-pre-wrap">{error.stack}</pre>
        )}
      </div>
      <button
        onClick={() => reset()}
        className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary/90"
      >
        Try again
      </button>
    </div>
  )
}
