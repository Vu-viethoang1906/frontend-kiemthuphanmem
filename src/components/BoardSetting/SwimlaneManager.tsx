import React, { useState, useEffect } from "react";
import { 
  fetchSwimlanesByBoard, 
  createSwimlane, 
  updateSwimlane, 
  deleteSwimlane,
  toggleCollapseSwimlane
} from "../../api/swimlaneApi";
import { useModal } from "../ModalProvider";
import { toast } from "react-hot-toast";

interface SwimlaneManagerProps {
  boardId: string;
  onSwimlanesChange?: () => void;
}

const SwimlaneManager: React.FC<SwimlaneManagerProps> = ({ boardId, onSwimlanesChange }) => {
    const { show, confirm } = useModal();
  const [swimlanes, setSwimlanes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSwimlaneId, setEditingSwimlaneId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [swimlaneName, setSwimlaneName] = useState("");

  const loadSwimlanes = async () => {
    try {
      setLoading(true);
      const res = await fetchSwimlanesByBoard(boardId);
      setSwimlanes(res?.data || []);
    } catch (error) {
      toast.error("Unable to load swimlanes", { position: "bottom-right" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSwimlanes();
  }, [boardId]);

  const handleAddSwimlane = async () => {
    if (!swimlaneName.trim()) {
      show({ title: "Error", message: "Please enter a swimlane name!", variant: "error" });
      return;
    }

    try {
      await createSwimlane({
        board_id: boardId,
        name: swimlaneName.trim(),
        order: swimlanes.length + 1
      });
      
      toast.success("Swimlane added successfully!", { position: "bottom-right" });
      setShowAddModal(false);
      setSwimlaneName("");
      loadSwimlanes();
      onSwimlanesChange?.();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to add swimlane!", { position: "bottom-right" });
    }
  };

  const handleUpdateSwimlane = async (swimlaneId: string) => {
    if (!editingName.trim()) {
      show({ title: "Error", message: "Please enter a swimlane name!", variant: "error" });
      return;
    }

    try {
      await updateSwimlane(swimlaneId, {
        name: editingName.trim()
      });
      
      toast.success("Swimlane updated successfully!", { position: "bottom-right" });
      setEditingSwimlaneId(null);
      setEditingName("");
      loadSwimlanes();
      onSwimlanesChange?.();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to update swimlane!", { position: "bottom-right" });
    }
  };

  const handleDeleteSwimlane = async (swimlaneId: string) => {
    const confirmed = await confirm({
      title: "Confirm Deletion",
      message: "Are you sure you want to delete this swimlane? This action cannot be undone.",
      variant: "error"
    });
    
    if (!confirmed) return;

    try {
      await deleteSwimlane(swimlaneId);
      toast.success("Swimlane deleted successfully!", { position: "bottom-right" });
      loadSwimlanes();
      onSwimlanesChange?.();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to delete swimlane!", { position: "bottom-right" });
    }
  };

  const handleToggleCollapse = async (swimlaneId: string) => {
    try {
      await toggleCollapseSwimlane(swimlaneId);
      loadSwimlanes();
      onSwimlanesChange?.();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to toggle swimlane!", { position: "bottom-right" });
    }
  };

  const startEditing = (swimlane: any) => {
    setEditingSwimlaneId(swimlane._id || swimlane.id);
    setEditingName(swimlane.name);
  };

  const cancelEditing = () => {
    setEditingSwimlaneId(null);
    setEditingName("");
  };

  const handleKeyPress = (e: React.KeyboardEvent, swimlaneId: string) => {
    if (e.key === 'Enter') {
      handleUpdateSwimlane(swimlaneId);
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  if (loading) {
    return (
      <div className="p-5 text-center text-slate-700">
        <span className="inline-block w-5 h-5 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin mr-2 align-[-2px]" />
        Loading swimlanes...
      </div>
    );
  }

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="m-0 text-slate-800 text-xl font-semibold">Manage Swimlanes</h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded text-sm"
        >
          + Add Swimlane
        </button>
      </div>

      {swimlanes.length === 0 ? (
        <div className="text-center p-10 text-slate-600">
            No swimlanes found. Swimlanes help group tasks by team, priority, or category.
          </div>
      ) : (
        <div className="flex flex-col gap-3">
          {swimlanes.map((sw) => (
            <div
              key={sw._id || sw.id}
              className="p-4 bg-white border border-slate-300 rounded-none flex items-center justify-between shadow-sm"
            >
              <div className="flex-1 min-w-0">
              {editingSwimlaneId === (sw._id || sw.id) ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => handleKeyPress(e, sw._id || sw.id)}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-none text-sm font-semibold bg-white text-slate-800 outline-none focus:border-blue-600"
                    autoFocus
                  />
                  <button
                    onClick={() => handleUpdateSwimlane(sw._id || sw.id)}
                    className="px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded-md text-white cursor-pointer text-sm font-semibold"
                  >
                    Save
                  </button>
                  <button
                    onClick={cancelEditing}
                    className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 rounded-md text-white cursor-pointer text-sm font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="font-medium text-slate-800 truncate">{sw.name}</div>
              )}
              </div>
              <div className="flex gap-2">
                {editingSwimlaneId !== (sw._id || sw.id) && (
                  <button
                    onClick={() => startEditing(sw)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-md text-white cursor-pointer text-sm font-semibold"
                  >
                    Edit
                  </button>
                )}
                <button
                  onClick={() => handleDeleteSwimlane(sw._id || sw.id)}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-md text-white cursor-pointer text-sm font-semibold"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-black/50 flex justify-center items-center z-[3000]"
          onClick={() => {
            setShowAddModal(false);
            setSwimlaneName("");
          }}
        >
          <div
            className="bg-white p-6 w-11/12 max-w-md rounded-none border border-slate-300 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold text-slate-800 mb-5">Add New Swimlane</h3>

            <div className="mb-5">
              <label className="block mb-2 font-medium text-slate-800 text-sm">
                Swimlane name: *
              </label>
              <input
                type="text"
                value={swimlaneName}
                onChange={(e) => setSwimlaneName(e.target.value)}
                placeholder="Enter swimlane name..."
                className="w-full px-3 py-2.5 border border-slate-300 rounded-none text-sm bg-white text-slate-800 outline-none focus:border-blue-600"
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSwimlaneName("");
                }}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-md cursor-pointer font-semibold text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSwimlane}
                disabled={!swimlaneName.trim()}
                className={`px-5 py-2.5 rounded-lg font-semibold ${
                  swimlaneName.trim()
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
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

export default SwimlaneManager;
