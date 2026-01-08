  import { useState, useEffect, useCallback } from 'react';
  import { moveTaskApi } from '../api/taskApi';

  interface DragData {
    taskId: string;
    sourceColumnId: string;
    sourceSwimlaneId: string;
  }

  export const useDragAndDrop = (onTaskMoved?: () => void) => {
    const [draggedTask, setDraggedTask] = useState<DragData | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    // Khi bắt đầu kéo
    const handleDragStart = useCallback((taskId: string, columnId: string, swimlaneId: string) => {
      setDraggedTask({ taskId, sourceColumnId: columnId, sourceSwimlaneId: swimlaneId });
    }, []);

    // Mouse move để task theo chuột
    const handleMouseMove = useCallback((e: MouseEvent) => {
      if (!draggedTask) return;
      setMousePos({ x: e.clientX, y: e.clientY });
    }, [draggedTask]);

    // Kết thúc kéo
    const handleDragEnd = useCallback(() => {
      setDraggedTask(null);
    }, []);

    // Thêm listener khi kéo
    useEffect(() => {
      if (draggedTask) {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleDragEnd);
      }
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleDragEnd);
      };
    }, [draggedTask, handleMouseMove, handleDragEnd]);

    // Drag over để allow drop
    const handleDragOver = useCallback((e: React.DragEvent) => {
      e.preventDefault();
    }, []);

    // Drop task
    const handleDrop = useCallback(
      async (
        targetColumnId: string,
        targetSwimlaneId: string,
        prevTaskId?: string | null,
        nextTaskId?: string | null
      ) => {
        if (!draggedTask) return;

        try {
          await moveTaskApi(draggedTask.taskId, {
            new_column_id: targetColumnId,
            new_swimlane_id: targetSwimlaneId === 'default' ? undefined : targetSwimlaneId,
            prev_task_id: prevTaskId ?? null,
            next_task_id: nextTaskId ?? null,
          });
          onTaskMoved?.();
        } catch (error) {
          console.error('❌ Failed to move task:', error);
        } finally {
          setDraggedTask(null);
        }
      },
      [draggedTask, onTaskMoved]
    );

    return {
      draggedTask,
      mousePos,
      handleDragStart,
      handleDragOver,
      handleDrop,
      handleDragEnd,
    };
  };
