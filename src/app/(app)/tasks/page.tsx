"use client";

import { useState } from "react";
import { CheckSquare, Plus, Circle, CheckCircle2, Calendar } from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";

interface TaskItem {
  id: string;
  content: string;
  completed: boolean;
  due_date: string | null;
  created_at: string;
}

const MOCK_TASKS: TaskItem[] = [
  { id: "1", content: "Buy white coat for anatomy lab", completed: false, due_date: "2026-06-02", created_at: new Date().toISOString() },
  { id: "2", content: "Review pharmacology chapter 5", completed: false, due_date: "2026-06-10", created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: "3", content: "Send slides to Sara", completed: true, due_date: null, created_at: new Date(Date.now() - 172800000).toISOString() },
];

export default function TasksPage() {
  const [tasks, setTasks] = useState(MOCK_TASKS);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("pending");

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const filtered = tasks.filter((t) => {
    if (filter === "pending") return !t.completed;
    if (filter === "completed") return t.completed;
    return true;
  });

  const pendingCount = tasks.filter((t) => !t.completed).length;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto py-8 px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <CheckSquare className="w-5 h-5 text-vault-accent" />
            <h1 className="text-lg font-medium text-vault-text">Tasks</h1>
            {pendingCount > 0 && (
              <span className="text-2xs text-vault-accent bg-vault-accent/10 px-2 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-1.5 mb-6">
          {(["pending", "completed", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1 rounded-lg text-xs transition-colors capitalize",
                filter === f
                  ? "bg-vault-accent/10 text-vault-accent"
                  : "text-vault-text-ghost hover:text-vault-text-secondary hover:bg-vault-surface-hover"
              )}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Task list */}
        <div className="space-y-1">
          {filtered.map((task) => (
            <div
              key={task.id}
              className="flex items-start gap-3 p-3 rounded-xl hover:bg-vault-surface-hover transition-colors group"
            >
              <button
                onClick={() => toggleTask(task.id)}
                className="mt-0.5 flex-shrink-0"
              >
                {task.completed ? (
                  <CheckCircle2 className="w-4 h-4 text-vault-success" />
                ) : (
                  <Circle className="w-4 h-4 text-vault-text-ghost group-hover:text-vault-text-tertiary transition-colors" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-sm leading-relaxed",
                    task.completed
                      ? "text-vault-text-ghost line-through"
                      : "text-vault-text"
                  )}
                >
                  {task.content}
                </p>
                {task.due_date && (
                  <div className="flex items-center gap-1 mt-1">
                    <Calendar className="w-3 h-3 text-vault-text-ghost" />
                    <span className="text-2xs text-vault-text-ghost">
                      Due {new Date(task.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-16">
              <CheckSquare className="w-8 h-8 text-vault-text-ghost mx-auto mb-3" />
              <p className="text-sm text-vault-text-ghost">
                {filter === "completed" ? "No completed tasks" : "All done!"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
