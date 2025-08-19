import { API_BASE_URL, AUTH_TOKEN_KEY } from '../config/env';

export interface Communication {
  id: number;
  lead_id: number;
  message: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_user?: { id: number; name: string };
  updated_user?: { id: number; name: string };
}

export interface CreateCommunicationRequest {
  lead_id: number;
  message: string;
}

export interface UpdateCommunicationRequest {
  message?: string;
  is_active?: boolean;
}

const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  return { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' };
};

const handleResponse = async <T>(res: Response): Promise<T> => {
  const text = await res.text();
  const tryParse = () => { try { return JSON.parse(text); } catch { return null; } };
  if (!res.ok) { const data = tryParse(); throw new Error(data?.error || data?.message || `HTTP ${res.status}`); }
  const data = tryParse();
  if (!data?.success) throw new Error(data?.error || data?.message || 'Request failed');
  return data.data;
};

class CommunicationService {
  async list(params?: { lead_id?: number; created_by?: number }): Promise<Communication[]> {
    const q = new URLSearchParams();
    if (params?.lead_id) q.set('lead_id', String(params.lead_id));
    if (params?.created_by) q.set('created_by', String(params.created_by));
    const res = await fetch(`${API_BASE_URL}/communications?${q.toString()}`, { headers: getAuthHeaders() });
    return handleResponse<Communication[]>(res);
  }
  async filter(payload: { lead_ids?: number[]; created_by_ids?: number[] }): Promise<Communication[]> {
    const res = await fetch(`${API_BASE_URL}/communications/filter`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(payload) });
    return handleResponse<Communication[]>(res);
  }
  async create(payload: CreateCommunicationRequest): Promise<Communication> {
    const res = await fetch(`${API_BASE_URL}/communications`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(payload) });
    return handleResponse<Communication>(res);
  }
  async update(id: number, payload: UpdateCommunicationRequest): Promise<Communication> {
    const res = await fetch(`${API_BASE_URL}/communications/${id}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(payload) });
    return handleResponse<Communication>(res);
  }
  async remove(id: number): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/communications/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
    await handleResponse<void>(res);
  }
}

export const communicationService = new CommunicationService();
