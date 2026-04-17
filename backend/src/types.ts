/**
 * Priority levels supported by the UI and AI contract.
 */
export type Priority = 'High' | 'Medium' | 'Low'

/**
 * A normalized task item returned from AI prioritization.
 */
export interface PrioritizedTask {
  task: string
  priority: Priority
  category: string
}

/**
 * Standardized API error body shape.
 */
export interface ApiErrorBody {
  error: {
    code: string
    message: string
  }
}
