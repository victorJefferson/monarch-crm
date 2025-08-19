import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { communicationService, Communication, CreateCommunicationRequest, UpdateCommunicationRequest } from '../services/communicationService';
import { handleQueryError } from '../lib/queryClient';
import toast from 'react-hot-toast';

export const useCommunications = (params?: { lead_id?: number; created_by?: number }) => {
  const queryClient = useQueryClient();

  const { data: communications = [], isLoading, error, refetch } = useQuery<Communication[]>({
    queryKey: ['communications', 'list', params?.lead_id ?? null, params?.created_by ?? null],
    queryFn: () => communicationService.list(params),
    enabled: typeof params?.lead_id === 'number' || typeof params?.created_by === 'number',
    staleTime: 60 * 1000,
  });

  const { mutateAsync: createMutation, isPending: isCreating } = useMutation({
    mutationFn: (payload: CreateCommunicationRequest) => communicationService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communications', 'list', params?.lead_id ?? null, params?.created_by ?? null] });
      toast.success('Message added');
    },
    onError: (err: any) => toast.error(handleQueryError(err) || 'Failed to add message'),
  });

  const { mutateAsync: updateMutation, isPending: isUpdating } = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateCommunicationRequest }) => communicationService.update(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['communications', 'list', params?.lead_id ?? null, params?.created_by ?? null] });
      queryClient.invalidateQueries({ queryKey: ['communications', 'detail', id] });
      toast.success('Message updated');
    },
    onError: (err: any) => toast.error(handleQueryError(err) || 'Failed to update message'),
  });

  const { mutateAsync: deleteMutation, isPending: isDeleting } = useMutation({
    mutationFn: (id: number) => communicationService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communications', 'list', params?.lead_id ?? null, params?.created_by ?? null] });
      toast.success('Message deleted');
    },
    onError: (err: any) => toast.error(handleQueryError(err) || 'Failed to delete message'),
  });

  return {
    communications,
    loading: isLoading,
    error: error ? handleQueryError(error) : null,
    isCreating, isUpdating, isDeleting,
    addMessage: (payload: CreateCommunicationRequest) => createMutation(payload),
    updateMessage: (id: number, payload: UpdateCommunicationRequest) => updateMutation({ id, payload }),
    deleteMessage: (id: number) => deleteMutation(id),
    refetch,
  };
};

export const useCommunicationsFilter = (payload: { lead_ids?: number[]; created_by_ids?: number[] }) => {
  const { data: communications = [], isLoading, error, refetch } = useQuery<Communication[]>({
    queryKey: ['communications', 'filter', payload],
    queryFn: () => communicationService.filter(payload),
    enabled: Boolean((payload.lead_ids && payload.lead_ids.length) || (payload.created_by_ids && payload.created_by_ids.length)),
    staleTime: 60 * 1000,
  });
  return { communications, loading: isLoading, error: error ? handleQueryError(error) : null, refetch };
};