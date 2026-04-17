import type { Priority, SavedSnapshot } from '../types/task'

interface PrioritizedResultsPanelProps {
  activeSnapshot: SavedSnapshot | null
  savedSnapshot: SavedSnapshot | null
  onSaveSnapshot: () => void
  onSwitchSnapshot: () => void
}

/**
 * Results-only view that supports saving latest snapshot and switching to stored history.
 */
export function PrioritizedResultsPanel({
  activeSnapshot,
  savedSnapshot,
  onSaveSnapshot,
  onSwitchSnapshot,
}: PrioritizedResultsPanelProps) {
  const groupedResults = {
    High: activeSnapshot?.prioritizedTasks.filter((item) => item.priority === 'High') ?? [],
    Medium: activeSnapshot?.prioritizedTasks.filter((item) => item.priority === 'Medium') ?? [],
    Low: activeSnapshot?.prioritizedTasks.filter((item) => item.priority === 'Low') ?? [],
  }

  const isShowingSaved = activeSnapshot?.id === savedSnapshot?.id

  return (
    <section className="rounded-2xl border border-cyan-100 bg-white/90 p-5 shadow-[0_16px_45px_rgba(8,47,73,0.12)]">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-cyan-900">Prioritized Results</h2>
          <p className="mt-1 text-sm text-slate-600">Just sorted output grouped by priority.</p>
          {activeSnapshot ? (
            <p className="mt-1 text-xs text-slate-500">
              Last sorted: {new Date(activeSnapshot.sortedAt).toLocaleString()}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!activeSnapshot || isShowingSaved}
            onClick={onSaveSnapshot}
            className="rounded-lg bg-cyan-700 px-3 py-1.5 text-xs font-semibold text-white transition enabled:hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Save Result
          </button>
          <button
            type="button"
            disabled={!savedSnapshot || !activeSnapshot || activeSnapshot.id === savedSnapshot.id}
            onClick={onSwitchSnapshot}
            className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white transition enabled:hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Switch To Saved
          </button>
        </div>
      </div>

      {!activeSnapshot ? (
        <p className="text-sm text-slate-500">No prioritized output yet. Prioritize from task view first.</p>
      ) : (
        <div className="grid gap-3">
          {(['High', 'Medium', 'Low'] as Priority[]).map((priority) => (
            <div key={priority} className="rounded-xl border border-cyan-100 bg-cyan-50/40 p-3">
              <h3 className="mb-2 flex items-center justify-between text-base font-semibold text-cyan-900">
                <span>{priority} Priority</span>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-700">
                  {groupedResults[priority].length}
                </span>
              </h3>
              {groupedResults[priority].length === 0 ? (
                <p className="text-sm text-slate-500">No tasks in this group.</p>
              ) : (
                <ul className="space-y-2">
                  {groupedResults[priority].map((item, index) => (
                    <li
                      key={`${item.task}-${index}`}
                      className="rounded-lg border border-slate-200 bg-white p-2.5"
                    >
                      <p className="text-sm font-medium text-slate-800">{item.task}</p>
                      <small className="mt-1 inline-block text-xs text-slate-500">{item.category}</small>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
