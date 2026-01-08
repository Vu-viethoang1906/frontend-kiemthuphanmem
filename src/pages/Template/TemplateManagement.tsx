import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useModal } from "../../components/ModalProvider";
import {
  fetchTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  fetchTemplateColumns,
  createTemplateColumn,
  updateTemplateColumn,
  deleteTemplateColumn,
  fetchTemplateSwimlanes,
  createTemplateSwimlane,
  updateTemplateSwimlane,
  deleteTemplateSwimlane,
} from "../../api/templateApi";
import { useUrlState } from "../../hooks/useUrlState";
import { useVietnameseSearch } from "../../hooks/useVietnameseSearch";
import { vietnameseIncludes } from "../../utils/vietnamese";
import toast from "react-hot-toast";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import { Plus, Edit, Trash2, Calendar, ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Sortable Column Item Component
const SortableColumnItem: React.FC<{
  column: any;
  editingColumnId: string | null;
  editingColumnName: string;
  savingColumn: boolean;
  onStartEdit: (column: any) => void;
  onCancelEdit: () => void;
  onSaveEdit: (columnId: string) => void;
  onKeyPress: (e: React.KeyboardEvent, columnId: string) => void;
  onDelete: (column: any) => void;
  setEditingColumnName: (name: string) => void;
}> = ({
  column,
  editingColumnId,
  editingColumnName,
  savingColumn,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onKeyPress,
  onDelete,
  setEditingColumnName,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column._id || column.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      className={`flex items-center justify-between border border-slate-200 bg-white hover:bg-blue-50 transition shadow-sm ${isDragging ? 'opacity-60' : ''}`}
      style={style}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-center gap-3 p-3 flex-1">
        <div className="text-slate-500">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </div>
        {editingColumnId === (column._id || column.id) ? (
          <div className="flex items-center gap-2 flex-1">
            <input
              type="text"
              value={editingColumnName}
              onChange={(e) => setEditingColumnName(e.target.value)}
              onKeyDown={(e) => onKeyPress(e, column._id || column.id)}
              className="flex-1 rounded-none border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
              autoFocus
            />
            <button
onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSaveEdit(column._id || column.id);
              }}
              disabled={savingColumn}
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-2.5 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                onCancelEdit();
              }}
              className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-2.5 py-2 text-slate-700 hover:bg-slate-50"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between flex-1 cursor-pointer">
            <span className="text-slate-900 font-medium" onClick={() => onStartEdit(column)}>{column.name}</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onStartEdit(column); }}
              className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-2 py-1 text-blue-600 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
              aria-label="Edit column"
            >
              <Edit className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
      <div className="pr-2">
        <button type="button" aria-label="Delete column" onClick={() => onDelete(column)} className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-2.5 py-2 text-rose-600 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Sortable Swimlane Item Component
