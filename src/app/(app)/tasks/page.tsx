"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type TaskRow = {
  id: string;
  content: string;
  completed: boolean;
  due_date: string | null;
  created_at: string;
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTask, setNewTask] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [filter, setFilter] = useState<"all" | "open" | "done">("all");
  const [error, setError] = useState("");

  async function loadTasks() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/tasks");
      if (!res.ok) throw new Error("Failed to load tasks");
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (err: any) {
      setError(err?.message || "Unable to load tasks");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();
  }, []);

  const visibleTasks = useMemo(() => {
    if (filter === "open") return tasks.filter((task) => !task.completed);
    if (filter === "done") return tasks.filter((task) => task.completed);
    return tasks;
  }, [tasks, filter]);

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTask.trim() || creating) return;

    setCreating(true);
    setError("");
    const creatingToastId = toast.loading("Creating task...");

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newTask.trim(),
          dueDate: dueDate || undefined,
        }),
      });

      if (!res.ok) {
        const payload = await res.json();
        throw new Error(payload.error || "Unable to create task");
      }

      const payload = await res.json();
      if (payload.task) setTasks((prev) => [payload.task, ...prev]);
      setNewTask("");
      setDueDate("");
      toast.success("Task created.", { id: creatingToastId });
    } catch (err: any) {
      setError(err?.message || "Unable to create task");
      toast.error(err?.message || "Unable to create task", { id: creatingToastId });
    } finally {
      setCreating(false);
    }
  }

  async function toggleTask(task: TaskRow) {
    const toggleToastId = toast.loading(task.completed ? "Reopening task..." : "Marking task done...");
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !task.completed }),
    });

    if (!res.ok) {
      toast.error("Unable to update task.", { id: toggleToastId });
      return;
    }
    const payload = await res.json();
    if (payload.task) {
      setTasks((prev) => prev.map((row) => (row.id === payload.task.id ? payload.task : row)));
    }
    toast.success("Task updated.", { id: toggleToastId });
  }

  async function deleteTask(id: string) {
    const deleteToastId = toast.loading("Deleting task...");
    const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    if (res.ok) {
      setTasks((prev) => prev.filter((task) => task.id !== id));
      toast.success("Task deleted.", { id: deleteToastId });
      return;
    }
    toast.error("Unable to delete task.", { id: deleteToastId });
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        <div>
          <h1 className="font-display text-2xl text-vault-100">Tasks</h1>
          <p className="text-sm text-vault-400 mt-1">Track and complete work items generated from your planning and conversations.</p>
        </div>

        <form onSubmit={handleCreateTask} className="bg-vault-900/50 border border-vault-800/40 rounded-2xl p-4 space-y-3">
          <input
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Add a task"
            className="w-full px-3 py-2.5 rounded-xl bg-vault-800/40 border border-vault-700/40 text-vault-100 placeholder-vault-500 text-sm focus:outline-none focus:border-vault-500/40"
          />

          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <label className="text-xs text-vault-500">Due date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="px-2 py-1.5 rounded-lg bg-vault-800/40 border border-vault-700/40 text-vault-200 text-xs focus:outline-none focus:border-vault-500/40"
              />
            </div>

            <button
              type="submit"
              disabled={creating || !newTask.trim()}
              className="px-4 py-2 rounded-xl text-sm bg-vault-500/20 border border-vault-500/30 text-vault-100 hover:bg-vault-500/30 disabled:opacity-50 transition-colors"
            >
              {creating ? "Creating..." : "Create task"}
            </button>
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </form>

        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: "all", label: "All" },
            { id: "open", label: "Open" },
            { id: "done", label: "Done" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilter(item.id as "all" | "open" | "done")}
              className={`px-3 py-1.5 rounded-lg border text-xs transition-colors ${
                filter === item.id
                  ? "bg-vault-500/20 border-vault-500/30 text-vault-200"
                  : "bg-vault-900/30 border-vault-700/30 text-vault-500 hover:text-vault-300"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="bg-vault-900/30 border border-vault-800/30 rounded-2xl divide-y divide-vault-800/30">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="rounded-xl border border-vault-800/50 bg-vault-950/30 p-3 space-y-2">
                  <div className="skeleton h-3.5 w-3/5 rounded" />
                  <div className="skeleton h-3 w-2/5 rounded" />
                </div>
              ))}
            </div>
          ) : visibleTasks.length === 0 ? (
            <p className="text-sm text-vault-500 p-4">No tasks yet.</p>
          ) : (
            visibleTasks.map((task) => (
              <div key={task.id} className="p-4 flex items-start gap-3">
                <button
                  onClick={() => toggleTask(task)}
                  className={`mt-0.5 w-5 h-5 rounded-md border transition-colors ${
                    task.completed
                      ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                      : "border-vault-600 text-transparent hover:border-vault-400"
                  }`}
                >
                  ✓
                </button>
                <div className="flex-1">
                  <p className={`text-sm ${task.completed ? "text-vault-500 line-through" : "text-vault-200"}`}>
                    {task.content}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-2xs text-vault-600">
                    {task.due_date && <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>}
                    <span>Created: {new Date(task.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="text-xs px-2 py-1 rounded-md border border-vault-700/40 text-vault-500 hover:text-red-400 hover:border-red-500/30 transition-colors"
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
