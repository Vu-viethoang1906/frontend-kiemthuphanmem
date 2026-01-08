import React, { useState, useEffect } from "react";
import {
  exportReport,
  downloadExportFile,
  ExportReportParams,
  listExportFiles,
  deleteExportFile,
  ExportedFileItem,
} from "../../api/exportApi";
import { fetchMyBoards } from "../../api/boardApi";
import { getAllCenters } from "../../api/centerApi";
import toast from "react-hot-toast";
import {
  Loader2,
  Download,
  FileSpreadsheet,
  FileText,
  BarChart3,
  TrendingUp,
  Trophy,
  Building2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";

interface Board {
  _id?: string;
  id?: string;
  title?: string;
  name?: string;
}

interface Center {
  _id?: string;
  id?: string;
  name?: string;
}

const ExportReports: React.FC = () => {
  const [boards, setBoards] = useState<Board[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportedFiles, setExportedFiles] = useState<ExportedFileItem[]>([]);

  // Form state
  const [reportType, setReportType] = useState<ExportReportParams['report_type']>('dashboard');
  const [format, setFormat] = useState<ExportReportParams['format']>('excel');
  const [selectedBoardId, setSelectedBoardId] = useState<string>("");
  const [selectedCenterId, setSelectedCenterId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [granularity, setGranularity] = useState<'day' | 'week' | 'month'>('day');
  const [wipLimit, setWipLimit] = useState<number>(5);
  const [limit, setLimit] = useState<number>(100);

  // Helper function to check if file is expired
  const isFileExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  // Load exported files from server on mount
  useEffect(() => {
    const loadFiles = async () => {
      try {
        const res = await listExportFiles();
        if (res?.success && Array.isArray(res.data)) {
          setExportedFiles(res.data);
        }
      } catch (error) {
        console.error("Error loading exported files:", error);
      }
    };
    loadFiles();
  }, []);

  // Load boards and centers
  useEffect(() => {
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
        if (validBoards.length > 0) {
          setSelectedBoardId(validBoards[0]._id || validBoards[0].id || "");
        }

        // Load centers
        try {
          const centersRes = await getAllCenters();
          let centers: any[] = [];
          if (centersRes?.success && centersRes?.data) {
            centers = Array.isArray(centersRes.data)
              ? centersRes.data
              : [centersRes.data];
          } else if (Array.isArray(centersRes)) {
            centers = centersRes;
          }
          const validCenters = centers.filter((c) => c && (c._id || c.id));
          setCenters(validCenters);
        } catch (error) {
          console.error("Error loading centers:", error);
        }

        // Set default dates
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        setEndDate(today.toISOString().split('T')[0]);
        setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
      } catch (error: any) {
        console.error("Error loading data:", error);
        toast.error("Unable to load data");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleExport = async () => {
    // Validation
    if (['dashboard', 'velocity', 'center_comparison'].includes(reportType) && !selectedBoardId) {
      toast.error("Please select a board for this report type");
      return;
    }

    if (reportType === 'leaderboard' && startDate && endDate && new Date(startDate) > new Date(endDate)) {
      toast.error("Start date must be before end date");
      return;
    }

    setExporting(true);

    try {
      const params: ExportReportParams = {
        report_type: reportType,
        format,
      };

      if (['dashboard', 'velocity', 'center_comparison'].includes(reportType)) {
        params.board_id = selectedBoardId;
      }

      if (reportType === 'leaderboard') {
        if (selectedCenterId) params.center_id = selectedCenterId;
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;
        if (limit) params.limit = limit;
      }

      if (reportType === 'dashboard') {
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;
        if (granularity) params.granularity = granularity;
      }

      if (reportType === 'velocity') {
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;
        if (wipLimit) params.wipLimit = wipLimit;
      }

      const response = await exportReport(params);

      if (response.success && response.data) {
        // Sau khi export xong, tải lại danh sách từ server để đồng bộ trạng thái
        try {
          const listRes = await listExportFiles();
          if (listRes?.success && Array.isArray(listRes.data)) {
            setExportedFiles(listRes.data);
          }
        } catch (err) {
          // Nếu lỗi, vẫn thêm tạm thời file vừa export
          setExportedFiles((prev) => [
            {
              filename: response.data.filename,
              format: response.data.format,
              reportType: response.data.reportType,
              expiresAt: response.data.expiresAt,
            },
            ...prev,
          ]);
        }
        toast.success("Report exported successfully!");
      } else {
        toast.error(response.message || "Unable to export report");
      }
    } catch (error: any) {
      console.error("Error exporting report:", error);
      toast.error(error.response?.data?.message || "Unable to export report");
    } finally {
      setExporting(false);
    }
  };

  const handleDownload = async (filename: string) => {
    try {
      const blob = await downloadExportFile(filename);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("File downloaded successfully!");
    } catch (error: any) {
      console.error("Error downloading file:", error);
      toast.error(error.response?.data?.message || "Unable to download file");
    }
  };

  const handleDelete = (filename: string) => {
    setExportedFiles((prev) => {
      const updated = prev.filter((file) => file.filename !== filename);
      // Update localStorage
      try {
        localStorage.setItem('exportedFiles', JSON.stringify(updated));
      } catch (error) {
        console.error("Error saving to localStorage:", error);
      }
      return updated;
    });
    toast.success("File removed from the list");
  };

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case 'dashboard':
        return <BarChart3 className="w-5 h-5" />;
      case 'velocity':
        return <TrendingUp className="w-5 h-5" />;
      case 'leaderboard':
        return <Trophy className="w-5 h-5" />;
      case 'center_comparison':
        return <Building2 className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getReportTypeName = (type: string) => {
    switch (type) {
      case 'dashboard':
        return 'Dashboard';
      case 'velocity':
        return 'Velocity';
      case 'leaderboard':
        return 'Leaderboard';
      case 'center_comparison':
        return 'Center Comparison';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="py-6 px-4 bg-gray-100 dark:bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Export Reports
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Export statistical reports to Excel or PDF
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-[2px]">
        {/* Form Section */}
        <div className="lg:col-span-2 space-y-[2px]">
          {/* Report Type Selection */}
          <div className="bg-white dark:bg-slate-800 p-6 border border-gray-200 dark:border-slate-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Report Type
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {(['dashboard', 'velocity', 'leaderboard', 'center_comparison'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setReportType(type)}
                  className={`p-4 border transition-all ${
                    reportType === type
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                      : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {getReportTypeIcon(type)}
                    <span className="font-semibold">{getReportTypeName(type)}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Format Selection */}
          <div className="bg-white dark:bg-slate-800 p-6 border border-gray-200 dark:border-slate-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Download className="w-5 h-5" />
              Format
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setFormat('excel')}
                className={`p-4 border transition-all flex items-center gap-3 ${
                  format === 'excel'
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                    : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 text-gray-700 dark:text-gray-300'
                }`}
              >
                <FileSpreadsheet className="w-6 h-6" />
                <span className="font-semibold">Excel (.xlsx)</span>
              </button>
              <button
                onClick={() => setFormat('pdf')}
                className={`p-4 border transition-all flex items-center gap-3 ${
                  format === 'pdf'
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                    : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 text-gray-700 dark:text-gray-300'
                }`}
              >
                <FileText className="w-6 h-6" />
                <span className="font-semibold">PDF (.pdf)</span>
              </button>
            </div>
          </div>

          {/* Parameters */}
          <div className="bg-white dark:bg-slate-800 p-6 border border-gray-200 dark:border-slate-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Parameters
            </h2>
            <div className="space-y-4">
              {/* Board Selection */}
              {['dashboard', 'velocity', 'center_comparison'].includes(reportType) && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Select Board <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedBoardId}
                    onChange={(e) => setSelectedBoardId(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  >
                    <option value="">-- Select Board --</option>
                    {boards.map((board) => (
                      <option key={board._id || board.id} value={board._id || board.id}>
                        {board.title || board.name || "Untitled Board"}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Center Selection for Leaderboard */}
              {reportType === 'leaderboard' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Select Center (Optional)
                  </label>
                  <select
                    value={selectedCenterId}
                    onChange={(e) => setSelectedCenterId(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  >
                    <option value="">-- All Centers --</option>
                    {centers.map((center) => (
                      <option key={center._id || center.id} value={center._id || center.id}>
                        {center.name || "Untitled Center"}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Date Range */}
              {(reportType === 'dashboard' || reportType === 'velocity' || reportType === 'leaderboard') && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" />
                        Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-4 py-2 border-2 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      End Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-4 py-2 border-2 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Granularity for Dashboard */}
              {reportType === 'dashboard' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Granularity
                  </label>
                  <select
                    value={granularity}
                    onChange={(e) => setGranularity(e.target.value as 'day' | 'week' | 'month')}
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  >
                    <option value="day">Day</option>
                    <option value="week">Week</option>
                    <option value="month">Month</option>
                  </select>
                </div>
              )}

              {/* WIP Limit for Velocity */}
              {reportType === 'velocity' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    WIP Limit
                  </label>
                  <input
                    type="number"
                    value={wipLimit}
                    onChange={(e) => setWipLimit(parseInt(e.target.value) || 5)}
                    min={1}
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  />
                </div>
              )}

              {/* Limit for Leaderboard */}
              {reportType === 'leaderboard' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Number of users (Limit)
                  </label>
                  <input
                    type="number"
                    value={limit}
                    onChange={(e) => setLimit(parseInt(e.target.value) || 100)}
                    min={1}
                    max={1000}
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={exporting || (['dashboard', 'velocity', 'center_comparison'].includes(reportType) && !selectedBoardId)}
            className="w-full px-6 py-3 bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all font-semibold text-lg border border-gray-200 dark:border-slate-700"
          >
                {exporting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Exporting report...
              </>
            ) : (
              <>
                <Download className="h-5 w-5" />
                Export Report
              </>
            )}
          </button>
        </div>

        {/* Exported Files List - Right Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-800 p-6 border border-gray-200 dark:border-slate-700 sticky top-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Exported Files
            </h2>
            
            {exportedFiles.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No exported files yet</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
                {exportedFiles.map((file, index) => {
                  const isExpired = isFileExpired(file.expiresAt);
                  return (
                    <div
                      key={`${file.filename}-${index}`}
                      className={`p-4 border ${
                        isExpired
                          ? 'border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 opacity-60'
                          : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {file.format === 'excel' ? (
                              <FileSpreadsheet className="w-4 h-4 text-green-600 flex-shrink-0" />
                            ) : (
                              <FileText className="w-4 h-4 text-red-600 flex-shrink-0" />
                            )}
                            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                              {file.format}
                            </span>
                            {isExpired && (
                              <span className="text-xs bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-2 py-0.5 rounded">
                                Expired
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate" title={file.filename}>
                            {getReportTypeName(file.reportType)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={file.filename}>
                            {file.filename}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            Expires: {new Date(file.expiresAt).toLocaleString('en-US')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          onClick={() => handleDownload(file.filename)}
                          disabled={isExpired}
                          className={`flex-1 px-3 py-2 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                            isExpired
                              ? 'bg-gray-200 dark:bg-slate-600 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                              : 'bg-green-600 hover:bg-green-700 text-white'
                          }`}
                          title={isExpired ? 'File expired' : 'Download file'}
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                        <button
                          onClick={() => handleDelete(file.filename)}
                          className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white transition-all flex items-center justify-center"
                          title="Remove from list"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {exportedFiles.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <AlertCircle className="w-3 h-3" />
                  Files will be automatically deleted after 24 hours
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportReports;

