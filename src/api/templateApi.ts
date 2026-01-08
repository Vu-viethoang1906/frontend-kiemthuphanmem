import axiosInstance from "./axiosInstance";

// Templates
export const fetchTemplates = async () => {
  const res = await axiosInstance.get("/templates");
  return Array.isArray(res.data) ? res.data : res.data?.data || [];
};

export const fetchTemplateById = async (id: string) => {
  const res = await axiosInstance.get(`/templates/${id}`);
  return res.data;
};

export const createTemplate = async (data: any) => {
  const res = await axiosInstance.post("/templates", data);
  return res.data;
};

export const updateTemplate = async (id: string, data: any) => {
  const res = await axiosInstance.put(`/templates/${id}`, data);
  return res.data;
};

export const deleteTemplate = async (id: string) => {
  const res = await axiosInstance.delete(`/templates/${id}`);
  return res.data;
};

// Template Columns
export const fetchTemplateColumns = async (templateId: string) => {
  const res = await axiosInstance.get(`/templateColumn/template/${templateId}`);
  return res.data?.data || [];
};

export const createTemplateColumn = async (data: any) => {
  const res = await axiosInstance.post("/templateColumn", data);
  return res.data;
};

export const updateTemplateColumn = async (id: string, data: any) => {
  const res = await axiosInstance.put(`/templateColumn/${id}`, data);
  return res.data;
};

export const deleteTemplateColumn = async (id: string) => {
  const res = await axiosInstance.delete(`/templateColumn/${id}`);
  return res.data;
};

// Template Swimlanes
export const fetchTemplateSwimlanes = async (templateId: string) => {
  const res = await axiosInstance.get(`/templateSwimlane/template/${templateId}`);
  return res.data?.data || [];
};

export const createTemplateSwimlane = async (data: any) => {
  const res = await axiosInstance.post("/templateSwimlane", data);
  return res.data;
};

export const updateTemplateSwimlane = async (id: string, data: any) => {
  const res = await axiosInstance.put(`/templateSwimlane/${id}`, data);
  return res.data;
};

export const deleteTemplateSwimlane = async (id: string) => {
  const res = await axiosInstance.delete(`/templateSwimlane/${id}`);
  return res.data;
};

// Reorder columns (batch update)
export const reorderTemplateColumns = async (templateId: string, columnIds: string[]) => {
  const res = await axiosInstance.put(`/templateColumn/reorder/${templateId}`, { columnIds });
  return res.data;
};

// Reorder swimlanes (batch update)
export const reorderTemplateSwimlanes = async (templateId: string, swimlaneIds: string[]) => {
  const res = await axiosInstance.put(`/templateSwimlane/reorder/${templateId}`, { swimlaneIds });
  return res.data;
};

