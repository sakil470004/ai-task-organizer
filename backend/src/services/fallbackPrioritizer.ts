import type { PrioritizedTask, Priority } from '../types.js'

const HIGH_KEYWORDS = [
  'urgent',
  'asap',
  'today',
  'deadline',
  'boss',
  'report',
  'meeting',
  'interview',
  'pay',
  'invoice',
  'doctor',
  'hospital',
  'plumber',
  'leak',
  'repair',
]

const MEDIUM_KEYWORDS = [
  'buy',
  'groceries',
  'clean',
  'plan',
  'schedule',
  'email',
  'call',
  'book',
  'renew',
]

/**
 * Generates deterministic prioritization when AI provider is unavailable.
 */
export function fallbackPrioritizeTasks(tasks: string[]): PrioritizedTask[] {
  return tasks
    .map((task) => {
      const normalized = task.toLowerCase()
      const priority = inferPriority(normalized)
      const category = inferCategory(normalized)

      return {
        task,
        priority,
        category,
      }
    })
    .sort((a, b) => rankPriority(a.priority) - rankPriority(b.priority))
}

function inferPriority(normalizedTask: string): Priority {
  if (HIGH_KEYWORDS.some((keyword) => normalizedTask.includes(keyword))) {
    return 'High'
  }

  if (MEDIUM_KEYWORDS.some((keyword) => normalizedTask.includes(keyword))) {
    return 'Medium'
  }

  return 'Low'
}

function inferCategory(normalizedTask: string): string {
  if (
    ['report', 'boss', 'meeting', 'q4', 'presentation', 'email', 'project'].some((keyword) =>
      normalizedTask.includes(keyword),
    )
  ) {
    return 'Work'
  }

  if (
    ['groceries', 'plumber', 'leak', 'clean', 'home', 'kitchen', 'laundry'].some((keyword) =>
      normalizedTask.includes(keyword),
    )
  ) {
    return 'Home'
  }

  return 'Personal'
}

function rankPriority(priority: Priority): number {
  if (priority === 'High') {
    return 1
  }

  if (priority === 'Medium') {
    return 2
  }

  return 3
}
