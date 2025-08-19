import { API_BASE_URL, AUTH_TOKEN_KEY } from '../config/env';

export interface WorkStatus {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
}

export interface WorkItem {
  id: number;
  title: string;
  description?: string;
  customer_id: number;
  assigned_to?: number;
  status_id?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  customer?: any;
  assigned_user?: { id: number; name: string; email: string };
  status?: WorkStatus;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  work_item_id: number;
  customer_id: number;
  assigned_to?: number;
  status_id?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  work_item?: any;
  customer?: any;
  assigned_user?: { id: number; name: string; email: string };
  status?: WorkStatus;
}

export interface CreateWorkItemRequest {
  title: string;
  description?: string;
  customer_id: number;
  assigned_to?: number;
  status_id: number;
}

export interface UpdateWorkItemRequest {
  title?: string;
  description?: string;
  customer_id?: number;
  assigned_to?: number;
  status_id?: number;
  is_active?: boolean;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  work_item_id: number;
  customer_id: number;
  assigned_to?: number;
  status_id: number;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  work_item_id?: number;
  customer_id?: number;
  assigned_to?: number;
  status_id?: number;
  is_active?: boolean;
}

const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

const handleResponse = async <T>(response: Response): Promise<T> => {
  const text = await response.text();
  const tryParse = () => { try { return JSON.parse(text); } catch { return null; } };
  if (!response.ok) {
    const data = tryParse();
    const msg = data?.error || data?.message || `HTTP ${response.status}`;
    throw new Error(msg);
  }
  const data = tryParse();
  if (!data?.success) {
    const msg = data?.error || data?.message || 'Request failed';
    throw new Error(msg);
  }
  return data.data;
};

class WorkItemService {
  async getWorkItems(params?: { customer_id?: number; assigned_to?: number; status_id?: number }): Promise<WorkItem[]> {
    const q = new URLSearchParams();
    if (params?.customer_id) q.set('customer_id', String(params.customer_id));
    if (params?.assigned_to) q.set('assigned_to', String(params.assigned_to));
    if (params?.status_id) q.set('status_id', String(params.status_id));
    const res = await fetch(`${API_BASE_URL}/work-items?${q.toString()}`, { headers: getAuthHeaders() });
    return handleResponse<WorkItem[]>(res);
  }
  async filterWorkItems(payload: { customer_ids?: number[]; assigned_to_ids?: number[]; status_ids?: number[] }): Promise<WorkItem[]> {
    const res = await fetch(`${API_BASE_URL}/work-items/filter`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(payload) });
    return handleResponse<WorkItem[]>(res);
  }
  async getWorkItem(id: number): Promise<WorkItem> {
    const res = await fetch(`${API_BASE_URL}/work-items/${id}`, { headers: getAuthHeaders() });
    return handleResponse<WorkItem>(res);
  }
  async createWorkItem(payload: CreateWorkItemRequest): Promise<WorkItem> {
    const res = await fetch(`${API_BASE_URL}/work-items`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(payload) });
    return handleResponse<WorkItem>(res);
  }
  async updateWorkItem(id: number, payload: UpdateWorkItemRequest): Promise<WorkItem> {
    const res = await fetch(`${API_BASE_URL}/work-items/${id}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(payload) });
    return handleResponse<WorkItem>(res);
  }
  async deleteWorkItem(id: number): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/work-items/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
    await handleResponse<void>(res);
  }

  async getTasks(params?: { customer_id?: number; work_item_id?: number; assigned_to?: number; status_id?: number }): Promise<Task[]> {
    const q = new URLSearchParams();
    if (params?.customer_id) q.set('customer_id', String(params.customer_id));
    if (params?.work_item_id) q.set('work_item_id', String(params.work_item_id));
    if (params?.assigned_to) q.set('assigned_to', String(params.assigned_to));
    if (params?.status_id) q.set('status_id', String(params.status_id));
    const res = await fetch(`${API_BASE_URL}/tasks?${q.toString()}`, { headers: getAuthHeaders() });
    return handleResponse<Task[]>(res);
    }
  async filterTasks(payload: { customer_ids?: number[]; work_item_ids?: number[]; assigned_to_ids?: number[]; status_ids?: number[] }): Promise<Task[]> {
    const res = await fetch(`${API_BASE_URL}/tasks/filter`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(payload) });
    return handleResponse<Task[]>(res);
  }
  async createTask(payload: CreateTaskRequest): Promise<Task> {
    const res = await fetch(`${API_BASE_URL}/tasks`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(payload) });
    return handleResponse<Task>(res);
  }
  async updateTask(id: number, payload: UpdateTaskRequest): Promise<Task> {
    const res = await fetch(`${API_BASE_URL}/tasks/${id}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(payload) });
    return handleResponse<Task>(res);
  }
  async deleteTask(id: number): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/tasks/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
    await handleResponse<void>(res);
  }

  async getWorkStatuses(): Promise<WorkStatus[]> {
    const res = await fetch(`${API_BASE_URL}/work-statuses`, { headers: getAuthHeaders() });
    const data = await handleResponse<{ statuses: WorkStatus[] }>(res);
    return data.statuses;
  }
}

export const workItemService = new WorkItemService();
