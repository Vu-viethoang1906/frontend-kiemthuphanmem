import React from "react";

interface TagManagerModalProps {
    show: boolean;
    allTags: any[];
    editingTag: any;
    newTagName: string;
    newTagColor: string;
    onClose: () => void;
    onNewTagNameChange: (name: string) => void;
    onNewTagColorChange: (color: string) => void;
    onCreateTag: () => void;
    onEditTag: (tag: any) => void;
    onUpdateTag: () => void;
    onCancelEdit: () => void;
    onDeleteTag: (tagId: string) => void;
    onEditingTagChange: (tag: any) => void;
}

const TagManagerModal: React.FC<TagManagerModalProps> = ({
    show,
    allTags,
    editingTag,
    newTagName,
    newTagColor,
    onClose,
    onNewTagNameChange,
    onNewTagColorChange,
    onCreateTag,
    onEditTag,
    onUpdateTag,
    onCancelEdit,
    onDeleteTag,
    onEditingTagChange
}) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" onClick={onClose}>
            <div className="bg-white shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 bg-blue-500">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        Manage Tags
                    </h3>
                    <button type="button" className="text-white hover:text-gray-200" onClick={onClose}>✕</button>
                </div>
                
                <div className="p-6 space-y-6">
                    {/* Create New Tag */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Create New Tag</h4>
                        <div className="flex items-end gap-2">
                            <div className="flex-1">
                                <label className="block text-xs font-medium text-gray-700 mb-1">Tag Name</label>
                                <input
                                    type="text"
                                    value={newTagName}
                                    onChange={(e) => onNewTagNameChange(e.target.value)}
                                    placeholder="Enter tag name"
                                    className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    onKeyPress={(e) => { if (e.key === 'Enter') onCreateTag(); }}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">New Tag Color</label>
                                <input
                                    type="color"
                                    value={newTagColor}
                                    onChange={(e) => onNewTagColorChange(e.target.value)}
                                    className="w-12 h-9 border border-gray-300 cursor-pointer"
                                    aria-label="New tag color"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={onCreateTag}
                                disabled={!newTagName.trim()}
                                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                Create
                            </button>
                        </div>
                    </div>

                    {/* Tags List */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">All Tags ({allTags.length})</h4>
                        {allTags.length === 0 ? (
                            <div className="text-center py-8 text-sm text-gray-500">
                                No tags yet. Create your first tag above.
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {allTags.map((tag: any) => {
                                    const tagId = tag._id || tag.id;
                                    const isEditing = editingTag && (editingTag._id || editingTag.id) === tagId;
                                    
                                    return (
                                        <div key={tagId} className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200">
                                            {isEditing ? (
                                                <>
                                                    <input
                                                        type="text"
                                                        value={editingTag.name}
                                                        onChange={(e) => onEditingTagChange({ ...editingTag, name: e.target.value })}
                                                        className="flex-1 px-2 py-1 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        onKeyPress={(e) => { if (e.key === 'Enter') onUpdateTag(); }}
                                                    />
                                                    <input
                                                        type="color"
                                                        value={editingTag.color}
                                                        onChange={(e) => onEditingTagChange({ ...editingTag, color: e.target.value })}
                                                        className="w-8 h-8 border border-gray-300 cursor-pointer"
                                                        aria-label="Editing tag color"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={onUpdateTag}
                                                        className="px-3 py-1 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700"
                                                    >
                                                        ✓ Save
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={onCancelEdit}
                                                        className="px-3 py-1 bg-gray-500 text-white text-xs font-medium rounded hover:bg-gray-600"
                                                    >
                                                        ✕ Cancel
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <div 
                                                        className="w-6 h-6 border border-gray-300 flex-shrink-0"
                                                        style={{ background: tag.color || '#007bff' }}
                                                    />
                                                    <span className="flex-1 text-sm text-gray-900">{tag.name}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => onEditTag({ ...tag })}
                                                        className="px-3 py-1 text-blue-600 text-xs font-medium hover:bg-blue-50 rounded"
                                                        title="Edit tag"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => onDeleteTag(tagId)}
                                                        className="px-3 py-1 text-red-600 text-xs font-medium hover:bg-red-50 rounded"
                                                        title="Delete tag"
                                                    >
                                                        Delete
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
                    <button 
                        type="button"
                        className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600" 
                        onClick={onClose}
                    >
                        CLOSE
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TagManagerModal;