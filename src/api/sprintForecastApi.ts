import axiosInstance from './axiosInstance';

export interface SprintForecastResponse {
  success: boolean;
  data: {
    board_id: string;
    next_sprint: {
      start_date: string;
      end_date: string;
      duration_days: number;
    };
    historical_velocity: {
      average: number;
      from_sprints: number;
      period: {
        start: string;
        end: string;
      };
    };
    confidence_interval: {
      min: number;
      max: number;
      percentage: string;
    };
    risk_factors: {
      users_on_leave: number;
      on_leave_percentage: number;
      on_leave_risk_factor: number;
      holidays_count: number;
      holidays_percentage: number;
      holidays_risk_factor: number;
      current_wip: number;
      wip_risk_factor: number;
      total_risk_adjustment: number;
    };
    recommendation: {
      recommended_task_count: number;
      confidence_level: 'high' | 'medium' | 'low';
      notes: string[];
    };
  };
}

export const getSprintForecast = async (
  boardId: string,
  nextSprintStart?: string,
  nextSprintEnd?: string,
  sprintDurationDays?: number
): Promise<SprintForecastResponse> => {
  const params: any = {};
  if (nextSprintStart) params.next_sprint_start = nextSprintStart;
  if (nextSprintEnd) params.next_sprint_end = nextSprintEnd;
  if (sprintDurationDays) params.sprint_duration_days = sprintDurationDays;

  const response = await axiosInstance.get(
    `/sprint-forecast/board/${boardId}/forecast`,
    { params }
  );
  return response.data;
};

