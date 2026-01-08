import axiosInstance from "./axiosInstance";

export interface CollaborationNode {
  id: string;
  userId: string;
  username: string;
  fullName: string;
  email: string;
  collaborationScore: number;
  commentCount: number;
}

export interface CollaborationEdge {
  from: string;
  to: string;
  weight: number;
}

export interface CollaborationMetric {
  userId: string;
  commentCount: number;
  mentionsGiven: number;
  mentionsReceived: number;
  multiCollaboratorTasks: number;
  avgResponseTimeMinutes: number;
  collaborationScore: number;
}

export interface CollaborationSummary {
  totalUsers: number;
  totalComments: number;
  totalMentions: number;
  totalMultiCollaboratorTasks: number;
  averageCollaborationScore: number;
  averageResponseTimeMinutes: number;
}

export interface GroupAnalysis {
  goodCollaborators: {
    count: number;
    users: Array<{
      userId: string;
      collaborationScore: number;
      commentCount: number;
      mentionsGiven: number;
      mentionsReceived: number;
    }>;
  };
  poorCollaborators: {
    count: number;
    users: Array<{
      userId: string;
      collaborationScore: number;
      commentCount: number;
      mentionsGiven: number;
      mentionsReceived: number;
    }>;
  };
}

export interface CollaborationIndexData {
  nodes: CollaborationNode[];
  edges: CollaborationEdge[];
  graph: Record<string, Record<string, number>>;
  collaborationMetrics: CollaborationMetric[];
  summary: CollaborationSummary;
  groupAnalysis: GroupAnalysis;
}

/**
 * Get collaboration index for a board
 */
export const getCollaborationIndex = async (boardId: string): Promise<CollaborationIndexData> => {
  const res = await axiosInstance.get<{ success: boolean; data: CollaborationIndexData }>(
    `/comments/${boardId}/Collaboration`
  );
  return res.data.data;
};

