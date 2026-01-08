import {
  getAllLearningResources,
  getLearningResourceById,
  getRecommendationsForTask,
  getAIRecommendations,
  createLearningResource,
  updateLearningResource,
  deleteLearningResource,
} from '../../../api/learningResourceApi';
import axiosInstance from '../../../api/axiosInstance';

jest.mock('../../../api/axiosInstance');

const mockAxios = axiosInstance as jest.Mocked<typeof axiosInstance>;

const sampleResource = {
  _id: 'lr1',
  title: 'Intro to React',
  url: 'https://example.com/react',
  resource_type: 'tutorial' as const,
};

const sampleRecommendations = {
  tutorials: [sampleResource],
  videos: [{ ...sampleResource, _id: 'lr2', resource_type: 'video' as const }],
  codeExamples: [{ ...sampleResource, _id: 'lr3', resource_type: 'code_example' as const }],
};

describe('learningResourceApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('gets all learning resources with params and unwraps data', async () => {
    mockAxios.get.mockResolvedValue({ data: { status: 'success', data: [sampleResource] } });

    const result = await getAllLearningResources({ resource_type: 'tutorial', limit: 5 });

    expect(mockAxios.get).toHaveBeenCalledWith('/learning-resources', {
      params: { resource_type: 'tutorial', limit: 5 },
    });
    expect(result).toEqual([sampleResource]);
  });

  it('gets a learning resource by id', async () => {
    mockAxios.get.mockResolvedValue({ data: { status: 'success', data: sampleResource } });

    const result = await getLearningResourceById('lr1');

    expect(mockAxios.get).toHaveBeenCalledWith('/learning-resources/lr1');
    expect(result).toEqual(sampleResource);
  });

  it('gets recommendations for a task and unwraps nested recommendations', async () => {
    mockAxios.post.mockResolvedValue({
      data: {
        status: 'success',
        data: {
          task_id: 't1',
          task_title: 'Task 1',
          recommendations: sampleRecommendations,
        },
      },
    });

    const result = await getRecommendationsForTask('t1');

    expect(mockAxios.post).toHaveBeenCalledWith('/learning-resources/recommend-for-task', {
      task_id: 't1',
    });
    expect(result).toEqual(sampleRecommendations);
  });

  it('gets AI recommendations with default database flag', async () => {
    const apiResponse = {
      success: true,
      taskTitle: 'Task 1',
      source: 'database' as const,
      tutorials: [{ title: 'Tut', url: 'url' }],
      videos: [{ title: 'Vid', url: 'vid-url' }],
      codeExamples: [{ title: 'Code', language: 'ts', snippet: '// code' }],
    };
    mockAxios.post.mockResolvedValue({ data: { status: 'success', data: apiResponse } });

    const result = await getAIRecommendations('task-99');

    expect(mockAxios.post).toHaveBeenCalledWith('/nlp/recommend', {
      idTask: 'task-99',
      useDatabase: true,
    });
    expect(result).toEqual(apiResponse);
  });

  it('gets AI recommendations with useDatabase disabled', async () => {
    mockAxios.post.mockResolvedValue({ data: { status: 'success', data: { success: true, taskTitle: 'T', source: 'ai' } } });

    await getAIRecommendations('task-100', false);

    expect(mockAxios.post).toHaveBeenCalledWith('/nlp/recommend', {
      idTask: 'task-100',
      useDatabase: false,
    });
  });

  it('creates a learning resource', async () => {
    mockAxios.post.mockResolvedValue({ data: { status: 'success', data: sampleResource } });

    const result = await createLearningResource({ title: 'New', resource_type: 'article', url: 'u' });

    expect(mockAxios.post).toHaveBeenCalledWith('/learning-resources', {
      title: 'New',
      resource_type: 'article',
      url: 'u',
    });
    expect(result).toEqual(sampleResource);
  });

  it('updates a learning resource', async () => {
    const updated = { ...sampleResource, title: 'Updated' };
    mockAxios.put.mockResolvedValue({ data: { status: 'success', data: updated } });

    const result = await updateLearningResource('lr1', { title: 'Updated' });

    expect(mockAxios.put).toHaveBeenCalledWith('/learning-resources/lr1', { title: 'Updated' });
    expect(result).toEqual(updated);
  });

  it('deletes a learning resource', async () => {
    mockAxios.delete.mockResolvedValue({});

    await deleteLearningResource('lr1');

    expect(mockAxios.delete).toHaveBeenCalledWith('/learning-resources/lr1');
  });
});
