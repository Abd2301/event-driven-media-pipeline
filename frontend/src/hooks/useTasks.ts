import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService, Task, CreateTaskRequest, UpdateTaskRequest } from '../services/api';

// Query keys
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (filters: string) => [...taskKeys.lists(), { filters }] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
};

// Hook for fetching all tasks
export const useTasks = () => {
  return useQuery({
    queryKey: taskKeys.lists(),
    queryFn: () => apiService.listTasks(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
};

// Hook for fetching a single task
export const useTask = (taskId: string) => {
  return useQuery({
    queryKey: taskKeys.detail(taskId),
    queryFn: () => apiService.getTask(taskId),
    enabled: !!taskId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
};

// Hook for creating a task
export const useCreateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskData: CreateTaskRequest) => apiService.createTask(taskData),
    onSuccess: (newTask: Task) => {
      // Invalidate and refetch tasks list
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      
      // Add the new task to the cache
      queryClient.setQueryData(taskKeys.detail(newTask.id), newTask);
    },
    onError: (error: Error) => {
      console.error('Failed to create task:', error);
    },
  });
};

// Hook for updating a task
export const useUpdateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, taskData }: { taskId: string; taskData: UpdateTaskRequest }) =>
      apiService.updateTask(taskId, taskData),
    onSuccess: (updatedTask: Task) => {
      // Update the task in the cache
      queryClient.setQueryData(taskKeys.detail(updatedTask.id), updatedTask);
      
      // Invalidate and refetch tasks list
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
    onError: (error: Error) => {
      console.error('Failed to update task:', error);
    },
  });
};

// Hook for deleting a task
export const useDeleteTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => apiService.deleteTask(taskId),
    onSuccess: (_: void, taskId: string) => {
      // Remove the task from the cache
      queryClient.removeQueries({ queryKey: taskKeys.detail(taskId) });
      
      // Invalidate and refetch tasks list
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
    onError: (error: Error) => {
      console.error('Failed to delete task:', error);
    },
  });
};

// Hook for checking API health
export const useHealthCheck = () => {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => apiService.checkHealth(),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 60 * 1000, // 1 minute (formerly cacheTime)
    retry: 3,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}; 