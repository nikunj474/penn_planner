"use client";

import { useState } from "react";
import { format } from "date-fns";

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

interface TaskCardProps {
  task: Task;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}

const SOURCE_COLORS: Record<string, string> = {
  canvas: "bg-blue-100 text-blue-700 border-blue-200",
  careerpath: "bg-purple-100 text-purple-700 border-purple-200",
  manual: "bg-gray-100 text-gray-600 border-gray-200",
};

const TYPE_ICONS: Record<string, string> = {
  exam: "📝",
  interview: "🎯",
  application: "📋",
  case_prep: "💼",
  quiz: "❓",
  assignment: "📚",
  networking: "🤝",
  other: "📌",
};

const URGENCY_COLORS: Record<string, string> = {
  Overdue: "text-red-600 font-bold",
  "Due today": "text-red-500 font-semibold",
  "Due tomorrow": "text-orange-500 font-semibold",
  "Due in 2–3 days": "text-amber-600",
};

export function TaskCard({ task, onStatusChange, onDelete }: TaskCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  const isCompleted = task.status === "completed";
  const isOverdue = task.daysUntilDue < 0 && !isCompleted;

  async function handleStatusChange(newStatus: string) {
    setLoading(true);
    await onStatusChange(task.id, newStatus);
    setLoading(false);
  }

  const urgencyClass =
    URGENCY_COLORS[task.urgencyLabel] ?? "text-gray-500";

  return (
    <div
      className={`rounded-xl border bg-white shadow-sm transition-all ${
        isCompleted ? "opacity-60" : ""
      } ${isOverdue ? "border-red-300 bg-red-50" : "border-gray-200"}`}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Priority badge */}
          <div
            className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              task.priority <= 3
                ? "bg-red-500 text-white"
                : task.priority <= 6
                ? "bg-orange-400 text-white"
                : "bg-gray-200 text-gray-600"
            }`}
          >
            {task.priority}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-lg">{TYPE_ICONS[task.type] ?? "📌"}</span>
              <span
                className={`font-semibold text-gray-900 ${isCompleted ? "line-through" : ""}`}
              >
                {task.title}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span
                className={`text-xs px-2 py-0.5 rounded-full border font-medium ${SOURCE_COLORS[task.source] ?? SOURCE_COLORS.manual}`}
              >
                {task.source === "canvas"
                  ? "Canvas"
                  : task.source === "careerpath"
                  ? "CareerPath"
                  : "Manual"}
              </span>

              {task.course && (
                <span className="text-xs text-gray-500">{task.course}</span>
              )}
              {task.company && (
                <span className="text-xs text-gray-500">{task.company}</span>
              )}
            </div>

            <div className="flex items-center gap-3 mt-2 text-sm">
              <span className={urgencyClass}>{task.urgencyLabel}</span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-500">
                {format(new Date(task.dueDate), "MMM d, h:mm a")}
              </span>
              <span className="text-gray-400">•</span>
              <span className="text-indigo-600 font-medium">
                ~{task.recommendedWorkMinutes} min
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {!isCompleted && (
              <>
                <button
                  onClick={() => handleStatusChange("in_progress")}
                  disabled={loading || task.status === "in_progress"}
                  className={`text-xs px-2 py-1 rounded-lg border transition-colors ${
                    task.status === "in_progress"
                      ? "bg-blue-500 text-white border-blue-500"
                      : "bg-white text-blue-600 border-blue-300 hover:bg-blue-50"
                  }`}
                  title="Start task"
                >
                  {task.status === "in_progress" ? "In Progress" : "Start"}
                </button>
                <button
                  onClick={() => handleStatusChange("completed")}
                  disabled={loading}
                  className="text-xs px-2 py-1 rounded-lg border bg-white text-green-600 border-green-300 hover:bg-green-50 transition-colors"
                  title="Mark complete"
                >
                  Done
                </button>
              </>
            )}
            {isCompleted && (
              <button
                onClick={() => handleStatusChange("pending")}
                disabled={loading}
                className="text-xs px-2 py-1 rounded-lg border bg-white text-gray-500 border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Undo
              </button>
            )}
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors"
            >
              {expanded ? "▲" : "▼"}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-2">
          {task.description && (
            <p className="text-sm text-gray-600">{task.description}</p>
          )}
          {task.priorityReason && (
            <p className="text-xs text-gray-400 italic">
              Prioritized because: {task.priorityReason}
            </p>
          )}
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => onDelete(task.id)}
              className="text-xs text-red-500 hover:text-red-700 transition-colors"
            >
              Remove task
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
