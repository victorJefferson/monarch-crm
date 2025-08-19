import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL, AUTH_TOKEN_KEY } from '../config/env';
import { queryKeys } from '../constants/queryKeys';
import { useWorkItemsFilter, useTasksFilter } from '../hooks/useWorkItems';
import { useLeads } from '../hooks/useLeads';
import TagInput from '../components/TagInput';
import ChatThread, { ChatMessage } from '../components/ChatThread';
import { useCommunicationsFilter } from '../hooks/useCommunications';

const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

const fetchUserDetail = async (id: number) => {
  const res = await fetch(`${API_BASE_URL}/users/${id}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to load user');
  const data = await res.json();
  return data.data;
};

const UserDetails: React.FC = () => {
  const { id } = useParams();
  const userId = Number(id);

  const { data: user } = useQuery({ queryKey: queryKeys.users.detail(userId), queryFn: () => fetchUserDetail(userId) });
  const { leads } = useLeads();

  // Unified filter for Work Items, Tasks, and Conversations (Lead/Customer)
  const [customerFilter, setCustomerFilter] = useState<(number | string)[] | null>(null);
  const customerOptions = useMemo(() => (leads || []).map(l => ({ value: l.id, label: l.name })), [leads]);

  const toNumArray = (vals: (number | string)[] | null | undefined) => (vals || []).map(v => Number(v)).filter(n => Number.isFinite(n));
  const customerIds = toNumArray(customerFilter);

  const { workItems } = useWorkItemsFilter({ assigned_to_ids: [userId], customer_ids: customerIds });
  const { tasks } = useTasksFilter({ assigned_to_ids: [userId], customer_ids: customerIds });
  // Communications created by this user; optionally filter by selected lead/customer (unified filter)
  const { communications } = useCommunicationsFilter({ created_by_ids: [userId], lead_ids: customerIds });
  const messages: ChatMessage[] = communications.map(c => ({ id: c.id, text: c.message, date: c.created_at, authorName: (leads || []).find(l => l.id === c.lead_id)?.name || 'Customer' }));

  return (
    <div className="lead-details">
      <div className="lead-details__header">
        <div className="lead-avatar"><span>{(user?.name || 'U').split(' ').map((n: any) => n[0]).join('')}</span></div>
        <div className="lead-title">
          <h1>{user?.name}</h1>
          <div className="lead-subtitle">{user?.email && <span>{user.email}</span>}<span>• User</span></div>
        </div>
        <div className="lead-actions">
          <div style={{ minWidth: 260 }}>
            <label className="form-label" style={{ display: 'block', marginBottom: 6 }}>Filter Work Items & Tasks by Customer</label>
            <TagInput
              value={customerFilter || []}
              options={customerOptions}
              multiple
              onChange={(v) => setCustomerFilter(Array.isArray(v) ? v : (v != null ? [v] : []))}
              placeholder="All customers"
            />
          </div>
        </div>
      </div>

      <div className="lead-details__triple">
        <div className="lead-card">
          <div className="lead-card__header"><h3>Work Items</h3></div>
          <div className="lead-card__body">
            {workItems.length === 0 ? (
              <p className="muted">No work items</p>
            ) : (
              <ul className="related-list">
                {workItems.map(w => (
                  <li key={w.id} className="related-item">
                    <div>
                      <div className="related-title">{w.title}</div>
                      {w.description && <div className="related-subtitle">{w.description}</div>}
                    </div>
                    <div className="related-meta"><span className="badge">{w.status?.name || '—'}</span></div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="lead-card">
          <div className="lead-card__header"><h3>Tasks</h3></div>
          <div className="lead-card__body">
            {tasks.length === 0 ? (
              <p className="muted">No tasks</p>
            ) : (
              <ul className="related-list">
                {tasks.map(t => (
                  <li key={t.id} className="related-item">
                    <div>
                      <div className="related-title">{t.title}</div>
                      {t.description && <div className="related-subtitle">{t.description}</div>}
                    </div>
                    <div className="related-meta"><span className="badge badge--success">{t.status?.name || '—'}</span></div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="lead-card">
          <div className="lead-card__header"><h3>Client Conversations</h3></div>
          <div className="lead-card__body">
            <ChatThread messages={messages} readOnly placeholder="Conversations recorded by this user will appear here." />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetails;


