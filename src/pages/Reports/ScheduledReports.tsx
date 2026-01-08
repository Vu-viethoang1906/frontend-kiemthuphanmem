import React, { useState, useEffect } from "react";
import {
  getScheduledReports,
  createScheduledReport,
  updateScheduledReport,
  deleteScheduledReport,
  sendScheduledReportNow,
  ScheduledReport,
  CreateScheduledReportData,
} from "../../api/scheduledReportApi";
import { fetchMyBoards } from "../../api/boardApi";
import toast from "react-hot-toast";
import { useModal } from "../../components/ModalProvider";
import {
  Loader2,
  Mail,
  Calendar,
  X,
  Plus,
  Edit,
  Trash2,
  Send,
  Clock,
  AlertCircle,
  BarChart3,
  TrendingUp,
  Trophy,
  Building2,
} from "lucide-react";

interface Board {
  _id?: string;
  id?: string;
  title?: string;
  name?: string;
}

const ScheduledReports: React.FC = () => {
  const { confirm } = useModal();
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingReport, setEditingReport] = useState<ScheduledReport | null>(null);
  const [sending, setSending] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateScheduledReportData>({
    board_id: "",
    report_type: "dashboard",
    frequency: "weekly",
    recipients: [""],
    report_params: {},
  });

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load boards
      const boardsRes = await fetchMyBoards();
      let boards: any[] = [];
      if (boardsRes?.data) {
        boards = Array.isArray(boardsRes.data)
          ? boardsRes.data
          : [boardsRes.data];
      } else if (Array.isArray(boardsRes)) {
        boards = boardsRes;
      }
      const validBoards = boards.filter((b) => b && (b._id || b.id));
      setBoards(validBoards);
      if (validBoards.length > 0 && !formData.board_id) {
        setFormData((prev) => ({
          ...prev,
          board_id: validBoards[0]._id || validBoards[0].id || "",
        }));
      }

      // Load scheduled reports
      const reportsRes = await getScheduledReports();
      if (reportsRes.success && Array.isArray(reportsRes.data)) {
        setScheduledReports(reportsRes.data);
      }
    } catch (error: any) {
      console.error("Error loading data:", error);
      toast.error(error?.response?.data?.message || "Unable to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (report?: ScheduledReport) => {
    if (report) {
      setEditingReport(report);
      setFormData({
        board_id:
          typeof report.board_id === "object"
            ? report.board_id._id
            : report.board_id,
        report_type: report.report_type,
        frequency: report.frequency,
        recipients: report.recipients,
        report_params: report.report_params || {},
      });
    } else {
      setEditingReport(null);
      setFormData({
        board_id: boards[0]?._id || boards[0]?.id || "",
        report_type: "dashboard",
        frequency: "weekly",
        recipients: [""],
        report_params: {},
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingReport(null);
    setFormData({
      board_id: boards[0]?._id || boards[0]?.id || "",
      report_type: "dashboard",
      frequency: "weekly",
      recipients: [""],
      report_params: {},
    });
  };

  const handleAddRecipient = () => {
    setFormData((prev) => ({
      ...prev,
      recipients: [...prev.recipients, ""],
    }));
  };

  const handleRemoveRecipient = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      recipients: prev.recipients.filter((_, i) => i !== index),
    }));
  };

  const handleRecipientChange = (index: number, value: string) => {
    setFormData((prev) => {
      const newRecipients = [...prev.recipients];
      newRecipients[index] = value;
      return { ...prev, recipients: newRecipients };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    if (!formData.board_id) {
      toast.error("Please select a board");
      return;
    }

    const validRecipients = formData.recipients.filter((r) => r.trim() !== "");
    if (validRecipients.length === 0) {
      toast.error("Please enter at least one recipient email");
      return;
    }

    // Validate email format - regex chuẩn, dùng được 99% case thực tế (hỗ trợ email công ty như @codegym.vn)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    for (const email of validRecipients) {
      if (!emailRegex.test(email)) {
        toast.error(`Invalid email: ${email}`);
        return;
      }
    }

    try {
      const requestData = {
        board_id: formData.board_id,
        report_type: formData.report_type,
        frequency: formData.frequency,
        recipients: validRecipients,
        report_params: formData.report_params || {},
      };

      console.log("📤 Creating scheduled report:", requestData);

      if (editingReport) {
        await updateScheduledReport(editingReport._id, requestData);
        toast.success("Scheduled report updated");
      } else {
        await createScheduledReport(requestData);
        toast.success("Scheduled report created");
      }
      handleCloseModal();
      loadData();
    } catch (error: any) {
      console.error("❌ Error saving scheduled report:", error);
      console.error("Error response:", error?.response?.data);
      console.error("Error status:", error?.response?.status);
      console.error("Error headers:", error?.response?.headers);
      
      // Hiển thị error message chi tiết hơn
      let errorMessage = "Unable to save scheduled report";
      
      if (error?.response?.data) {
        const errorData = error.response.data;
        errorMessage = errorData.message || errorData.error || JSON.stringify(errorData);
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage, {
        duration: 5000, // Hiển thị lâu hơn để user đọc được
      });
    }
  };

  const handleToggleActive = async (report: ScheduledReport) => {
    try {
      await updateScheduledReport(report._id, {
        is_active: !report.is_active,
      });
      toast.success(
        report.is_active
          ? "Scheduled report disabled"
          : "Scheduled report enabled"
      );
      loadData();
    } catch (error: any) {
      console.error("Error toggling active:", error);
      toast.error("Unable to update status");
    }
  };

  const handleSendNow = async (id: string) => {
    setSending(id);
    try {
      await sendScheduledReportNow(id);
      toast.success("Report sent successfully!");
      loadData();
    } catch (error: any) {
      console.error("Error sending report:", error);
      toast.error(error?.response?.data?.message || "Unable to send report");
    } finally {
      setSending(null);
    }
  };

  const handleDeleteReport = async (report: ScheduledReport) => {
    const confirmed = await confirm({
      title: "Confirm delete",
      message: "Are you sure you want to delete this scheduled report?",
      variant: "error" as const,
      confirmText: "Delete",
      cancelText: "Cancel",
    });

    if (!confirmed) return;

    try {
      await deleteScheduledReport(report._id);
      toast.success("Scheduled report deleted");
      loadData();
    } catch (error: any) {
      console.error("Error deleting report:", error);
      toast.error(error?.response?.data?.message || "Unable to delete report");
    }
  };


  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case "dashboard":
        return <BarChart3 className="w-4 h-4" />;
      case "velocity":
        return <TrendingUp className="w-4 h-4" />;
      case "leaderboard":
        return <Trophy className="w-4 h-4" />;
      case "center_comparison":
        return <Building2 className="w-4 h-4" />;
      default:
        return <BarChart3 className="w-4 h-4" />;
    }
  };

  const getReportTypeName = (type: string) => {
    const names: Record<string, string> = {
      dashboard: "Dashboard",
      velocity: "Velocity",
      leaderboard: "Leaderboard",
      center_comparison: "Center Comparison",
    };
    return names[type] || type;
  };

  const getFrequencyName = (frequency: string) => {
    const names: Record<string, string> = {
      daily: "Daily",
      weekly: "Weekly",
      monthly: "Monthly",
    };
    return names[frequency] || frequency;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not sent";
    return new Date(dateString).toLocaleString("en-US");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Scheduled Reports
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Subscribe to periodic board reports via email
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create New
        </button>
      </div>

      {/* Scheduled Reports List */}
      {scheduledReports.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-slate-800 rounded-lg">
          <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            No scheduled reports
          </p>
          <button
            onClick={() => handleOpenModal()}
            className="mt-4 text-blue-600 hover:text-blue-700 font-semibold"
          >
            Create first scheduled report
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {scheduledReports.map((report) => {
            const boardTitle =
              report.board_id && typeof report.board_id === "object"
                ? (report.board_id.title || 'N/A')
                : (report.board_id || 'N/A');

            return (
              <div
                key={report._id}
                className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-6 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getReportTypeIcon(report.report_type)}
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {getReportTypeName(report.report_type)}
                      </h3>
                      {report.is_active ? (
                        <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-800 rounded">
                          Disabled
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        <span>{boardTitle}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{getFrequencyName(report.frequency)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <span>{report.recipients.length} recipients</span>
                        <span className="text-xs">
                          ({report.recipients.join(", ")})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>
                          Last sent: {formatDate(report.last_sent_at)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>
                          Next send: {formatDate(report.next_send_at)}
                        </span>
                      </div>
                      {report.last_error && (
                        <div className="flex items-center gap-2 text-red-600">
                          <AlertCircle className="w-4 h-4" />
                          <span>Error: {report.last_error}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleSendNow(report._id)}
                      disabled={sending === report._id}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
                      title="Send now"
                    >
                      {sending === report._id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleOpenModal(report)}
                      className="p-2 text-gray-600 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleToggleActive(report)}
                      className={`p-2 rounded-lg transition-colors ${
                        report.is_active
                          ? "text-red-600 hover:bg-red-50 dark:hover:bg-slate-700"
                          : "text-gray-600 hover:bg-gray-50 dark:hover:bg-slate-700"
                      }`}
                      title={report.is_active ? "Disable" : "Enable"}
                    >
                      {report.is_active ? <X className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => handleDeleteReport(report)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingReport ? "Edit Scheduled Report" : "Create Scheduled Report"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Board */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Board <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.board_id}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, board_id: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  required
                >
                  <option value="">Select board</option>
                  {boards.map((board) => (
                    <option
                      key={board._id || board.id}
                      value={board._id || board.id}
                    >
                      {board.title || board.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Report Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Report Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.report_type}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      report_type: e.target.value as any,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  required
                >
                  <option value="dashboard">Dashboard</option>
                  <option value="velocity">Velocity</option>
                  <option value="leaderboard">Leaderboard</option>
                  <option value="center_comparison">Center Comparison</option>
                </select>
              </div>

              {/* Frequency */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Frequency <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.frequency}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      frequency: e.target.value as any,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  required
                >
                  <option value="daily">Daily (7:00 AM)</option>
                  <option value="weekly">Weekly (Mon, 7:00 AM)</option>
                  <option value="monthly">Monthly (Day 1, 7:00 AM)</option>
                </select>
              </div>

              {/* Recipients */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Recipients <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {formData.recipients.map((recipient, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="email"
                        value={recipient}
                        onChange={(e) =>
                          handleRecipientChange(index, e.target.value)
                        }
                        placeholder="email@example.com"
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                        required
                      />
                      {formData.recipients.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveRecipient(index)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-slate-700 rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddRecipient}
                    className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    + Add email
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                >
                  {editingReport ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduledReports;

