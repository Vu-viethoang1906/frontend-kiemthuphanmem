import axiosInstance from "./axiosInstance";

// Lấy danh sách subtask của task
export const getSubtasksByTask = async (taskId: string) => {
    const res = await axiosInstance.get(`/subtasks/task/${taskId}`);
    return res.data;
};

// Tạo subtask mới
export const createSubtask = async (taskId: string, data: {
    title: string;
    description?: string;
    assigned_to?: string;
    priority?: 'High' | 'Medium' | 'Low';
    due_date?: string;
}) => {
    const res = await axiosInstance.post(`/subtasks/task/${taskId}`, data);
    return res.data;
};

// Cập nhật subtask
export const updateSubtask = async (subtaskId: string, data: {
    title?: string;
    description?: string;
    assigned_to?: string;
    priority?: 'High' | 'Medium' | 'Low';
    due_date?: string;
    is_completed?: boolean;
}) => {
    const res = await axiosInstance.put(`/subtasks/${subtaskId}`, data);
    return res.data;
};

// Toggle completion status
export const toggleSubtask = async (subtaskId: string) => {
    const res = await axiosInstance.patch(`/subtasks/${subtaskId}/toggle`);
    return res.data;
};

// Xóa subtask
export const deleteSubtask = async (subtaskId: string) => {
    const res = await axiosInstance.delete(`/subtasks/${subtaskId}`);
    return res.data;
};

// Sắp xếp lại subtasks
export const reorderSubtasks = async (taskId: string, items: { id: string; position: number }[]) => {
    const res = await axiosInstance.patch(`/subtasks/task/${taskId}/reorder`, { items });
    return res.data;
};
