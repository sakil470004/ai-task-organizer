import type { PrioritizedTask, Priority } from '../types.js'

const ALLOWED_PRIORITIES: Priority[] = ['High', 'Medium', 'Low']

/**
 * Extracts a JSON payload from plain text or fenced markdown and validates shape.
 */
export function parseAndValidateAiResponse(rawText: string): PrioritizedTask[] {
  const text = rawText.trim()
  const candidate = text.startsWith('```')
    ? text
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim()
    : text

  const parsed = JSON.parse(candidate)

  if (!Array.isArray(parsed)) {
    throw new Error('AI response is not an array')
  }

  return parsed.map((item, index) => normalizeItem(item, index))
}

/**
 * Converts unknown AI object into strict output format expected by frontend.
 */
function normalizeItem(item: unknown, index: number): PrioritizedTask {
  if (!item || typeof item !== 'object') {
    throw new Error(`AI response item at index ${index} is not an object`)
  }

  const maybeItem = item as Record<string, unknown>
  const task = String(maybeItem.task ?? '').trim()
  const category = String(maybeItem.category ?? '').trim()
  const priority = String(maybeItem.priority ?? '').trim()

  if (!task) {
    throw new Error(`AI response item at index ${index} has an empty task`) 
  }

  if (!category) {
    throw new Error(`AI response item at index ${index} has an empty category`)
  }

  const normalizedPriority =
    priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase()

  if (!ALLOWED_PRIORITIES.includes(normalizedPriority as Priority)) {
    throw new Error(`AI response item at index ${index} has invalid priority`) 
  }

  return {
    task,
    category,
    priority: normalizedPriority as Priority,
  }
}
