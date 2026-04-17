import type { Priority, SavedSnapshot } from '../types/task'
import { motion } from 'framer-motion'
import { FiClock, FiRefreshCcw, FiSave } from 'react-icons/fi'

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
  const priorityStyles: Record<Priority, string> = {
    High: 'border-rose-200 bg-rose-50/60',
    Medium: 'border-amber-200 bg-amber-50/60',
    Low: 'border-emerald-200 bg-emerald-50/60',
  }

  return (
    <motion.section
      className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur md:p-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Prioritized Results</h2>
          <p className="mt-1 text-sm text-slate-600">Just sorted output grouped by priority.</p>
          {activeSnapshot ? (
            <p className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500">
              <FiClock size={12} aria-hidden="true" />
              Last sorted: {new Date(activeSnapshot.sortedAt).toLocaleString()}
            </p>
          ) : null}
          {activeSnapshot ? (
            <span className="mt-2 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
              {isShowingSaved ? 'Saved Record' : 'Current Result'}
            </span>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <motion.button
            type="button"
            disabled={!activeSnapshot || isShowingSaved}
            onClick={onSaveSnapshot}
            className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition enabled:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            whileHover={{ y: -1, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
          >
            <FiSave size={13} aria-hidden="true" />
            Save Result
          </motion.button>
          <motion.button
            type="button"
            disabled={!savedSnapshot || !activeSnapshot || activeSnapshot.id === savedSnapshot.id}
            onClick={onSwitchSnapshot}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition enabled:hover:border-sky-300 enabled:hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
            whileHover={{ y: -1, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
          >
            <FiRefreshCcw size={13} aria-hidden="true" />
            Switch To Saved
          </motion.button>
        </div>
      </div>

      {!activeSnapshot ? (
        <p className="text-sm text-slate-500">No prioritized output yet. Prioritize from task view first.</p>
      ) : (
        <div className="grid gap-3">
          {(['High', 'Medium', 'Low'] as Priority[]).map((priority, groupIndex) => (
            <motion.div
              key={priority}
              className={`rounded-2xl border p-3 ${priorityStyles[priority]}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, delay: groupIndex * 0.05, ease: 'easeOut' }}
            >
              <h3 className="mb-2 flex items-center justify-between text-base font-semibold text-slate-800">
                <span>{priority} Priority</span>
                <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs text-slate-700">
                  {groupedResults[priority].length}
                </span>
              </h3>
              {groupedResults[priority].length === 0 ? (
                <p className="text-sm text-slate-500">No tasks in this group.</p>
              ) : (
                <ul className="space-y-2">
                  {groupedResults[priority].map((item, index) => (
                    <motion.li
                      key={`${item.task}-${index}`}
                      className="rounded-xl border border-slate-200/80 bg-white/90 p-2.5"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.18, delay: index * 0.03, ease: 'easeOut' }}
                    >
                      <p className="text-sm font-medium text-slate-800">{item.task}</p>
                      <small className="mt-1 inline-block text-xs text-slate-500">{item.category}</small>
                    </motion.li>
                  ))}
                </ul>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </motion.section>
  )
}
