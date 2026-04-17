/**
 * Priority levels accepted by API and rendered by the UI.
 */
export type Priority = 'High' | 'Medium' | 'Low'

/**
 * A single prioritized task row returned from backend sorting.
 */
export interface PrioritizedTask {
  task: string
  priority: Priority
  category: string
}

/**
 * A single saved snapshot record for result-history switching.
 */
export interface SavedSnapshot {
  id: string
  sortedAt: string
  sourceTasks: string[]
  prioritizedTasks: PrioritizedTask[]
}

/**
 * Top-level UI mode state for switching between task editor and result view.
 */
export type ViewMode = 'tasks' | 'results'
