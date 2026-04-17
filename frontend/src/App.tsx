import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'

type Priority = 'High' | 'Medium' | 'Low'

interface PrioritizedTask {
  task: string
  priority: Priority
  category: string
}

const STORAGE_KEY = 'ai-task-organizer:tasks'
const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'

function App() {
  const [taskInput, setTaskInput] = useState('')
  const [tasks, setTasks] = useState<string[]>(() => {
    const rawValue = window.localStorage.getItem(STORAGE_KEY)
    if (!rawValue) {
      return []
    }

    try {
      const parsed = JSON.parse(rawValue)
      return Array.isArray(parsed) && parsed.every((item) => typeof item === 'string')
        ? parsed
        : []
    } catch {
      return []
    }
  })
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingText, setEditingText] = useState('')
  const [prioritizedTasks, setPrioritizedTasks] = useState<PrioritizedTask[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  /**
   * Persists only raw user tasks to localStorage based on assignment requirement.
   */
  useEffect(() => {
    if (tasks.length === 0) {
      window.localStorage.removeItem(STORAGE_KEY)
      return
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
  }, [tasks])

  /**
   * Produces grouped result buckets for clear high/medium/low rendering.
   */
  const groupedResults = useMemo(() => {
    return {
      High: prioritizedTasks.filter((item) => item.priority === 'High'),
      Medium: prioritizedTasks.filter((item) => item.priority === 'Medium'),
      Low: prioritizedTasks.filter((item) => item.priority === 'Low'),
    }
  }, [prioritizedTasks])

  /**
   * Adds a non-empty task and resets stale AI/error states to keep UI coherent.
   */
  function handleAddTask(event: FormEvent) {
    event.preventDefault()
    const normalizedTask = taskInput.trim()
    if (!normalizedTask) {
      return
    }

    setTasks((previous) => [...previous, normalizedTask])
    setTaskInput('')
    setErrorMessage('')
    setPrioritizedTasks([])
  }

  /**
   * Removes one task and clears stale prioritization because source list changed.
   */
  function handleDeleteTask(index: number) {
    setTasks((previous) => previous.filter((_, currentIndex) => currentIndex !== index))
    setPrioritizedTasks([])
    setErrorMessage('')
    if (editingIndex === index) {
      setEditingIndex(null)
      setEditingText('')
    }
  }

  /**
   * Starts inline edit mode for a single task by index.
   */
  function handleStartEditing(index: number) {
    setEditingIndex(index)
    setEditingText(tasks[index])
  }

  /**
   * Saves edited task text and resets edit state when content is valid.
   */
  function handleSaveEditing(index: number) {
    const normalizedTask = editingText.trim()
    if (!normalizedTask) {
      return
    }

    setTasks((previous) =>
      previous.map((task, currentIndex) => (currentIndex === index ? normalizedTask : task)),
    )
    setEditingIndex(null)
    setEditingText('')
    setPrioritizedTasks([])
    setErrorMessage('')
  }

  /**
   * Calls backend prioritize API and validates response shape before rendering.
   */
  async function handlePrioritizeTasks() {
    if (tasks.length === 0) {
      setErrorMessage('Add at least one task before prioritizing.')
      return
    }

    setIsLoading(true)
    setErrorMessage('')

    try {
      const response = await fetch(`${API_BASE_URL}/prioritize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tasks }),
      })

      if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as
          | { error?: { message?: string } }
          | null
        throw new Error(
          errorPayload?.error?.message ??
            'Failed to prioritize tasks. Please try again.',
        )
      }

      const data = (await response.json()) as unknown
      if (!Array.isArray(data)) {
        throw new Error('Unexpected prioritize response format from server.')
      }

      const validated = data
        .map((item) => item as Partial<PrioritizedTask>)
        .filter(
          (item): item is PrioritizedTask =>
            Boolean(item.task) &&
            Boolean(item.category) &&
            (item.priority === 'High' ||
              item.priority === 'Medium' ||
              item.priority === 'Low'),
        )

      if (validated.length === 0) {
        throw new Error('AI response did not include valid prioritized tasks.')
      }

      setPrioritizedTasks(validated)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected error occurred.'
      setErrorMessage(message)
      setPrioritizedTasks([])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-cyan-50 via-slate-50 to-stone-100 p-4 md:p-8">
      <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-cyan-100 bg-white/90 p-5 shadow-[0_16px_45px_rgba(8,47,73,0.12)]">
          <div className="mb-5">
            <h1 className="text-3xl font-bold tracking-tight text-cyan-900">
              Smart To-Do List
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Add tasks, edit them, and use AI to prioritize by urgency.
            </p>
          </div>

          <form className="mb-4 flex flex-col gap-3 sm:flex-row" onSubmit={handleAddTask}>
            <input
              className="w-full rounded-xl border border-cyan-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none ring-cyan-500 transition focus:ring-2"
              type="text"
              placeholder="Add a task..."
              value={taskInput}
              onChange={(event) => setTaskInput(event.target.value)}
              aria-label="Task input"
            />
            <button
              className="rounded-xl bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-800"
              type="submit"
            >
              Add Task
            </button>
          </form>

          <div>
            <h2 className="mb-3 text-lg font-semibold text-cyan-900">
              Unsorted Tasks ({tasks.length})
            </h2>
            {tasks.length === 0 ? (
              <p className="text-sm text-slate-500">No tasks added yet.</p>
            ) : (
              <ul className="space-y-2">
                {tasks.map((task, index) => (
                  <li
                    key={`${task}-${index}`}
                    className="rounded-xl border border-cyan-100 bg-cyan-50/50 p-3"
                  >
                    {editingIndex === index ? (
                      <div className="grid gap-2">
                        <input
                          className="w-full rounded-lg border border-cyan-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none ring-cyan-500 transition focus:ring-2"
                          type="text"
                          value={editingText}
                          onChange={(event) => setEditingText(event.target.value)}
                          aria-label="Edit task"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="rounded-lg bg-cyan-100 px-3 py-1.5 text-xs font-semibold text-cyan-900 transition hover:bg-cyan-200"
                            onClick={() => handleSaveEditing(index)}
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
                            onClick={() => {
                              setEditingIndex(null)
                              setEditingText('')
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-sm font-medium text-slate-800">{task}</span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="rounded-lg bg-cyan-100 px-3 py-1.5 text-xs font-semibold text-cyan-900 transition hover:bg-cyan-200"
                            onClick={() => handleStartEditing(index)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="rounded-lg bg-rose-100 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-200"
                            onClick={() => handleDeleteTask(index)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button
            className="mt-4 w-full rounded-xl bg-gradient-to-r from-cyan-700 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white transition enabled:hover:from-cyan-800 enabled:hover:to-cyan-600 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={handlePrioritizeTasks}
            disabled={isLoading || tasks.length === 0}
          >
            {isLoading ? 'Prioritizing...' : 'Prioritize Tasks'}
          </button>

          {errorMessage ? (
            <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {errorMessage}
            </div>
          ) : null}
        </section>

        <section className="rounded-2xl border border-cyan-100 bg-white/90 p-5 shadow-[0_16px_45px_rgba(8,47,73,0.12)]">
          <div className="mb-5">
            <h2 className="text-2xl font-bold tracking-tight text-cyan-900">
              Prioritized Results
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Grouped by AI-estimated urgency and importance.
            </p>
          </div>

          {prioritizedTasks.length === 0 ? (
            <p className="text-sm text-slate-500">No prioritized output yet.</p>
          ) : (
            <div className="grid gap-3">
              {(['High', 'Medium', 'Low'] as Priority[]).map((priority) => (
                <div
                  key={priority}
                  className="rounded-xl border border-cyan-100 bg-cyan-50/40 p-3"
                >
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
                          <small className="mt-1 inline-block text-xs text-slate-500">
                            {item.category}
                          </small>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
        </div>
    </main>
  )
}

export default App
