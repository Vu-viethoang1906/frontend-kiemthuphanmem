import React, { useState } from "react";
import "../../styles/BoardDetail/AddSubtaskForm.css";

interface AddSubtaskFormProps {
    members: any[];
    onSubmit: (data: {
        title: string;
        description?: string;
        assigned_to?: string;
        priority?: "High" | "Medium" | "Low";
        due_date?: string;
    }) => void;
    onCancel: () => void;
}

const AddSubtaskForm: React.FC<AddSubtaskFormProps> = ({
    members,
    onSubmit,
    onCancel,
}) => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [assignedTo, setAssignedTo] = useState("");
    const [priority, setPriority] = useState<"High" | "Medium" | "Low" | "">("");
    const [dueDate, setDueDate] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (title.trim() === "") {
            alert("Title is required");
            return;
        }

        const data: any = {
            title: title.trim(),
        };

        if (description.trim()) data.description = description.trim();
        if (assignedTo) data.assigned_to = assignedTo;
        if (priority) data.priority = priority;
        if (dueDate) data.due_date = dueDate;

        onSubmit(data);

        // Reset form
        setTitle("");
        setDescription("");
        setAssignedTo("");
        setPriority("");
        setDueDate("");
    };

    return (
        <form className="add-subtask-form" onSubmit={handleSubmit}>
            <div className="form-group">
                <input
                    type="text"
                    placeholder="Subtask title *"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="form-input"
                    autoFocus
                    required
                />
            </div>

            <div className="form-group">
                <textarea
                    placeholder="Description (optional)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="form-textarea"
                    rows={2}
                />
            </div>

            <div className="form-row">
                <div className="form-group">
                    <select
                        value={assignedTo}
                        onChange={(e) => setAssignedTo(e.target.value)}
                        className="form-select"
                    >
                        <option value="">Assign to...</option>
                        {members.map((member) => {
                            if (!member?.user_id) return null;
                            return (
                                <option key={member.user_id._id} value={member.user_id._id}>
                                    {member.user_id.username}
                                </option>
                            );
                        })}
                    </select>
                </div>

                <div className="form-group">
                    <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value as any)}
                        className="form-select"
                    >
                        <option value="">Priority</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                    </select>
                </div>

                <div className="form-group">
                    <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="form-input"
                    />
                </div>
            </div>

            <div className="form-actions">
                <button type="submit" className="btn-submit">
                    Add Subtask
                </button>
                <button type="button" onClick={onCancel} className="btn-cancel">
                    Cancel
                </button>
            </div>
        </form>
    );
};

export default AddSubtaskForm;
