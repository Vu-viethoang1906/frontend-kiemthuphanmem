import {
  fetchTemplates,
  fetchTemplateById,
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
  reorderTemplateColumns,
  reorderTemplateSwimlanes,
} from '../../../api/templateApi';
import axiosInstance from '../../../api/axiosInstance';

jest.mock('../../../api/axiosInstance');

const mockAxios = axiosInstance as jest.Mocked<typeof axiosInstance>;

describe('templateApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchTemplates', () => {
    it('should fetch all templates as array', async () => {
      const mockTemplates = [
        { _id: 'tpl-1', name: 'Template 1' },
        { _id: 'tpl-2', name: 'Template 2' },
      ];
      mockAxios.get.mockResolvedValue({ data: mockTemplates });

      const result = await fetchTemplates();

      expect(mockAxios.get).toHaveBeenCalledWith('/templates');
      expect(result).toEqual(mockTemplates);
    });

    it('should extract data from nested response', async () => {
      const mockTemplates = [{ _id: 'tpl-1', name: 'Template' }];
      mockAxios.get.mockResolvedValue({ data: { data: mockTemplates } });

      const result = await fetchTemplates();

      expect(result).toEqual(mockTemplates);
    });

    it('should return empty array when no templates', async () => {
      mockAxios.get.mockResolvedValue({ data: null });

      const result = await fetchTemplates();

      expect(result).toEqual([]);
    });
  });

  describe('fetchTemplateById', () => {
    it('should fetch template by ID', async () => {
      const mockTemplate = { _id: 'tpl-123', name: 'Test Template' };
      mockAxios.get.mockResolvedValue({ data: mockTemplate });

      const result = await fetchTemplateById('tpl-123');

      expect(mockAxios.get).toHaveBeenCalledWith('/templates/tpl-123');
      expect(result).toEqual(mockTemplate);
    });
  });

  describe('createTemplate', () => {
    it('should create new template', async () => {
      const templateData = { name: 'New Template', description: 'Test' };
      mockAxios.post.mockResolvedValue({ data: { _id: 'new-tpl', ...templateData } });

      const result = await createTemplate(templateData);

      expect(mockAxios.post).toHaveBeenCalledWith('/templates', templateData);
      expect(result._id).toBe('new-tpl');
    });
  });

  describe('updateTemplate', () => {
    it('should update template', async () => {
      const updateData = { name: 'Updated Template' };
      mockAxios.put.mockResolvedValue({ data: { success: true } });

      await updateTemplate('tpl-456', updateData);

      expect(mockAxios.put).toHaveBeenCalledWith('/templates/tpl-456', updateData);
    });
  });

  describe('deleteTemplate', () => {
    it('should delete template', async () => {
      mockAxios.delete.mockResolvedValue({ data: { success: true } });

      await deleteTemplate('tpl-789');

      expect(mockAxios.delete).toHaveBeenCalledWith('/templates/tpl-789');
    });
  });

  describe('fetchTemplateColumns', () => {
    it('should fetch template columns', async () => {
      const mockColumns = [
        { _id: 'col-1', name: 'To Do' },
        { _id: 'col-2', name: 'Done' },
      ];
      mockAxios.get.mockResolvedValue({ data: { data: mockColumns } });

      const result = await fetchTemplateColumns('tpl-123');

      expect(mockAxios.get).toHaveBeenCalledWith('/templateColumn/template/tpl-123');
      expect(result).toEqual(mockColumns);
    });

    it('should return empty array when no columns', async () => {
      mockAxios.get.mockResolvedValue({ data: {} });

      const result = await fetchTemplateColumns('tpl-456');

      expect(result).toEqual([]);
    });
  });

  describe('createTemplateColumn', () => {
    it('should create template column', async () => {
      const columnData = { name: 'In Progress', template_id: 'tpl-123' };
      mockAxios.post.mockResolvedValue({ data: { _id: 'col-new', ...columnData } });

      await createTemplateColumn(columnData);

      expect(mockAxios.post).toHaveBeenCalledWith('/templateColumn', columnData);
    });
  });

  describe('updateTemplateColumn', () => {
    it('should update template column', async () => {
      const updateData = { name: 'Updated Column' };
      mockAxios.put.mockResolvedValue({ data: { success: true } });

      await updateTemplateColumn('col-789', updateData);

      expect(mockAxios.put).toHaveBeenCalledWith('/templateColumn/col-789', updateData);
    });
  });

  describe('deleteTemplateColumn', () => {
    it('should delete template column', async () => {
      mockAxios.delete.mockResolvedValue({ data: { success: true } });

      await deleteTemplateColumn('col-delete');

      expect(mockAxios.delete).toHaveBeenCalledWith('/templateColumn/col-delete');
    });
  });

  describe('fetchTemplateSwimlanes', () => {
    it('should fetch template swimlanes', async () => {
      const mockSwimlanes = [{ _id: 'swim-1', name: 'Lane 1' }];
      mockAxios.get.mockResolvedValue({ data: { data: mockSwimlanes } });

      const result = await fetchTemplateSwimlanes('tpl-123');

      expect(mockAxios.get).toHaveBeenCalledWith('/templateSwimlane/template/tpl-123');
      expect(result).toEqual(mockSwimlanes);
    });
  });

  describe('createTemplateSwimlane', () => {
    it('should create template swimlane', async () => {
      const swimlaneData = { name: 'New Lane', template_id: 'tpl-456' };
      mockAxios.post.mockResolvedValue({ data: { _id: 'swim-new', ...swimlaneData } });

      await createTemplateSwimlane(swimlaneData);

      expect(mockAxios.post).toHaveBeenCalledWith('/templateSwimlane', swimlaneData);
    });
  });

  describe('updateTemplateSwimlane', () => {
    it('should update template swimlane', async () => {
      const updateData = { name: 'Updated Lane' };
      mockAxios.put.mockResolvedValue({ data: { success: true } });

      await updateTemplateSwimlane('swim-789', updateData);

      expect(mockAxios.put).toHaveBeenCalledWith('/templateSwimlane/swim-789', updateData);
    });
  });

  describe('deleteTemplateSwimlane', () => {
    it('should delete template swimlane', async () => {
      mockAxios.delete.mockResolvedValue({ data: { success: true } });

      await deleteTemplateSwimlane('swim-delete');

      expect(mockAxios.delete).toHaveBeenCalledWith('/templateSwimlane/swim-delete');
    });
  });

  describe('reorderTemplateColumns', () => {
    it('should reorder template columns', async () => {
      const columnIds = ['col-3', 'col-1', 'col-2'];
      mockAxios.put.mockResolvedValue({ data: { success: true } });

      await reorderTemplateColumns('tpl-123', columnIds);

      expect(mockAxios.put).toHaveBeenCalledWith('/templateColumn/reorder/tpl-123', {
        columnIds,
      });
    });
  });

  describe('reorderTemplateSwimlanes', () => {
    it('should reorder template swimlanes', async () => {
      const swimlaneIds = ['swim-2', 'swim-1', 'swim-3'];
      mockAxios.put.mockResolvedValue({ data: { success: true } });

      await reorderTemplateSwimlanes('tpl-456', swimlaneIds);

      expect(mockAxios.put).toHaveBeenCalledWith('/templateSwimlane/reorder/tpl-456', {
        swimlaneIds,
      });
    });
  });
});
