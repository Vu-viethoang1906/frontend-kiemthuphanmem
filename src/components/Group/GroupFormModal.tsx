import React from "react";

interface GroupFormModalProps {
  show: boolean;
  editingGroup: any | null;
  form: { name: string; description: string };
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  onChange: (field: "name" | "description", value: string) => void;
}

const GroupFormModal: React.FC<GroupFormModalProps> = ({
  show,
  editingGroup,
  form,
  onSubmit,
  onClose,
  onChange,
}) => {
  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-5"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={onSubmit}
        className="w-full max-w-xl bg-white rounded-none shadow-2xl ring-1 ring-black/5 overflow-hidden animate-in fade-in duration-200"
      >
        <div className="flex items-center justify-between px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white border-b border-blue-500/60">
          <h2 className="text-lg font-semibold uppercase tracking-wide">
            {editingGroup ? "Edit Group" : "Create Group"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center w-9 h-9 rounded-md hover:bg-white/10"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
              Group name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => onChange("name", e.target.value)}
              required
              placeholder="Enter group name..."
              className="w-full px-4 py-3 border border-blue-200 rounded-none focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
              Description
            </label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => onChange("description", e.target.value)}
              placeholder="Enter description (optional)..."
              className="w-full px-4 py-3 border border-blue-200 rounded-none focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-blue-200 text-blue-700 font-semibold hover:bg-blue-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-3.5 py-2 rounded-md bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold shadow-md hover:scale-[1.01] transition inline-flex items-center gap-2"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {editingGroup ? "Save changes" : "Create group"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default GroupFormModal;