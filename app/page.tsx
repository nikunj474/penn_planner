"use client";

import { useEffect, useState, useCallback } from "react";
import { TaskCard } from "@/components/TaskCard";
import { AddTaskModal } from "@/components/AddTaskModal";

interface Task {
  id: string;
  title: string;
  description?: string | null;
  source: string;
  type: string;
  dueDate: string;
  estimatedMinutes?: number | null;
  priority: number;
  priorityScore: number;
  status: string;
  course?: string | null;
  company?: string | null;
  urgencyLabel: string;
  recommendedWorkMinutes: number;
  priorityReason: string;
  daysUntilDue: number;
}

interface Nudge {
  type: string;
  message: string;
  taskIds: string[];
}

type FilterType = "all" | "pending" | "in_progress" | "completed";

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [nudges, setNudges] = useState<Nudge[]>([]);
  const [summary, setSummary] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [dismissedNudges, setDismissedNudges] = useState<Set<string>>(new Set());

  const fetchTasks = useCallback(async () => {
    const res = await fetch("/api/tasks");
    const data = await res.json();
    setTasks(Array.isArray(data) ? data : []);
  }, []);

  const fetchNudges = useCallback(async () => {
    const res = await fetch("/api/nudges");
    const data = await res.json();
    setNudges(data.nudges ?? []);
  }, []);

  useEffect(() => {
    async function init() {
      setLoading(true);
      await fetchTasks();
      await fetchNudges();
      setLoading(false);
    }
    init();
  }, [fetchTasks, fetchNudges]);

  async function handleSync() {
    setSyncing(true);
    await fetch("/api/sync", { method: "POST" });
    await fetchTasks();
    await fetchNudges();
    setSyncing(false);
  }

  async function handleGetSummary() {
    setLoadingSummary(true);
    const res = await fetch("/api/summary");
    const data = await res.json();
    setSummary(data.summary ?? "");
    setLoadingSummary(false);
  }

  async function handleStatusChange(id: string, status: string) {
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await fetchTasks();
    await fetchNudges();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    await fetchTasks();
    await fetchNudges();
  }

  async function handleAdd(formData: Record<string, string>) {
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    await fetchTasks();
    await fetchNudges();
  }

  const filteredTasks = tasks.filter((t) => {
    if (filter === "all") return t.status !== "completed";
    return t.status === filter;
  });

  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const pendingCount = tasks.filter((t) => t.status !== "completed").length;
  const visibleNudges = nudges.filter((n) => !dismissedNudges.has(n.message));

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Penn Planner
            </h1>
            <p className="text-xs text-gray-500">
              Your AI academic &amp; recruiting planner
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1.5"
            >
              <span>{syncing ? "⟳" : "⟳"}</span>
              {syncing ? "Syncing..." : "Sync Canvas & CareerPath"}
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="text-sm px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
            >
              + Add Task
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{pendingCount}</div>
            <div className="text-xs text-gray-500 mt-0.5">Pending</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{completedCount}</div>
            <div className="text-xs text-gray-500 mt-0.5">Completed</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-indigo-600">
              {tasks.filter((t) => t.daysUntilDue <= 2 && t.status !== "completed").length}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">Due in 48h</div>
          </div>
        </div>

        {/* Nudges */}
        {visibleNudges.length > 0 && (
          <div className="space-y-2">
            {visibleNudges.map((nudge) => (
              <div
                key={nudge.message}
                className={`rounded-xl border px-4 py-3 flex items-start justify-between gap-3 ${
                  nudge.type === "deadline_stack"
                    ? "bg-amber-50 border-amber-300"
                    : "bg-red-50 border-red-300"
                }`}
              >
                <p className="text-sm font-medium text-gray-800">{nudge.message}</p>
                <button
                  onClick={() =>
                    setDismissedNudges((d) => new Set([...d, nudge.message]))
                  }
                  className="text-gray-400 hover:text-gray-600 text-lg leading-none flex-shrink-0"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* AI Daily Briefing */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="text-xs font-semibold text-indigo-600 mb-1">
                AI Daily Briefing
              </p>
              {summary ? (
                <p className="text-sm text-gray-700 leading-relaxed">{summary}</p>
              ) : (
                <p className="text-sm text-gray-400 italic">
                  Click &ldquo;Get Briefing&rdquo; to get your AI-powered daily summary.
                </p>
              )}
            </div>
            <button
              onClick={handleGetSummary}
              disabled={loadingSummary}
              className="flex-shrink-0 text-xs px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              {loadingSummary ? "Thinking..." : "Get Briefing"}
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
          {(["all", "pending", "in_progress", "completed"] as FilterType[]).map(
            (f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors capitalize ${
                  filter === f
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {f === "in_progress" ? "In Progress" : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            )
          )}
        </div>

        {/* Task list */}
        {loading ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-3xl mb-3">⏳</div>
            <p>Loading your tasks...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-3xl mb-3">
              {tasks.length === 0 ? "📥" : "✅"}
            </div>
            <p className="font-medium">
              {tasks.length === 0
                ? "No tasks yet — sync Canvas & CareerPath to get started"
                : filter === "all"
                ? "All caught up! No pending tasks."
                : `No ${filter.replace("_", " ")} tasks.`}
            </p>
            {tasks.length === 0 && (
              <button
                onClick={handleSync}
                className="mt-4 text-sm px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Sync Now
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>

      {showAddModal && (
        <AddTaskModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAdd}
        />
      )}
    </div>
  );
}
