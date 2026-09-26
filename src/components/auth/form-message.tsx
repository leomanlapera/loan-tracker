import type { ActionState } from '@/app/(auth)/actions'

export function FormMessage({ state }: { state: ActionState }) {
  if (!state) return null
  if (state.ok) {
    if (!state.message) return null
    return (
      <p role="status" className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
        {state.message}
      </p>
    )
  }
  return (
    <p role="alert" className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
      {state.error}
    </p>
  )
}
