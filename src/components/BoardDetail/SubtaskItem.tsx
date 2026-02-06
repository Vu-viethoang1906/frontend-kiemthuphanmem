import React, { useState, useRef, useEffect } from "react";
import { updateSubtask } from "../../api/subtaskApi";
import toast from "react-hot-toast";
import "../../styles/BoardDetail/SubtaskItem.css";

interface Subtask {
    _id: string;
    title: string;
    description?: string;
    assigned_to?: {
        _id: string;
        username: string;
        full_name?: string;
        avatar_url?: string;
    };
    priority?: "High" | "Medium" | "Low";
    due_date?: string;
    is_completed: boolean;
}

interface SubtaskItemProps {
    subtask: Subtask;
    members: any[];
    onToggle: (subtaskId: string) => void;
    onUpdate: () => void;
    onDelete: (subtaskId: string) => void;
}

const SubtaskItem: React.FC<SubtaskItemProps> = ({
    subtask,
    members,
    onToggle,
    onUpdate,
    onDelete,
}) => {
    const baseUrl = "http://localhost:3005/api";
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(subtask.title);
    const [showAssigneeList, setShowAssigneeList] = useState(false);
    const [assigneePosition, setAssigneePosition] = useState({ top: 0, left: 0 });
    const assigneeRef = useRef<HTMLDivElement>(null);

    // Handle title edit
    const handleTitleSave = async () => {
        if (editTitle.trim() === "") {
            toast.error("Title cannot be empty");
            setEditTitle(subtask.title);
            setIsEditing(false);
            return;
        }

        if (editTitle.trim() === subtask.title) {
            setIsEditing(false);
            return;
        }

        try {
            await updateSubtask(subtask._id, { title: editTitle.trim() });
            toast.success("Subtask updated!");
            onUpdate();
            setIsEditing(false);
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to update subtask");
            setEditTitle(subtask.title);
        }
    };

    // Handle assignee change
    const handleAssigneeChange = async (userId: string) => {
        try {
            await updateSubtask(subtask._id, { assigned_to: userId });
            toast.success("Assignee updated!");
            setShowAssigneeList(false);
            onUpdate();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to update assignee");
        }
    };

    // Handle priority change
    const handlePriorityChange = async (priority: "High" | "Medium" | "Low") => {
        try {
            await updateSubtask(subtask._id, { priority });
            toast.success("Priority updated!");
            onUpdate();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to update priority");
        }
    };

    // Toggle assignee list
    const toggleAssigneeList = () => {
        if (assigneeRef.current) {
            const rect = assigneeRef.current.getBoundingClientRect();
            setAssigneePosition({
                top: rect.bottom + 5,
                left: rect.left,
            });
        }
        setShowAssigneeList(!showAssigneeList);
    };

    // Close assignee list on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                showAssigneeList &&
                assigneeRef.current &&
                !assigneeRef.current.contains(e.target as Node)
            ) {
                setShowAssigneeList(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showAssigneeList]);

    const getPriorityColor = (priority?: string) => {
        switch (priority) {
            case "High":
                return "#ef4444";
            case "Medium":
                return "#f59e0b";
            case "Low":
                return "#10b981";
            default:
                return "#6b7280";
        }
    };

    const formatDueDate = (dateString?: string) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return `${String(date.getDate()).padStart(2, "0")}/${String(
            date.getMonth() + 1
        ).padStart(2, "0")}`;
    };

    return (
        <div className={`subtask-item ${subtask.is_completed ? "completed" : ""}`}>
            <div className="subtask-main">
                {/* Checkbox */}
                <input
                    type="checkbox"
                    checked={subtask.is_completed}
                    onChange={() => onToggle(subtask._id)}
                    className="subtask-checkbox"
                />

                {/* Title */}
                {isEditing ? (
                    <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={handleTitleSave}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleTitleSave();
                            if (e.key === "Escape") {
                                setEditTitle(subtask.title);
                                setIsEditing(false);
                            }
                        }}
                        className="subtask-title-input"
                        autoFocus
                    />
                ) : (
                    <span
                        className="subtask-title"
                        onDoubleClick={() => setIsEditing(true)}
                        title="Double-click to edit"
                    >
                        {subtask.title}
                    </span>
                )}

                {/* Actions */}
                <div className="subtask-actions">
                    {/* Priority */}
                    <select
                        value={subtask.priority || ""}
                        onChange={(e) =>
                            handlePriorityChange(e.target.value as "High" | "Medium" | "Low")
                        }
                        className="subtask-priority"
                        style={{ color: getPriorityColor(subtask.priority) }}
                    >
                        <option value="">Priority</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                    </select>

                    {/* Due date */}
                    {subtask.due_date && (
                        <span className="subtask-due-date">{formatDueDate(subtask.due_date)}</span>
                    )}

                    {/* Assignee */}
                    <div className="subtask-assignee" ref={assigneeRef}>
                        {subtask.assigned_to ? (
                            <div
                                className="assignee-avatar"
                                onClick={toggleAssigneeList}
                                title={subtask.assigned_to.username}
                            >
                                {subtask.assigned_to.avatar_url ? (
                                    <img
                                        src={
                                            subtask.assigned_to.avatar_url.startsWith("http")
                                                ? subtask.assigned_to.avatar_url
                                                : baseUrl + subtask.assigned_to.avatar_url
                                        }
                                        alt={subtask.assigned_to.username}
                                    />
                                ) : (
                                    <div className="assignee-placeholder">
                                        {subtask.assigned_to.username.slice(0, 2).toUpperCase()}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div
                                className="assignee-placeholder add"
                                onClick={toggleAssigneeList}
                                title="Assign to someone"
                            >
                                +
                            </div>
                        )}

                        {/* Assignee dropdown */}
                        {showAssigneeList && (
                            <div
                                className="assignee-dropdown"
                                style={{
                                    position: "fixed",
                                    top: `${assigneePosition.top}px`,
                                    left: `${assigneePosition.left}px`,
                                    zIndex: 99999,
                                }}
                            >
                                <div className="assignee-list">
                                    {members.map((member) => {
                                        if (!member?.user_id) return null;
                                        const user = member.user_id;
                                        const avatarUrl = user.avatar_url
                                            ? user.avatar_url.startsWith("http")
                                                ? user.avatar_url
                                                : baseUrl + user.avatar_url
                                            : null;

                                        return (
                                            <div
                                                key={user._id}
                                                className="assignee-option"
                                                onClick={() => handleAssigneeChange(user._id)}
                                            >
                                                {avatarUrl ? (
                                                    <img
                                                        src={avatarUrl}
                                                        alt={user.username}
                                                        className="assignee-option-avatar"
                                                    />
                                                ) : (
                                                    <div className="assignee-option-avatar assignee-placeholder">
                                                        {user.username.slice(0, 2).toUpperCase()}
                                                    </div>
                                                )}
                                                <span>{user.username}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Delete button */}
                    <button
                        className="subtask-delete"
                        onClick={() => onDelete(subtask._id)}
                        title="Delete subtask"
                    >
                        ×
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SubtaskItem;
