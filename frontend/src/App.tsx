import { FormEvent, useEffect, useMemo, useState } from 'react'
import './App.css'

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
  const [tasks, setTasks] = useState<string[]>([])
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingText, setEditingText] = useState('')
  const [prioritizedTasks, setPrioritizedTasks] = useState<PrioritizedTask[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  /**
   * Hydrates task list from localStorage so user input survives refresh.
   */
  useEffect(() => {
    const rawValue = window.localStorage.getItem(STORAGE_KEY)
    if (!rawValue) {
      return
    }

    try {
      const parsed = JSON.parse(rawValue)
      if (Array.isArray(parsed) && parsed.every((item) => typeof item === 'string')) {
        setTasks(parsed)
      }
    } catch {
      setErrorMessage('Stored tasks were corrupted and could not be loaded.')
    }
  }, [])

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
    <main className="app-shell">
      <section className="panel">
        <div className="panel-head">
          <h1>Smart To-Do List</h1>
          <p>Add tasks, edit them, and use AI to prioritize by urgency.</p>
        </div>

        <form className="task-form" onSubmit={handleAddTask}>
          <input
            type="text"
            placeholder="Add a task..."
            value={taskInput}
            onChange={(event) => setTaskInput(event.target.value)}
            aria-label="Task input"
          />
          <button type="submit">Add Task</button>
        </form>

        <div className="task-list-wrap">
          <h2>Unsorted Tasks ({tasks.length})</h2>
          {tasks.length === 0 ? (
            <p className="muted">No tasks added yet.</p>
          ) : (
            <ul className="task-list">
              {tasks.map((task, index) => (
                <li key={`${task}-${index}`}>
                  {editingIndex === index ? (
                    <>
                      <input
                        type="text"
                        value={editingText}
                        onChange={(event) => setEditingText(event.target.value)}
                        aria-label="Edit task"
                      />
                      <div className="task-actions">
                        <button
                          type="button"
                          className="ghost"
                          onClick={() => handleSaveEditing(index)}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          className="ghost"
                          onClick={() => {
                            setEditingIndex(null)
                            setEditingText('')
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <span>{task}</span>
                      <div className="task-actions">
                        <button
                          type="button"
                          className="ghost"
                          onClick={() => handleStartEditing(index)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="ghost danger"
                          onClick={() => handleDeleteTask(index)}
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          className="primary"
          onClick={handlePrioritizeTasks}
          disabled={isLoading || tasks.length === 0}
        >
          {isLoading ? 'Prioritizing...' : 'Prioritize Tasks'}
        </button>

        {errorMessage ? <div className="error-box">{errorMessage}</div> : null}
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Prioritized Results</h2>
          <p>Grouped by AI-estimated urgency and importance.</p>
        </div>

        {prioritizedTasks.length === 0 ? (
          <p className="muted">No prioritized output yet.</p>
        ) : (
          <div className="result-groups">
            {(['High', 'Medium', 'Low'] as Priority[]).map((priority) => (
              <div key={priority} className="result-group">
                <h3>
                  {priority} Priority <span>{groupedResults[priority].length}</span>
                </h3>
                {groupedResults[priority].length === 0 ? (
                  <p className="muted">No tasks in this group.</p>
                ) : (
                  <ul>
                    {groupedResults[priority].map((item, index) => (
                      <li key={`${item.task}-${index}`}>
                        <p>{item.task}</p>
                        <small>{item.category}</small>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

export default App
