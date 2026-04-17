import type { FormEvent } from 'react'

interface TaskEditorPanelProps {
  taskInput: string
  tasks: string[]
  editingIndex: number | null
  editingText: string
  isLoading: boolean
  errorMessage: string
  infoMessage: string
  onTaskInputChange: (value: string) => void
  onAddTask: (event: FormEvent) => void
  onStartEditing: (index: number) => void
  onEditingTextChange: (value: string) => void
  onSaveEditing: (index: number) => void
  onCancelEditing: () => void
  onDeleteTask: (index: number) => void
  onPrioritizeTasks: () => void
}

/**
 * Task editing view for adding, editing, deleting, and triggering prioritize requests.
 */
export function TaskEditorPanel({
  taskInput,
  tasks,
  editingIndex,
  editingText,
  isLoading,
  errorMessage,
  infoMessage,
  onTaskInputChange,
  onAddTask,
  onStartEditing,
  onEditingTextChange,
  onSaveEditing,
  onCancelEditing,
  onDeleteTask,
  onPrioritizeTasks,
}: TaskEditorPanelProps) {
  return (
    <section className="rounded-2xl border border-cyan-100 bg-white/90 p-5 shadow-[0_16px_45px_rgba(8,47,73,0.12)]">
      <p className="mb-4 text-sm text-slate-600">
        Add tasks, edit them, and use AI to prioritize by urgency.
      </p>

      <form className="mb-4 flex flex-col gap-3 sm:flex-row" onSubmit={onAddTask}>
        <input
          className="w-full rounded-xl border border-cyan-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none ring-cyan-500 transition focus:ring-2"
          type="text"
          placeholder="Add a task..."
          value={taskInput}
          onChange={(event) => onTaskInputChange(event.target.value)}
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
        <h2 className="mb-3 text-lg font-semibold text-cyan-900">Unsorted Tasks ({tasks.length})</h2>
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
                      onChange={(event) => onEditingTextChange(event.target.value)}
                      aria-label="Edit task"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="rounded-lg bg-cyan-100 px-3 py-1.5 text-xs font-semibold text-cyan-900 transition hover:bg-cyan-200"
                        onClick={() => onSaveEditing(index)}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
                        onClick={onCancelEditing}
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
                        onClick={() => onStartEditing(index)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="rounded-lg bg-rose-100 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-200"
                        onClick={() => onDeleteTask(index)}
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
        onClick={onPrioritizeTasks}
        disabled={isLoading || tasks.length === 0}
      >
        {isLoading ? 'Prioritizing...' : 'Prioritize Tasks'}
      </button>

      {errorMessage ? (
        <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      {infoMessage ? (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {infoMessage}
        </div>
      ) : null}
    </section>
  )
}
