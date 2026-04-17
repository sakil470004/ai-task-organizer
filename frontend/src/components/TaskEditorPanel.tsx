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
    <section className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur md:p-6">
      <p className="mb-4 text-sm text-slate-600 md:mb-5">
        Add tasks, edit them, and use AI to prioritize by urgency.
      </p>

      <form className="mb-5 flex gap-3 sm:flex-row" onSubmit={onAddTask}>
        <input
          className="flex-grow rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
          type="text"
          placeholder="Add a task..."
          value={taskInput}
          onChange={(event) => onTaskInputChange(event.target.value)}
          aria-label="Task input"
        />
        <button
          className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          type="submit"
        >
          Add Task
        </button>
      </form>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Unsorted Tasks ({tasks.length})</h2>
        {tasks.length === 0 ? (
          <p className="text-sm text-slate-500">No tasks added yet.</p>
        ) : (
          <ul className="space-y-2.5">
            {tasks.map((task, index) => (
              <li
                key={`${task}-${index}`}
                className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-[0_4px_16px_rgba(15,23,42,0.04)]"
              >
                {editingIndex === index ? (
                  <div className="grid gap-2">
                    <input
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                      type="text"
                      value={editingText}
                      onChange={(event) => onEditingTextChange(event.target.value)}
                      aria-label="Edit task"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-200"
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
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-sky-200 hover:text-sky-700"
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
        className="mt-5 w-full rounded-xl bg-gradient-to-r from-sky-600 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white transition enabled:hover:from-sky-700 enabled:hover:to-cyan-600 disabled:cursor-not-allowed disabled:opacity-60"
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
