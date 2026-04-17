import type { ViewMode } from '../types/task'
import { motion } from 'framer-motion'
import { FiArrowRightCircle, FiBookOpen, FiList } from 'react-icons/fi'

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
    <motion.div
      className="mb-5 rounded-2xl border border-white/50 bg-white/70 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur md:mb-6 md:flex md:items-center md:justify-between md:gap-4 md:p-5"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
    >
      <div>
        <h1 className="flex items-center justify-between gap-2 text-xl font-semibold tracking-tight text-slate-900 md:text-3xl">
          Smart To-Do List
          <FiBookOpen size={30} aria-hidden="true" className="text-sky-700" />
        </h1>
        <p className="mt-1 text-sm text-slate-500">Plan quickly. Prioritize clearly.</p>
      </div>
      <motion.button
        type="button"
        onClick={onToggleView}
        disabled={!canOpenResults && viewMode === 'tasks'}
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-sky-300 hover:text-sky-700 enabled:hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60 md:mt-0 md:w-auto"
        whileHover={{ y: -1, scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
      >
        {viewMode === 'tasks' ? (
          <>
            <FiArrowRightCircle size={15} aria-hidden="true" />
            View Prioritized Results
          </>
        ) : (
          <>
            <FiList size={15} aria-hidden="true" />
            Back To Tasks
          </>
        )}
      </motion.button>
    </motion.div>
  )
}
