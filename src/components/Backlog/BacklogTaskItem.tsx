import React, { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { deleteBacklogItem, updateBacklogItem } from "../../api/backlogApi";
import toast from "react-hot-toast";

interface Task {
  _id: string;
  title: string;
  description?: string;
  priority: "High" | "Medium" | "Low";
  story_points?: number;
  assigned_to?: {
    _id: string;
    username: string;
    avatar_url?: string;
  };
  tags?: any[];
}

interface BacklogTaskItemProps {
  task: Task;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
  onUpdate: () => void;
}

const BacklogTaskItem: React.FC<BacklogTaskItemProps> = ({
  task,
  selected,
  onToggleSelect,
  onUpdate,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const [isEditingPoints, setIsEditingPoints] = useState(false);
  const [points, setPoints] = useState(task.story_points || 0);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [priority, setPriority] = useState<Task["priority"]>(task.priority || "Medium");

  const handlePointsUpdate = async () => {
    if (points === task.story_points) {
      setIsEditingPoints(false);
      return;
    }

    try {
      await updateBacklogItem(task._id, { story_points: points });
      toast.success("Points updated");
      setIsEditingPoints(false);
      onUpdate();
    } catch (error) {
      toast.error("Failed to update points");
    }
  };

  const handleTitleUpdate = async () => {
    const next = title.trim();
    if (!next) {
      toast.error("Title is required");
      setTitle(task.title);
      setIsEditingTitle(false);
      return;
    }
    if (next === task.title) {
      setIsEditingTitle(false);
      return;
    }
    try {
      await updateBacklogItem(task._id, { title: next });
      toast.success("Updated");
      setIsEditingTitle(false);
      onUpdate();
    } catch (e) {
      toast.error("Failed to update");
    }
  };

  const handlePriorityUpdate = async (p: Task["priority"]) => {
    setPriority(p);
    try {
      await updateBacklogItem(task._id, { priority: p });
      onUpdate();
    } catch (e) {
      toast.error("Failed to update priority");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteBacklogItem(task._id);
      toast.success("Deleted");
      onUpdate();
    } catch (e) {
      toast.error("Failed to delete");
    }
  };

  const getPriorityClasses = (p: string) => {
    switch (p) {
      case "High":
        return "bg-red-500";
      case "Medium":
        return "bg-amber-500";
      case "Low":
        return "bg-emerald-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`grid grid-cols-12 gap-2 px-4 py-3 items-center bg-white dark:bg-slate-900 ${
        isDragging ? "ring-2 ring-indigo-300 dark:ring-indigo-700" : ""
      }`}
    >
      {/* Select */}
      <div className="col-span-1 flex justify-center">
        <input
          type="checkbox"
          checked={!!selected}
          onChange={() => onToggleSelect?.(task._id)}
          onClick={(e) => e.stopPropagation()}
          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
      </div>

      {/* Drag Handle */}
      <div
        className="col-span-1 flex justify-center text-gray-400 cursor-grab select-none"
        {...attributes}
        {...listeners}
        title="Drag to reorder"
      >
        ⋮⋮
      </div>

      {/* Priority */}
      <div className="col-span-2 flex items-center justify-center gap-2">
        <span
          className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-white text-xs font-bold ${getPriorityClasses(
            task.priority
          )}`}
        >
          {(task.priority || "-").charAt(0)}
        </span>
        <select
          className="px-2 py-1 border border-gray-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-xs text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={priority}
          onChange={(e) => handlePriorityUpdate(e.target.value as any)}
          onClick={(e) => e.stopPropagation()}
        >
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
      </div>

      {/* Title */}
      <div className="col-span-5 min-w-0">
        {isEditingTitle ? (
          <input
            className="w-full px-2 py-1 border border-gray-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleUpdate}
            onKeyDown={(e) => e.key === "Enter" && handleTitleUpdate()}
            autoFocus
          />
        ) : (
          <span
            className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate block"
            onDoubleClick={() => setIsEditingTitle(true)}
            title="Double click to edit"
          >
            {task.title}
          </span>
        )}
      </div>

      {/* Story Points */}
      <div className="col-span-1 flex justify-center" onClick={() => setIsEditingPoints(true)}>
        {isEditingPoints ? (
          <input
            type="number"
            value={points}
            onChange={(e) => setPoints(Number(e.target.value))}
            onBlur={handlePointsUpdate}
            onKeyDown={(e) => e.key === "Enter" && handlePointsUpdate()}
            autoFocus
            min={0}
            className="w-16 px-2 py-1 border border-gray-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center"
          />
        ) : (
          <span
            className="inline-flex items-center justify-center px-2 py-1 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-100 text-xs font-semibold"
            title="Story Points"
          >
            {task.story_points ?? "-"}
          </span>
        )}
      </div>

      {/* Assignee */}
      <div className="col-span-1 flex justify-center">
        {task.assigned_to ? (
          <img
            src={task.assigned_to.avatar_url || "https://via.placeholder.com/24"}
            alt={task.assigned_to.username}
            className="w-7 h-7 rounded-full object-cover border border-gray-200 dark:border-slate-700"
            title={task.assigned_to.username}
          />
        ) : (
          <span className="text-xs text-gray-400 italic">—</span>
        )}
      </div>

      <div className="col-span-1 flex justify-end">
        <button
          className="px-2.5 py-1.5 text-xs font-semibold rounded-md border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
          onClick={handleDelete}
          onPointerDown={(e) => e.stopPropagation()}
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default BacklogTaskItem;
