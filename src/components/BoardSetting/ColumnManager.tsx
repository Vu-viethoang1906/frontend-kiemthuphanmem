import React, { useState, useEffect } from "react";
import { 
  fetchColumnsByBoard, 
  createColumn, 
  updateColumn, 
  deleteColumn,
  reorderColumns,
  setDoneColumn,
  getDoneColumn,
  updataIsDone
} from "../../api/columnApi";
import { useModal } from "../ModalProvider";
import { toast } from "react-hot-toast";

interface ColumnManagerProps {
  boardId: string;
  onColumnsChange?: () => void;
}

const ColumnManager: React.FC<ColumnManagerProps> = ({ boardId, onColumnsChange }) => {
    const { show, confirm } = useModal();
  const [columns, setColumns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [columnName, setColumnName] = useState("");
  const [doneColumnId, setDoneColumnId] = useState<string | null>(null);
  const [isDone, setIsDone] = useState<boolean>(false);

  const loadColumns = async () => {
    try {
      setLoading(true);
      const res = await fetchColumnsByBoard(boardId);
      setColumns(res?.data || []);
      
      // Load done column
      try {
        const doneRes = await getDoneColumn(boardId);
        setDoneColumnId(doneRes?.data?._id || null);
      } catch (err) {
        // No done column set yet
        setDoneColumnId(null);
      }
    } catch (error) {
      toast.error("Unable to load columns", { position: "bottom-right" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadColumns();
  }, [boardId]);

  const handleSetDoneColumn = async (columnId: string) => {
    try {
      await setDoneColumn(boardId, columnId);
      toast.success("Set as Done column", { position: "bottom-right" });
      setDoneColumnId(columnId);
      onColumnsChange?.();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to set Done column", { position: "bottom-right" });
    }
  };

  const handleAddColumn = async () => {
    if (!columnName.trim()) {
      show({ title: "Error", message: "Please enter a column name!", variant: "error" });
      return;
    }

    try {
        await createColumn({
          board_id: boardId,
          name: columnName.trim(),
          order: columns.length + 1,
          isdone: isDone
        });
      
      toast.success("Column added successfully!", { position: "bottom-right" });
      setShowAddModal(false);
      setColumnName("");
      loadColumns();
      onColumnsChange?.();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to add column!", { position: "bottom-right" });
    }
  };

  const handleUpdateColumn = async (columnId: string, newName: string) => {
    if (!newName.trim()) {
      show({ title: "Error", message: "Column name cannot be empty!", variant: "error" });
      return;
    }


    try {
      const response = await updateColumn(columnId, {
        name: newName.trim()
      });
      
      
      toast.success("Column updated successfully!", { position: "bottom-right" });
      setEditingColumnId(null);
      setEditingName("");
      await loadColumns();
      onColumnsChange?.();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || "Unable to update column!", { position: "bottom-right" });
    }
  };

  const handleDeleteColumn = async (columnId: string) => {
    const confirmed = await confirm({
      title: "Confirm Deletion",
      message: "Are you sure you want to delete this column? All tasks in the column will be removed.",
      variant: "error"
    });
    
    if (!confirmed) return;

    try {
      await deleteColumn(columnId);
      toast.success("Column deleted successfully!", { position: "bottom-right" });
      loadColumns();
      onColumnsChange?.();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to delete column!", { position: "bottom-right" });
    }
  };

  const startEditing = (column: any) => {
    setEditingColumnId(column._id || column.id);
    setEditingName(column.name);
  };

  const cancelEditing = () => {
    setEditingColumnId(null);
    setEditingName("");
  };

  const saveEdit = async (columnId: string) => {
    await handleUpdateColumn(columnId, editingName);
  };

  const handleKeyPress = (e: React.KeyboardEvent, columnId: string) => {
    if (e.key === 'Enter') {
      saveEdit(columnId);
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  if (loading) {
    return <div className="p-5 text-center">Loading columns...</div>;
  }

  return (
    <div className="p-5">
      <div className="flex justify-between items-center mb-5">
        <h3 className="m-0 text-slate-800 text-xl font-semibold">Manage Columns</h3>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer rounded transition-colors text-sm"
        >
          + Add Column
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {columns.map((col) => (
          <div
            key={col._id || col.id}
            className="p-4 bg-white border border-slate-300 rounded-none flex justify-between items-center shadow-sm"
          >
            <div className="flex-1">
              {editingColumnId === (col._id || col.id) ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => handleKeyPress(e, col._id || col.id)}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-none text-sm font-semibold bg-white text-slate-800 outline-none focus:border-blue-600"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      saveEdit(col._id || col.id);
                    }}
                    className="px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded-md text-white cursor-pointer text-sm font-semibold transition-colors"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={cancelEditing}
                    className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 rounded-md text-white cursor-pointer text-sm font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="font-medium text-slate-800">
                    {col.name}
                  </div>
                  {doneColumnId === (col._id || col.id) && (
                    <span className="px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded-full">
                      ✓ Done Column
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-2 ml-3">
              {editingColumnId !== (col._id || col.id) && (
                <>
                  <button
                    type="button"
                    onClick={() => handleSetDoneColumn(col._id || col.id)}
                    className={`px-3 py-1.5 rounded-md text-white cursor-pointer text-sm font-semibold transition-colors ${
                      'bg-green-600 hover:bg-green-700'
                    }`}
                    title="Set as Done column"
                  >
                    {doneColumnId === (col._id || col.id) ? '✓ Done' : 'Set Done'}
                  </button>
                  <button
                    type="button"
                    onClick={() => startEditing(col)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-md text-white cursor-pointer text-sm font-semibold transition-colors"
                  >
                    Edit
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => handleDeleteColumn(col._id || col.id)}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-md text-white cursor-pointer text-sm font-semibold transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-black/50 flex justify-center items-center z-[3000]"
          onClick={() => {
            setShowAddModal(false);
            setColumnName("");
          }}
        >
          <div
            className="bg-white p-6 w-11/12 max-w-md rounded-none border border-slate-300 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold text-slate-800 mb-5">
              Add New Column
            </h3>

            <div className="mb-5">
              <label className="block mb-2 font-medium text-slate-800 text-sm">
                Column name: *
              </label>

              <input
                type="text"
                value={columnName}
                onChange={(e) => setColumnName(e.target.value)}
                placeholder="Enter column name..."
                className="w-full px-3 py-2.5 border border-slate-300 rounded-none text-sm bg-white text-slate-800 outline-none focus:border-blue-600 transition-colors"
                autoFocus
              />

              {/* Checkbox "Cột hoàn thành" */}
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isDone}
                  onChange={(e) => setIsDone(e.target.checked)}
                  id="isDone"
                  className="w-4 h-4 cursor-pointer"
                />
                <label htmlFor="isDone" className="text-slate-700 font-medium text-sm cursor-pointer">
                  Done column
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setColumnName("");
                }}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-md cursor-pointer font-semibold text-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddColumn}
                disabled={!columnName.trim()}
                className={`px-5 py-2.5 rounded-md font-semibold transition-colors ${
                  columnName.trim()
                    ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColumnManager;