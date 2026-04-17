import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { AppHeader } from './components/AppHeader'
import { PrioritizedResultsPanel } from './components/PrioritizedResultsPanel'
import { TaskEditorPanel } from './components/TaskEditorPanel'
import type { PrioritizedTask, SavedSnapshot, ViewMode } from './types/task'

const STORAGE_KEY = 'ai-task-organizer:tasks'
const SAVED_SNAPSHOT_KEY = 'ai-task-organizer:last-prioritized-snapshot'
const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('tasks')
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
  const [currentSnapshot, setCurrentSnapshot] = useState<SavedSnapshot | null>(null)
  const [savedSnapshot, setSavedSnapshot] = useState<SavedSnapshot | null>(() => {
    const rawValue = window.localStorage.getItem(SAVED_SNAPSHOT_KEY)
    if (!rawValue) {
      return null
    }

    try {
      const parsed = JSON.parse(rawValue) as Partial<SavedSnapshot>
      if (
        typeof parsed.id !== 'string' ||
        typeof parsed.sortedAt !== 'string' ||
        !Array.isArray(parsed.sourceTasks) ||
        !Array.isArray(parsed.prioritizedTasks)
      ) {
        return null
      }

      return {
        id: parsed.id,
        sortedAt: parsed.sortedAt,
        sourceTasks: parsed.sourceTasks.filter((task): task is string => typeof task === 'string'),
        prioritizedTasks: parsed.prioritizedTasks.filter(
          (item): item is PrioritizedTask =>
            typeof item?.task === 'string' &&
            typeof item?.category === 'string' &&
            (item?.priority === 'High' || item?.priority === 'Medium' || item?.priority === 'Low'),
        ),
      }
    } catch {
      return null
    }
  })
  const [activeSnapshotId, setActiveSnapshotId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [infoMessage, setInfoMessage] = useState('')

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
   * Resolves whichever snapshot is currently selected in results mode.
   */
  const activeSnapshot =
    activeSnapshotId === savedSnapshot?.id ? savedSnapshot : currentSnapshot

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
    setInfoMessage('')
    setCurrentSnapshot(null)
    setActiveSnapshotId(null)
  }

  /**
   * Removes one task and clears stale prioritization because source list changed.
   */
  function handleDeleteTask(index: number) {
    setTasks((previous) => previous.filter((_, currentIndex) => currentIndex !== index))
    setCurrentSnapshot(null)
    setActiveSnapshotId(null)
    setErrorMessage('')
    setInfoMessage('')
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
    setCurrentSnapshot(null)
    setActiveSnapshotId(null)
    setErrorMessage('')
    setInfoMessage('')
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
    setInfoMessage('')

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

      // Exposes quota fallback mode so users understand degraded AI behavior.
      if (response.headers.get('x-prioritization-mode') === 'fallback') {
        setInfoMessage('Gemini quota is exhausted, so fallback prioritization was used.')
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

      const snapshot: SavedSnapshot = {
        id: `snapshot-${Date.now()}`,
        sortedAt: new Date().toISOString(),
        sourceTasks: [...tasks],
        prioritizedTasks: validated,
      }

      setCurrentSnapshot(snapshot)
      setActiveSnapshotId(snapshot.id)
      setViewMode('results')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected error occurred.'
      setErrorMessage(message)
      setInfoMessage('')
      setCurrentSnapshot(null)
      setActiveSnapshotId(null)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Saves only the latest generated AI result as single history record.
   */
  function handleSaveCurrentSnapshot() {
    if (!currentSnapshot) {
      return
    }

    window.localStorage.setItem(SAVED_SNAPSHOT_KEY, JSON.stringify(currentSnapshot))
    setSavedSnapshot(currentSnapshot)
    setInfoMessage('Latest prioritized result was saved to local history.')
  }

  /**
   * Switches results page to the one saved historical record.
   */
  function handleSwitchToSavedSnapshot() {
    if (!savedSnapshot) {
      return
    }

    setActiveSnapshotId(savedSnapshot.id)
    setViewMode('results')
    setInfoMessage('Showing saved prioritized record.')
  }

  /**
   * Toggles between task editor and results screens from header button.
   */
  function handleToggleView() {
    if (viewMode === 'tasks') {
      if (!currentSnapshot && !savedSnapshot) {
        setErrorMessage('No prioritized results available yet.')
        return
      }

      if (!activeSnapshotId) {
        setActiveSnapshotId(currentSnapshot?.id ?? savedSnapshot?.id ?? null)
      }
      setViewMode('results')
      return
    }

    setViewMode('tasks')
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_0%_0%,#e0f2fe_0%,#f8fafc_42%,#f5f7fb_100%)] px-4 py-6 md:px-8 md:py-10">
      <div className="mx-auto max-w-4xl">
        <AppHeader
          viewMode={viewMode}
          canOpenResults={Boolean(currentSnapshot || savedSnapshot)}
          onToggleView={handleToggleView}
        />

        {viewMode === 'tasks' ? (
          <TaskEditorPanel
            taskInput={taskInput}
            tasks={tasks}
            editingIndex={editingIndex}
            editingText={editingText}
            isLoading={isLoading}
            errorMessage={errorMessage}
            infoMessage={infoMessage}
            onTaskInputChange={setTaskInput}
            onAddTask={handleAddTask}
            onStartEditing={handleStartEditing}
            onEditingTextChange={setEditingText}
            onSaveEditing={handleSaveEditing}
            onCancelEditing={() => {
              setEditingIndex(null)
              setEditingText('')
            }}
            onDeleteTask={handleDeleteTask}
            onPrioritizeTasks={handlePrioritizeTasks}
          />
        ) : (
          <PrioritizedResultsPanel
            activeSnapshot={activeSnapshot}
            savedSnapshot={savedSnapshot}
            onSaveSnapshot={handleSaveCurrentSnapshot}
            onSwitchSnapshot={handleSwitchToSavedSnapshot}
          />
        )}
      </div>
    </main>
  )
}

export default App
