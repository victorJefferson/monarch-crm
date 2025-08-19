import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { workItemService, CreateWorkItemRequest, UpdateWorkItemRequest, CreateTaskRequest, UpdateTaskRequest, WorkStatus, WorkItem, Task } from '../services/workItemService';
import { queryKeys, getInvalidationPatterns } from '../constants/queryKeys';
import { handleQueryError } from '../lib/queryClient';

export const useWorkItems = (filters?: { customer_id?: number; assigned_to?: number; status_id?: number }) => {
  const queryClient = useQueryClient();

  const { data: workItems = [], isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.workItems.list(filters),
    queryFn: () => workItemService.getWorkItems(filters),
    staleTime: 2 * 60 * 1000,
  });

  const { data: statuses = [], isLoading: statusesLoading, error: statusesError } = useQuery<WorkStatus[]>({
    queryKey: ['work-statuses', 'list'],
    queryFn: () => workItemService.getWorkStatuses(),
    staleTime: 60 * 60 * 1000,
  });

  const { mutateAsync: addWorkItemMutation, isPending: isAdding } = useMutation({
    mutationFn: (payload: CreateWorkItemRequest) => workItemService.createWorkItem(payload),
    onSuccess: () => {
      getInvalidationPatterns.workItems.onCreate().forEach(key => queryClient.invalidateQueries({ queryKey: key }));
      toast.success('Work item created');
    },
    onError: (err: any) => toast.error(handleQueryError(err) || 'Failed to create work item'),
  });

  const { mutateAsync: updateWorkItemMutation, isPending: isUpdating } = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateWorkItemRequest }) => workItemService.updateWorkItem(id, payload),
    onSuccess: (_, { id }) => {
      getInvalidationPatterns.workItems.onUpdate(id).forEach(key => queryClient.invalidateQueries({ queryKey: key }));
      toast.success('Work item updated');
    },
    onError: (err: any) => toast.error(handleQueryError(err) || 'Failed to update work item'),
  });

  const { mutateAsync: deleteWorkItemMutation, isPending: isDeleting } = useMutation({
    mutationFn: (id: number) => workItemService.deleteWorkItem(id),
    onSuccess: (_, id) => {
      getInvalidationPatterns.workItems.onDelete(id).forEach(key => queryClient.invalidateQueries({ queryKey: key }));
      toast.success('Work item deleted');
    },
    onError: (err: any) => toast.error(handleQueryError(err) || 'Failed to delete work item'),
  });

  return {
    workItems,
    statuses,
    statusesLoading,
    statusesError: statusesError ? handleQueryError(statusesError) : null,
    loading: isLoading,
    error: error ? handleQueryError(error) : null,
    isAdding, isUpdating, isDeleting,
    addWorkItem: (payload: CreateWorkItemRequest) => addWorkItemMutation(payload),
    updateWorkItem: (id: number, payload: UpdateWorkItemRequest) => updateWorkItemMutation({ id, payload }),
    deleteWorkItem: (id: number) => deleteWorkItemMutation(id),
    refetch,
  };
};

export const useTasks = (filters?: { customer_id?: number; work_item_id?: number; assigned_to?: number; status_id?: number }) => {
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.tasks.list(filters),
    queryFn: () => workItemService.getTasks(filters),
    staleTime: 2 * 60 * 1000,
  });

  const { mutateAsync: addTaskMutation, isPending: isAdding } = useMutation({
    mutationFn: (payload: CreateTaskRequest) => workItemService.createTask(payload),
    onSuccess: (task) => {
      getInvalidationPatterns.tasks.onCreate(task.work_item_id).forEach(key => queryClient.invalidateQueries({ queryKey: key as any }));
      toast.success('Task created');
    },
    onError: (err: any) => toast.error(handleQueryError(err) || 'Failed to create task'),
  });

  const { mutateAsync: updateTaskMutation, isPending: isUpdating } = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateTaskRequest }) => workItemService.updateTask(id, payload),
    onSuccess: (task, { id }) => {
      getInvalidationPatterns.tasks.onUpdate(id, task.work_item_id).forEach(key => queryClient.invalidateQueries({ queryKey: key as any }));
      toast.success('Task updated');
    },
    onError: (err: any) => toast.error(handleQueryError(err) || 'Failed to update task'),
  });

  const { mutateAsync: deleteTaskMutation, isPending: isDeleting } = useMutation({
    mutationFn: (id: number) => workItemService.deleteTask(id),
    onSuccess: (_, id) => {
      getInvalidationPatterns.tasks.onDelete(id).forEach(key => queryClient.invalidateQueries({ queryKey: key as any }));
      toast.success('Task deleted');
    },
    onError: (err: any) => toast.error(handleQueryError(err) || 'Failed to delete task'),
  });

  return {
    tasks,
    loading: isLoading,
    error: error ? handleQueryError(error) : null,
    isAdding, isUpdating, isDeleting,
    addTask: (payload: CreateTaskRequest) => addTaskMutation(payload),
    updateTask: (id: number, payload: UpdateTaskRequest) => updateTaskMutation({ id, payload }),
    deleteTask: (id: number) => deleteTaskMutation(id),
    refetch,
  };
};

// New multi-filter hooks for POST-based filtering used in UI filters
export const useWorkItemsFilter = (payload: { customer_ids?: number[]; assigned_to_ids?: number[]; status_ids?: number[] }) => {
  const { data: workItems = [], isLoading, error, refetch } = useQuery<WorkItem[]>({
    queryKey: ['workItems', 'filter', payload],
    queryFn: () => workItemService.filterWorkItems(payload),
    staleTime: 60 * 1000,
  });
  return { workItems, loading: isLoading, error: error ? handleQueryError(error) : null, refetch };
};

export const useTasksFilter = (payload: { customer_ids?: number[]; work_item_ids?: number[]; assigned_to_ids?: number[]; status_ids?: number[] }) => {
  const { data: tasks = [], isLoading, error, refetch } = useQuery<Task[]>({
    queryKey: ['tasks', 'filter', payload],
    queryFn: () => workItemService.filterTasks(payload),
    staleTime: 60 * 1000,
  });
  return { tasks, loading: isLoading, error: error ? handleQueryError(error) : null, refetch };
};
