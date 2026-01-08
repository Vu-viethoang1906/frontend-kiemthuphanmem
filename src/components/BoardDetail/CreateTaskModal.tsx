import React from "react";
import "../../styles/BoardDetail/CreateTaskModal.css";
import { isoToDateTimeLocal, datetimeLocalToISO } from "../../utils/datetimeUtils";

type NewTaskState = { 
    title: string; 
    description: string; 
    column_id: string; 
    swimlane_id: string;
    priority?: string;
    estimate_hours?: number;
    start_date?: string;
    due_date?: string;
    nameTag?: string;
};

interface CreateTaskModalProps {
    show: boolean;
    newTask: NewTaskState;
    allTags: any[];
    newTaskTagSearch: string;
    newTaskSelectedTagId: string;
    onClose: () => void;
    onTaskChange: (task: NewTaskState) => void;
    onTagSearchChange: (search: string) => void;
    onTagSelect: (tagId: string, tagName: string) => void;
    onCreate: () => void;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
    show,
    newTask,
    allTags,
    newTaskTagSearch,
    newTaskSelectedTagId,
    onClose,
    onTaskChange,
    onTagSearchChange,
    onTagSelect,
    onCreate
}) => {
    if (!show) return null;

    const filteredTags = allTags.filter(tag => 
        tag.name.toLowerCase().includes(newTaskTagSearch.toLowerCase())
    );

    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[2100] px-4" onClick={onClose}>
            <div 
                className="bg-white rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="bg-blue-600 px-6 py-4 flex items-center justify-between">
                    <h3 className="text-white text-lg font-semibold uppercase tracking-wide">
                        Create Task
                    </h3>
                    <button
                        type="button"
                        className="text-white hover:bg-white/15 rounded-full p-1 transition-colors"
                        onClick={onClose}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="px-6 py-6 space-y-5 overflow-y-auto max-h-[75vh]">
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                            Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            value={newTask.title}
                            onChange={(e) => onTaskChange({ ...newTask, title: e.target.value })}
                            placeholder="Enter task title"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                            Description
                        </label>
                        <textarea
                            rows={3}
                            value={newTask.description || ''}
                            onChange={(e) => onTaskChange({ ...newTask, description: e.target.value })}
                            placeholder="Add description"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                                Priority
                            </label>
                            <select
                                value={newTask.priority || ''}
                                onChange={(e) => onTaskChange({ ...newTask, priority: e.target.value })}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Select priority</option>
                                <option value="High">High</option>
                                <option value="Medium">Medium</option>
                                <option value="Low">Low</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                                Estimate Hours
                            </label>
                            <input
                                type="number"
                                step="0.5"
                                min="0"
                                value={newTask.estimate_hours || ''}
                                onChange={(e) => onTaskChange({ ...newTask, estimate_hours: parseFloat(e.target.value) || undefined })}
                                placeholder="0.0"
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {/* Start Date & Time & Due Date & Time */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                                Start Date & Time
                            </label>
                            <input
                                type="datetime-local"
                                value={isoToDateTimeLocal(newTask.start_date)}
                                onChange={(e) => {
                                    const isoValue = datetimeLocalToISO(e.target.value);
                                    onTaskChange({ ...newTask, start_date: isoValue || undefined });
                                }}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Select start date and time"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                                Due Date & Time
                            </label>
                            <input
                                type="datetime-local"
                                value={isoToDateTimeLocal(newTask.due_date)}
                                onChange={(e) => {
                                    const isoValue = datetimeLocalToISO(e.target.value);
                                    onTaskChange({ ...newTask, due_date: isoValue || undefined });
                                }}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Select due date and time"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                            Tag (optional)
                        </label>
                        <input
                            value={newTaskTagSearch}
                            onChange={(e) => {
                                onTagSearchChange(e.target.value);
                                onTaskChange({ ...newTask, nameTag: e.target.value });
                            }}
                            placeholder="Search tags or type new tag name..."
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />

                        <div className="mt-3 border border-gray-200 rounded-md max-h-40 overflow-y-auto">
                            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-200 bg-gray-50">
                                Available Tags ({filteredTags.length})
                            </div>
                            {filteredTags.length === 0 ? (
                                <div className="px-3 py-4 text-sm text-gray-500 text-center">
                                    No matching tags
                                </div>
                            ) : (
                                filteredTags.map((tag: any) => {
                                    const isSelected = newTaskSelectedTagId === (tag._id || tag.id);
                                    return (
                                        <button
                                            key={tag._id || tag.id}
                                            type="button"
                                            className={`w-full flex items-center gap-3 px-3 py-2 text-left transition ${
                                                isSelected ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
                                            }`}
                                            onClick={() => onTagSelect(tag._id || tag.id, tag.name)}
                                        >
                                            <span
                                                className="inline-flex h-4 w-4 rounded-full"
                                                style={{ background: tag.color || '#007bff' }}
                                            />
                                            <span className="flex-1 text-sm font-medium">{tag.name}</span>
                                            {isSelected && <span className="text-blue-600 text-sm font-semibold">✓</span>}
                                        </button>
                                    );
                                })
                            )}
                        </div>

                        <div className="mt-2 text-xs text-gray-500">
                            {newTaskSelectedTagId 
                                ? '✓ Tag selected from list'
                                : newTaskTagSearch && !allTags.find(t => t.name.toLowerCase() === newTaskTagSearch.toLowerCase())
                                    ? `➕ New tag "${newTaskTagSearch}" will be created`
                                    : 'Select a tag or type a new name'}
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
                    <button 
                        type="button"
                        className="px-4 py-2 rounded-md bg-white border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button 
                        type="button"
                        className={`px-5 py-2.5 rounded-md font-semibold text-sm text-white transition ${
                            newTask.title && newTask.column_id ? 'bg-blue-600 hover:bg-blue-700 shadow-md' : 'bg-blue-400 cursor-not-allowed opacity-70'
                        }`}
                        onClick={onCreate}
                        disabled={!newTask.title || !newTask.column_id}
                    >
                        Create task
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateTaskModal;