const SortableSwimlaneItem: React.FC<{
  swimlane: any;
  editingSwimlaneId: string | null;
  editingSwimlaneName: string;
  savingSwimlane: boolean;
  onStartEdit: (swimlane: any) => void;
  onCancelEdit: () => void;
  onSaveEdit: (swimlaneId: string) => void;
  onKeyPress: (e: React.KeyboardEvent, swimlaneId: string) => void;
  onDelete: (swimlane: any) => void;
  setEditingSwimlaneName: (name: string) => void;
}> = ({
  swimlane,
  editingSwimlaneId,
  editingSwimlaneName,
  savingSwimlane,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onKeyPress,
  onDelete,
  setEditingSwimlaneName,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: swimlane._id || swimlane.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      className={`flex items-center justify-between border border-slate-200 bg-white hover:bg-blue-50 transition shadow-sm ${isDragging ? 'opacity-60' : ''}`}
      style={style}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-center gap-3 p-3 flex-1">
        <div className="text-slate-500">
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </div>
        {editingSwimlaneId === (swimlane._id || swimlane.id) ? (
          <div className="flex items-center gap-2 flex-1">
            <input
              type="text"
              value={editingSwimlaneName}
              onChange={(e) => setEditingSwimlaneName(e.target.value)}
              onKeyDown={(e) => onKeyPress(e, swimlane._id || swimlane.id)}
              className="flex-1 rounded-none border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
              autoFocus
            />
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSaveEdit(swimlane._id || swimlane.id);
              }}
              disabled={savingSwimlane}
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-2.5 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                onCancelEdit();
              }}
              className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-2.5 py-2 text-slate-700 hover:bg-slate-50"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between flex-1 cursor-pointer">
            <span className="text-slate-900 font-medium" onClick={() => onStartEdit(swimlane)}>{swimlane.name}</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onStartEdit(swimlane); }}
              className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-2 py-1 text-blue-600 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
              aria-label="Edit swimlane"
            >
              <Edit className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
      <div className="pr-2">
        <button type="button" aria-label="Delete swimlane" onClick={() => onDelete(swimlane)} className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-2.5 py-2 text-rose-600 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const TemplateManagement: React.FC = () => {
  const { show, confirm } = useModal();
  
  // 🔥 Deep Linking: Sync state with URL
  const [urlState, setUrlState] = useUrlState({
    page: "1",
    limit: "12",
    q: "",
    sortBy: "created_at",
    sortOrder: "desc"
  });
  
  // 🔥 Vietnamese Search Hook
  const { searchValue, searchTerm, handleInputChange, handleCompositionStart, handleCompositionEnd } = useVietnameseSearch({
    page: "1",
    limit: "12",
    q: "",
    sortBy: "created_at",
sortOrder: "desc"
  });

  const [templates, setTemplates] = useState<any[]>([]);
  const [allTemplates, setAllTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasPermissionError, setHasPermissionError] = useState<boolean>(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "detail">("list");
  const [totalTemplates, setTotalTemplates] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [detailTab, setDetailTab] = useState<'columns' | 'swimlanes'>('columns');
  
  // Parse URL state
  const sortBy = urlState.sortBy || "created_at";
  const sortOrder = urlState.sortOrder || "desc";
  const currentPage = parseInt(urlState.page) || 1;
  const itemsPerPage = parseInt(urlState.limit) || 12;

  // Template CRUD modals
  const [showCreateTemplateModal, setShowCreateTemplateModal] = useState(false);
  const [showEditTemplateModal, setShowEditTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");

  // Column states
  const [columns, setColumns] = useState<any[]>([]);
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [editingColumn, setEditingColumn] = useState<any | null>(null);
  const [columnName, setColumnName] = useState("");
  const [columnOrder, setColumnOrder] = useState(1);
  
  // Inline editing states for columns
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editingColumnName, setEditingColumnName] = useState("");
  const [savingColumn, setSavingColumn] = useState(false);
  
  // Inline editing states for swimlanes
  const [editingSwimlaneId, setEditingSwimlaneId] = useState<string | null>(null);
  const [editingSwimlaneName, setEditingSwimlaneName] = useState("");
  const [savingSwimlane, setSavingSwimlane] = useState(false);

  // Swimlane states
  const [swimlanes, setSwimlanes] = useState<any[]>([]);
  const [showSwimlaneModal, setShowSwimlaneModal] = useState(false);
  const [editingSwimlane, setEditingSwimlane] = useState<any | null>(null);
  const [swimlaneName, setSwimlaneName] = useState("");
  const [swimlaneOrder, setSwimlaneOrder] = useState(1);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadTemplates();
  }, []);
  
  useEffect(() => {
    filterAndSortTemplates();
  }, [allTemplates, searchTerm, sortBy, sortOrder, currentPage]);
  
  // 🔥 URL State handlers (keep for sort)
  
  const handleSortChange = (field: string, order: string) => {
    setUrlState({ ...urlState, sortBy: field, sortOrder: order, page: "1" });
  };
  
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setUrlState({ ...urlState, page: page.toString() });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const loadTemplates = async () => {
    setLoading(true);
    setHasPermissionError(false);
    try {
      const data = await fetchTemplates();
      setAllTemplates(data);
    } catch (error: any) {
      console.error("Error loading templates:", error);
      
      // 🔥 Check nếu là lỗi 403 (Forbidden - không có quyền)
      if (error?.response?.status === 403) {
        setHasPermissionError(true);
        toast.error("You do not have permission to view templates. Please contact the administrator to request access.");
      } else if (error?.response?.status === 401) {
        toast.error("Session expired. Please login again");
      } else {
        toast.error(error?.response?.data?.message || "Could not load template list");
      }
    } finally {
      setLoading(false);
    }
  };
  
  const filterAndSortTemplates = () => {
    let filtered = [...allTemplates];
    
    // 🔥 Client-side search (Vietnamese-aware)
    if (searchTerm) {
      filtered = filtered.filter((t: any) => {
        const nameMatch = vietnameseIncludes(t.name || "", searchTerm);
        const descMatch = vietnameseIncludes(t.description || "", searchTerm);
        return nameMatch || descMatch;
      });
    }
    
    // 🔥 Client-side sort
    filtered.sort((a: any, b: any) => {
      let aVal, bVal;
      if (sortBy === "name") {
        aVal = (a.name || "").toLowerCase();
        bVal = (b.name || "").toLowerCase();
      } else if (sortBy === "created_at") {
        aVal = new Date(a.created_at || 0).getTime();
        bVal = new Date(b.created_at || 0).getTime();
      } else {
        aVal = new Date(a.updated_at || 0).getTime();
        bVal = new Date(b.updated_at || 0).getTime();
      }
      
      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    
    // 🔥 Client-side pagination
    setTotalTemplates(filtered.length);
    setTotalPages(Math.max(1, Math.ceil(filtered.length / itemsPerPage)));
    
    const startIdx = (currentPage - 1) * itemsPerPage;
    const paginated = filtered.slice(startIdx, startIdx + itemsPerPage);
    
    setTemplates(paginated);
  };

  const loadTemplateDetails = async (templateId: string) => {
    try {
      const [columnsData, swimlanesData] = await Promise.all([
        fetchTemplateColumns(templateId),
        fetchTemplateSwimlanes(templateId),
      ]);
      setColumns(columnsData);
      setSwimlanes(swimlanesData);
    } catch (error) {
      console.error("Error loading template details:", error);
    }
  };

  // Template CRUD handlers
  const handleCreateTemplate = async () => {
    if (!templateName.trim()) {
      toast.error("Please enter a template name!");
      return;
    }

    try {
      await createTemplate({
        name: templateName.trim(),
        description: templateDescription.trim(),
      });
      toast.success("Template created successfully!");
      setShowCreateTemplateModal(false);
      setTemplateName("");
      setTemplateDescription("");
      loadTemplates();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not create template!");
    }
  };

  const handleEditTemplate = async () => {
    if (!selectedTemplate || !templateName.trim()) return;

    try {
      await updateTemplate(selectedTemplate._id || selectedTemplate.id, {
        name: templateName.trim(),
        description: templateDescription.trim(),
      });
      toast.success("Template updated successfully!");
      setShowEditTemplateModal(false);
      setSelectedTemplate({ ...selectedTemplate, name: templateName, description: templateDescription });
      loadTemplates();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not update template!");
    }
  };

  const handleDeleteTemplate = async (template: any, e: React.MouseEvent) => {
    e.stopPropagation();

    const confirmed = await confirm({
      title: "Confirm Template Deletion",
      message: `Are you sure you want to delete template "${template.name}"?`,
      variant: "error",
    });

    if (!confirmed) return;

    try {
      await deleteTemplate(template._id || template.id);
      toast.success("Template deleted successfully!");
      loadTemplates();
      if (selectedTemplate?._id === template._id) {
        setViewMode("list");
        setSelectedTemplate(null);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not delete template!");
    }
  };

  const handleViewTemplate = (template: any) => {
    setSelectedTemplate(template);
    setViewMode("detail");
    loadTemplateDetails(template._id || template.id);
    setDetailTab('columns');
  };

  // Column CRUD handlers
  const handleOpenColumnModal = (column?: any) => {
    if (column) {
      setEditingColumn(column);
      setColumnName(column.name);
      setColumnOrder(column.order || 1);
    } else {
      setEditingColumn(null);
      setColumnName("");
      setColumnOrder(columns.length + 1);
    }
    setShowColumnModal(true);
  };
  
  // Inline column editing functions
  const startEditingColumn = (column: any) => {
    setEditingColumnId(column._id || column.id);
    setEditingColumnName(column.name);
  };
  
  const cancelEditingColumn = () => {
    setEditingColumnId(null);
    setEditingColumnName("");
  };
  
  const saveColumnEdit = async (columnId: string) => {
    if (!editingColumnName.trim()) {
      toast.error("Column name cannot be empty!");
      return;
    }
    
    if (savingColumn) {
      return;
    }
    
setSavingColumn(true);
    
    try {
      const response = await updateTemplateColumn(columnId, {
        name: editingColumnName.trim()
      });
      
      await loadTemplateDetails(selectedTemplate._id || selectedTemplate.id);
      
      toast.success("Column updated successfully!");
      setEditingColumnId(null);
      setEditingColumnName("");
    } catch (error: any) {
      console.error('❌ Column update error:', {
        error,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
        message: error?.message
      });
      
      let errorMessage = "Could not update column!";
      if (error?.response?.status === 403) {
        errorMessage = "You do not have permission to update this template!";
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setSavingColumn(false);
    }
  };
  
  const handleColumnKeyPress = (e: React.KeyboardEvent, columnId: string) => {
    if (e.key === 'Enter') {
      saveColumnEdit(columnId);
    } else if (e.key === 'Escape') {
      cancelEditingColumn();
    }
  };
  
  // Inline swimlane editing functions
  const startEditingSwimlane = (swimlane: any) => {
    setEditingSwimlaneId(swimlane._id || swimlane.id);
    setEditingSwimlaneName(swimlane.name);
  };
  
  const cancelEditingSwimlane = () => {
    setEditingSwimlaneId(null);
    setEditingSwimlaneName("");
  };
  
  const saveSwimlaneEdit = async (swimlaneId: string) => {
    if (!editingSwimlaneName.trim()) {
      toast.error("Swimlane name cannot be empty!");
      return;
    }
    
    if (savingSwimlane) {
      return;
    }
    
    
    setSavingSwimlane(true);
    
    try {
      const response = await updateTemplateSwimlane(swimlaneId, {
        name: editingSwimlaneName.trim()
      });
      
      await loadTemplateDetails(selectedTemplate._id || selectedTemplate.id);
      
      toast.success("Swimlane updated successfully!");
      setEditingSwimlaneId(null);
setEditingSwimlaneName("");
    } catch (error: any) {
      console.error('❌ Swimlane update error:', {
        error,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
        message: error?.message
      });
      
      let errorMessage = "Could not update swimlane!";
      if (error?.response?.status === 403) {
        errorMessage = "You do not have permission to update this template!";
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setSavingSwimlane(false);
    }
  };
  
  const handleSwimlaneKeyPress = (e: React.KeyboardEvent, swimlaneId: string) => {
    if (e.key === 'Enter') {
      saveSwimlaneEdit(swimlaneId);
    } else if (e.key === 'Escape') {
      cancelEditingSwimlane();
    }
  };

  const handleSaveColumn = async () => {
    if (!columnName.trim()) {
      toast.error("Please enter a column name!");
      return;
    }

    try {
      await createTemplateColumn({
        template_id: selectedTemplate._id || selectedTemplate.id,
        name: columnName.trim(),
        order: columnOrder,
      });
      toast.success("Column created successfully!");
      setShowColumnModal(false);
      setColumnName("");
      setColumnOrder(columns.length + 1);
      loadTemplateDetails(selectedTemplate._id || selectedTemplate.id);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not save column!");
    }
  };

  const handleDeleteColumn = async (column: any) => {
    const confirmed = await confirm({
      title: "Confirm Column Deletion",
      message: `Are you sure you want to delete column "${column.name}"?`,
      variant: "error",
    });

    if (!confirmed) return;

    try {
      await deleteTemplateColumn(column._id || column.id);
      toast.success("Column deleted successfully!");
      loadTemplateDetails(selectedTemplate._id || selectedTemplate.id);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not delete column!");
    }
  };

  // Swimlane CRUD handlers
  const handleOpenSwimlaneModal = (swimlane?: any) => {
    if (swimlane) {
      setEditingSwimlane(swimlane);
      setSwimlaneName(swimlane.name);
      setSwimlaneOrder(swimlane.order || 1);
    } else {
      setEditingSwimlane(null);
      setSwimlaneName("");
      setSwimlaneOrder(swimlanes.length + 1);
    }
    setShowSwimlaneModal(true);
  };

  const handleSaveSwimlane = async () => {
if (!swimlaneName.trim()) {
      toast.error("Please enter a swimlane name!");
      return;
    }

    try {
      await createTemplateSwimlane({
        template_id: selectedTemplate._id || selectedTemplate.id,
        name: swimlaneName.trim(),
        order: swimlaneOrder,
      });
      toast.success("Swimlane created successfully!");
      setShowSwimlaneModal(false);
      setSwimlaneName("");
      setSwimlaneOrder(swimlanes.length + 1);
      loadTemplateDetails(selectedTemplate._id || selectedTemplate.id);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not save swimlane!");
    }
  };

  const handleDeleteSwimlane = async (swimlane: any) => {
    const confirmed = await confirm({
      title: "Confirm Swimlane Deletion",
      message: `Are you sure you want to delete swimlane "${swimlane.name}"?`,
      variant: "error",
    });

    if (!confirmed) return;

    try {
      await deleteTemplateSwimlane(swimlane._id || swimlane.id);
      toast.success("Swimlane deleted successfully!");
      loadTemplateDetails(selectedTemplate._id || selectedTemplate.id);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not delete swimlane!");
    }
  };

  // Drag and Drop handlers
  const handleColumnDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;
    
    const oldIndex = columns.findIndex((col) => (col._id || col.id) === active.id);
    const newIndex = columns.findIndex((col) => (col._id || col.id) === over.id);
    
    if (oldIndex !== -1 && newIndex !== -1) {
      const newColumns = arrayMove(columns, oldIndex, newIndex);
      setColumns(newColumns);
      
      // Update order for each column individually
      try {
        const updatePromises = newColumns.map((col, index) => 
          updateTemplateColumn(col._id || col.id, { order: index + 1 })
        );
        await Promise.all(updatePromises);
      } catch (error) {
        console.error('❌ Failed to update column order:', error);
        toast.error("Could not update column order!");
        // Reload to get correct order from server
        if (selectedTemplate) {
          loadTemplateDetails(selectedTemplate._id || selectedTemplate.id);
        }
      }
    }
  };

  const handleSwimlaneDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;
    
    const oldIndex = swimlanes.findIndex((swim) => (swim._id || swim.id) === active.id);
const newIndex = swimlanes.findIndex((swim) => (swim._id || swim.id) === over.id);
    
    if (oldIndex !== -1 && newIndex !== -1) {
      const newSwimlanes = arrayMove(swimlanes, oldIndex, newIndex);
      setSwimlanes(newSwimlanes);
      
      // Update order for each swimlane individually
      try {
        const updatePromises = newSwimlanes.map((swim, index) => 
          updateTemplateSwimlane(swim._id || swim.id, { order: index + 1 })
        );
        await Promise.all(updatePromises);
      } catch (error) {
        console.error('❌ Failed to update swimlane order:', error);
        toast.error("Could not update swimlane order!");
        // Reload to get correct order from server
        if (selectedTemplate) {
          loadTemplateDetails(selectedTemplate._id || selectedTemplate.id);
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 border-b border-blue-200">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-6 flex items-center justify-between gap-6">
          <h1 className="flex items-center gap-3 text-xl md:text-2xl font-bold text-white tracking-tight">
            <span className="w-10 h-10 rounded-md bg-white/10 flex items-center justify-center">
              <svg className="text-white" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
            </span>
            Template Management
          </h1>
          <div className="flex items-center gap-2">
            {viewMode === "list" && (
              <button
                onClick={() => {
                  setTemplateName("");
                  setTemplateDescription("");
                  setShowCreateTemplateModal(true);
                }}
                className="inline-flex items-center gap-2 rounded-md bg-white/10 text-white font-semibold px-4 py-2.5 shadow hover:bg-white/20 transition"
              >
                <Plus className="w-4 h-4" /> New Template
              </button>
            )}
            {viewMode === "detail" && (
              <button
                onClick={() => {
                  setViewMode("list");
                  setSelectedTemplate(null);
                }}
                className="inline-flex items-center gap-2 rounded-md bg-blue-600 text-white font-semibold px-4 py-2.5 shadow hover:bg-blue-700 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Template List View */}
      {viewMode === "list" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Search and Filters */}
          <div className="max-w-[1400px] mx-auto px-4 md:px-8 mt-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">SEARCH & FILTERS</div>
            {/* Row 1: Search only */}
            <div className="bg-white border border-blue-200 rounded-none p-3">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  placeholder="Search templates by name or description..."
                  value={searchValue}
                  onChange={handleInputChange}
                  onCompositionStart={handleCompositionStart}
                  onCompositionEnd={handleCompositionEnd}
                  className="w-full rounded-none border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 py-2.5 pl-9 pr-3 text-sm"
                />
              </div>
            </div>
            {/* Row 2: Sort/Order and Range */}
            <div className="mt-2 bg-white border border-blue-200 rounded-none px-3 py-2 flex flex-wrap items-center gap-3 sm:gap-5">
              <div className="inline-flex items-center gap-2 sm:gap-2.5">
                <div className="text-[11px] sm:text-[12px] uppercase font-semibold text-slate-600">Order</div>
                <select 
                  value={sortOrder} 
                  onChange={(e) => handleSortChange(sortBy, e.target.value)}
                  className="rounded-none border border-slate-300 bg-white py-1.5 px-2.5 text-sm min-w-[120px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                >
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </select>
              </div>
              <div className="ml-auto text-xs sm:text-sm text-slate-700 whitespace-nowrap pl-2 sm:pl-4">
                Total Templates: <span className="font-semibold text-slate-900">{totalTemplates}</span>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center gap-6 py-24">
              <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin"></div>
              <p className="uppercase text-sm tracking-wider font-semibold text-slate-500">Loading Templates...</p>
            </div>
          ) : hasPermissionError ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg border border-gray-200 max-w-[1400px] mx-auto mt-6">
              <div className="mb-6">
                <svg className="w-24 h-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h3>
              <p className="text-gray-600 text-center max-w-md">
                You don't have permission to view templates. Please contact the administrator to request access.
              </p>
            </div>
          ) : templates.length === 0 ? (
            <div className="bg-white rounded-none border-2 border-dashed border-slate-300 px-8 py-24 text-center max-w-[1400px] mx-auto mt-6">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              <h3 className="text-xl font-bold text-slate-900 mt-2">{searchTerm ? "No Templates Found" : "No Templates Yet"}</h3>
              <p className="text-slate-600 mt-1">{searchTerm ? `No templates match "${searchTerm}"` : "Create your first template to get started"}</p>
              {!searchTerm && (
                <div className="mt-4">
                  <button
                    onClick={() => {
                      setTemplateName("");
                      setTemplateDescription("");
                      setShowCreateTemplateModal(true);
                    }}
                    className="inline-flex items-center gap-2 rounded-md bg-blue-600 text-white font-semibold px-4 py-2.5 shadow hover:bg-blue-700 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                  >
                    <Plus className="w-4 h-4" /> Create Template
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
            <div className="max-w-[1400px] mx-auto px-4 md:px-8 mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {templates.map((template) => (
                <motion.div
                  key={template._id || template.id}
                  className="group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:ring-1 hover:ring-blue-100 transition-all cursor-pointer flex flex-col h-full border-t-4 border-t-blue-100 hover:border-t-blue-300"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={() => handleViewTemplate(template)}
                >
                  <div className="p-4 border-b border-slate-100 bg-blue-50 group-hover:bg-blue-100 transition-colors flex items-start justify-between gap-3 min-h-[60px]">
                    <h3 className="text-[15px] md:text-base font-semibold text-slate-900 leading-tight line-clamp-2 pr-2">{template.name}</h3>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTemplate(template);
                          setTemplateName(template.name);
                          setTemplateDescription(template.description || "");
                          setShowEditTemplateModal(true);
                        }}
                        className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white/70 px-2.5 py-2 text-blue-600 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteTemplate(template, e)}
                        className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white/70 px-2.5 py-2 text-rose-600 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="p-4 flex-1">
                    <p className="text-sm text-slate-600 line-clamp-2 min-h-[40px]">
                      {template.description || "No description provided"}
                    </p>
                    <div className="mt-3 flex items-center">
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-full px-2.5 py-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(template.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8 py-4">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-md border inline-flex items-center gap-2 ${currentPage === 1 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white hover:bg-slate-50 border-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300'}`}
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                
                <div className="flex gap-2">
                  {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-2 rounded-md border ${currentPage === page ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300'}`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 rounded-md border inline-flex items-center gap-2 ${currentPage === totalPages ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white hover:bg-slate-50 border-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300'}`}
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
                
                <div className="text-slate-600 text-sm ml-4">Page {currentPage} of {totalPages}</div>
              </div>
            )}
            </>
          )}
        </motion.div>
      )}

      {/* Template Detail View */}
      {viewMode === "detail" && selectedTemplate && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="max-w-[1400px] mx-auto px-4 md:px-8 mt-6">
            <div className="bg-white border border-blue-200 rounded-none shadow-md">
              <div className="px-6 py-4 border-b border-blue-100">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl md:text-2xl font-semibold leading-tight text-slate-900">{selectedTemplate.name}</h2>
                    {selectedTemplate.description && (
                      <p className="mt-1 text-sm text-slate-600">{selectedTemplate.description}</p>
                    )}
                  </div>
                  <div className="hidden sm:flex items-center gap-3">
                    <div className="bg-white rounded-none p-3 border border-slate-100 shadow-sm flex items-center gap-2">
                      <span className="w-7 h-7 rounded-md flex items-center justify-center text-blue-600 bg-blue-50 border border-blue-100">📊</span>
                      <div>
                        <div className="text-base font-semibold text-slate-900 leading-none">{columns.length}</div>
                        <div className="uppercase text-[10px] tracking-wider font-semibold text-slate-500">Columns</div>
                      </div>
                    </div>
                    <div className="bg-white rounded-none p-3 border border-slate-100 shadow-sm flex items-center gap-2">
                      <span className="w-7 h-7 rounded-md flex items-center justify-center text-violet-600 bg-violet-50 border border-violet-100">🏁</span>
                      <div>
                        <div className="text-base font-semibold text-slate-900 leading-none">{swimlanes.length}</div>
                        <div className="uppercase text-[10px] tracking-wider font-semibold text-slate-500">Swimlanes</div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Tabs */}
                <div className="mt-4">
                  <div className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-1 gap-2">
                    <button
                      className={`px-4 py-2 text-sm font-medium rounded-md transition ${detailTab === 'columns' ? 'bg-blue-600 text-white shadow' : 'bg-white text-slate-700 border border-slate-200 hover:bg-blue-50'}`}
                      onClick={() => setDetailTab('columns')}
                    >
                      Columns
                    </button>
                    <button
                      className={`px-4 py-2 text-sm font-medium rounded-md transition ${detailTab === 'swimlanes' ? 'bg-blue-600 text-white shadow' : 'bg-white text-slate-700 border border-slate-200 hover:bg-blue-50'}`}
                      onClick={() => setDetailTab('swimlanes')}
                    >
                      Swimlanes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Detail Section (Tabs content) */}
          <div className="max-w-[1400px] mx-auto px-4 md:px-8 mt-6">
            {detailTab === 'columns' ? (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">Columns</h3>
                  <button onClick={() => handleOpenColumnModal()} className="inline-flex items-center rounded-md border border-blue-600 bg-blue-600 text-white font-medium px-3 py-1 text-xs sm:text-sm shadow hover:bg-blue-700 transition">
                    Add Column
                  </button>
                </div>
                {columns.length === 0 ? (
                  <div className="bg-white rounded-none border-2 border-dashed border-slate-300 px-8 py-10 text-center mt-3">
                    <p className="text-slate-600">No columns yet. Add your first column to get started.</p>
                  </div>
                ) : (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleColumnDragEnd}>
                    <SortableContext items={columns.map((col) => col._id || col.id)} strategy={verticalListSortingStrategy}>
                      <div className="mt-3 space-y-2 pb-8">
                        {columns.sort((a, b) => (a.order || 0) - (b.order || 0)).map((column) => (
                          <SortableColumnItem
                            key={column._id || column.id}
                            column={column}
                            editingColumnId={editingColumnId}
                            editingColumnName={editingColumnName}
                            savingColumn={savingColumn}
                            onStartEdit={startEditingColumn}
                            onCancelEdit={cancelEditingColumn}
                            onSaveEdit={saveColumnEdit}
                            onKeyPress={handleColumnKeyPress}
                            onDelete={handleDeleteColumn}
                            setEditingColumnName={setEditingColumnName}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">Swimlanes</h3>
                  <button onClick={() => handleOpenSwimlaneModal()} className="inline-flex items-center rounded-md border border-violet-600 bg-violet-600 text-white font-medium px-3 py-1 text-xs sm:text-sm shadow hover:bg-violet-700 transition">
                    Add Swimlane
                  </button>
                </div>
                {swimlanes.length === 0 ? (
                  <div className="bg-white rounded-none border-2 border-dashed border-slate-300 px-8 py-10 text-center mt-3">
                    <p className="text-slate-600">No swimlanes yet. Add your first swimlane to get started.</p>
                  </div>
                ) : (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSwimlaneDragEnd}>
                    <SortableContext items={swimlanes.map((swim) => swim._id || swim.id)} strategy={verticalListSortingStrategy}>
                      <div className="mt-3 space-y-2 pb-8">
                        {swimlanes.sort((a, b) => (a.order || 0) - (b.order || 0)).map((swimlane) => (
                          <SortableSwimlaneItem
                            key={swimlane._id || swimlane.id}
                            swimlane={swimlane}
                            editingSwimlaneId={editingSwimlaneId}
                            editingSwimlaneName={editingSwimlaneName}
                            savingSwimlane={savingSwimlane}
                            onStartEdit={startEditingSwimlane}
                            onCancelEdit={cancelEditingSwimlane}
                            onSaveEdit={saveSwimlaneEdit}
                            onKeyPress={handleSwimlaneKeyPress}
                            onDelete={handleDeleteSwimlane}
                            setEditingSwimlaneName={setEditingSwimlaneName}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </>
            )}
          </div>

          
        </motion.div>
      )}

      {/* Create Template Modal */}
      {showCreateTemplateModal && (
        <div className="fixed inset-0 z-[1050] bg-black/50 backdrop-blur-sm flex items-center justify-center p-1" onClick={() => setShowCreateTemplateModal(false)}>
          <div className="w-full max-w-2xl max-h-[75vh] overflow-hidden rounded-xl bg-white shadow-2xl flex flex-col" role="dialog" aria-modal="true" aria-labelledby="create-template-title" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 px-6 py-3 flex items-center justify-between rounded-t-xl shadow-sm">
              <h3 id="create-template-title" className="text-white text-base font-bold">Create New Template</h3>
              <button type="button" aria-label="Close" onClick={() => setShowCreateTemplateModal(false)} className="w-8 h-8 inline-flex items-center justify-center rounded-md text-white/90 hover:bg-white/20 text-xl">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5 bg-white">
              <div className="mb-4">
                <label className="block text-[12px] uppercase font-medium tracking-wider text-slate-600 mb-1.5">Template Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Enter template name..."
                  className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-[15px] shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-[12px] uppercase font-medium tracking-wider text-slate-600 mb-1.5">Description</label>
                <textarea
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  placeholder="Enter template description..."
                  rows={3}
                  className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-[15px] shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-500 min-h-[96px]"
                />
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button onClick={() => setShowCreateTemplateModal(false)} className="px-4 py-2 rounded-md border border-slate-300 bg-white text-slate-700 font-medium hover:bg-slate-50">Cancel</button>
              <button onClick={handleCreateTemplate} className="px-4 py-2 rounded-md bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 disabled:opacity-60">Create Template</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Template Modal */}
      {showEditTemplateModal && (
        <div className="fixed inset-0 z-[1050] bg-black/50 backdrop-blur-sm flex items-center justify-center p-1" onClick={() => setShowEditTemplateModal(false)}>
          <div className="w-full max-w-2xl max-h-[75vh] overflow-hidden rounded-xl bg-white shadow-2xl flex flex-col" role="dialog" aria-modal="true" aria-labelledby="edit-template-title" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 px-6 py-3 flex items-center justify-between rounded-t-xl shadow-sm">
              <h3 id="edit-template-title" className="text-white text-base font-bold">Edit Template</h3>
              <button type="button" aria-label="Close" onClick={() => setShowEditTemplateModal(false)} className="w-8 h-8 inline-flex items-center justify-center rounded-md text-white/90 hover:bg-white/20 text-xl">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5 bg-white">
              <div className="mb-4">
                <label className="block text-[12px] uppercase font-medium tracking-wider text-slate-600 mb-1.5">Template Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-[15px] shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-[12px] uppercase font-medium tracking-wider text-slate-600 mb-1.5">Description</label>
                <textarea
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-[15px] shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-500 min-h-[96px]"
                />
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button onClick={() => setShowEditTemplateModal(false)} className="px-4 py-2 rounded-md border border-slate-300 bg-white text-slate-700 font-medium hover:bg-slate-50">Cancel</button>
              <button onClick={handleEditTemplate} className="px-4 py-2 rounded-md bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 disabled:opacity-60">Update Template</button>
            </div>
          </div>
        </div>
      )}

      {/* Column Modal */}
      {showColumnModal && (
        <div className="fixed inset-0 z-[1050] bg-black/50 backdrop-blur-sm flex items-center justify-center p-1" onClick={() => setShowColumnModal(false)}>
          <div className="w-full max-w-md max-h-[70vh] overflow-hidden rounded-none bg-white shadow-2xl flex flex-col" role="dialog" aria-modal="true" aria-labelledby="add-column-title" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 px-6 py-2 flex items-center justify-between">
              <h3 id="add-column-title" className="text-white text-base font-bold">Add Column</h3>
              <button type="button" aria-label="Close" onClick={() => setShowColumnModal(false)} className="w-8 h-8 inline-flex items-center justify-center rounded-md text-white/90 hover:bg-white/20 text-xl">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-2 pb-4 bg-white">
              <div className="mb-3">
                <label className="block font-semibold text-slate-700 text-sm mb-1">Column Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={columnName}
                  onChange={(e) => setColumnName(e.target.value)}
                  placeholder="Enter column name..."
                  className="w-full rounded-none border border-slate-200 px-3 py-2 text-[15px] focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500"
                  autoFocus
                />
              </div>
            </div>
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button onClick={() => setShowColumnModal(false)} className="px-4 py-2 rounded-md border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-50">Cancel</button>
              <button onClick={handleSaveColumn} className="px-4 py-2 rounded-md bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 disabled:opacity-60">Add Column</button>
            </div>
          </div>
        </div>
      )}

      {/* Swimlane Modal */}
      {showSwimlaneModal && (
        <div className="fixed inset-0 z-[1050] bg-black/50 backdrop-blur-sm flex items-center justify-center p-1" onClick={() => setShowSwimlaneModal(false)}>
          <div className="w-full max-w-md max-h-[70vh] overflow-hidden rounded-none bg-white shadow-2xl flex flex-col" role="dialog" aria-modal="true" aria-labelledby="add-swimlane-title" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-br from-violet-600 to-violet-700 px-6 py-2 flex items-center justify-between">
              <h3 id="add-swimlane-title" className="text-white text-base font-bold">Add Swimlane</h3>
              <button type="button" aria-label="Close" onClick={() => setShowSwimlaneModal(false)} className="w-8 h-8 inline-flex items-center justify-center rounded-md text-white/90 hover:bg-white/20 text-xl">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-2 pb-4 bg-white">
              <div className="mb-3">
                <label className="block font-semibold text-slate-700 text-sm mb-1">Swimlane Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
value={swimlaneName}
                  onChange={(e) => setSwimlaneName(e.target.value)}
                  placeholder="Enter swimlane name..."
                  className="w-full rounded-none border border-slate-200 px-3 py-2 text-[15px] focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500"
                  autoFocus
                />
              </div>
            </div>
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button onClick={() => setShowSwimlaneModal(false)} className="px-4 py-2 rounded-md border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-50">Cancel</button>
              <button onClick={handleSaveSwimlane} className="px-4 py-2 rounded-md bg-violet-600 text-white font-semibold shadow hover:bg-violet-700 disabled:opacity-60">Add Swimlane</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateManagement;