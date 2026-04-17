import type { ViewMode } from '../types/task'

interface AppHeaderProps {
  viewMode: ViewMode
  canOpenResults: boolean
  onToggleView: () => void
}

/**
 * Renders the app title and a mode-switch button beside the heading.
 */
export function AppHeader({ viewMode, canOpenResults, onToggleView }: AppHeaderProps) {
  return (
    <div className="mb-5 flex items-center justify-between gap-3">
      <h1 className="text-3xl font-bold tracking-tight text-cyan-900">Smart To-Do List</h1>
      <button
        type="button"
        onClick={onToggleView}
        disabled={!canOpenResults && viewMode === 'tasks'}
        className="rounded-xl bg-cyan-700 px-4 py-2 text-sm font-semibold text-white transition enabled:hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {viewMode === 'tasks' ? 'Open Prioritized Results' : 'Back To Task Editor'}
      </button>
    </div>
  )
}
