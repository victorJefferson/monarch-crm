import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { leadService, Lead as BaseLead } from '../services/leadService';
import { useWorkItemsFilter, useTasksFilter } from '../hooks/useWorkItems';
import { useUsers } from '../hooks/useUsers';
// import StatusBadge from '../components/StatusBadge';
import { useCommunications, useCommunicationsFilter } from '../hooks/useCommunications';
import ChatThread, { ChatMessage } from '../components/ChatThread';
import TagInput from '../components/TagInput';

type Lead = BaseLead & { created_user?: { name?: string }, updated_user?: { name?: string } };

const LeadDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const leadId = Number(id);

  const { data: lead, isLoading, error } = useQuery<Lead>({ queryKey: ['lead', 'detail', leadId], queryFn: () => leadService.getLeadById(leadId) as Promise<Lead>, enabled: Number.isFinite(leadId) });
  const [userFilter, setUserFilter] = useState<(number | string)[] | null>(null);
  const { users } = useUsers();
  const userOptions = useMemo(() => users.map(u => ({ value: u.id, label: u.name })), [users]);

  const toNumArray = (vals: (number | string)[] | null | undefined) => (vals || []).map(v => Number(v)).filter(n => Number.isFinite(n));
  const userIds = toNumArray(userFilter);

  const { workItems } = useWorkItemsFilter({ customer_ids: [leadId], assigned_to_ids: userIds });
  const { tasks } = useTasksFilter({ customer_ids: [leadId], assigned_to_ids: userIds });
  const { communications } = useCommunicationsFilter({ lead_ids: [leadId], created_by_ids: userIds });
  const { addMessage, deleteMessage } = useCommunications();

  // Prepare chat messages as a hook before any early returns to keep hook order stable
  const chatMessages: ChatMessage[] = useMemo(() => communications.map(c => ({
    id: c.id,
    text: c.message,
    date: c.created_at,
    authorName: c.created_user?.name || 'You',
    isMine: true,
  })), [communications]);

  if (!Number.isFinite(leadId)) return <div className="lead-details"><p>Invalid lead ID</p></div>;
  if (isLoading) return <div className="lead-details"><p>Loading lead details...</p></div>;
  if (error || !lead) return <div className="lead-details"><p>Failed to load lead details</p></div>;

  const handleSend = async (text: string) => { await addMessage({ lead_id: leadId, message: text }); };

  return (
    <div className="lead-details">
      <div className="lead-details__header">
        <div className="lead-avatar"><span>{lead.name.split(' ').map(n => n[0]).join('')}</span></div>
        <div className="lead-title">
          <h1>{lead.name}</h1>
          <div className="lead-subtitle">{lead.email && <span>{lead.email}</span>}{lead.phone && <span>• {lead.phone}</span>}<span>• {lead.is_converted ? 'Customer' : 'Lead'}</span></div>
        </div>
        <div className="lead-actions">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 260 }}>
            <div>
              <label className="form-label" style={{ display: 'block', marginBottom: 6 }}>Filter by User</label>
              <TagInput
                value={userFilter || []}
                options={userOptions}
                multiple
                onChange={(v) => setUserFilter(Array.isArray(v) ? v : (v != null ? [v] : []))}
                placeholder="All users"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="lead-details__grid">
        <div className="lead-card">
          <div className="lead-card__header"><h3>About</h3></div>
          <div className="lead-card__body">
            <dl className="meta-list">
              <div className="meta-row"><dt>Status</dt><dd>{lead.status?.name || '—'}</dd></div>
              <div className="meta-row"><dt>Source</dt><dd>{lead.source?.name || '—'}</dd></div>
              <div className="meta-row"><dt>Assigned To</dt><dd>{lead.assigned_user?.name || 'Unassigned'}</dd></div>
              <div className="meta-row"><dt>Created</dt><dd>{new Date(lead.created_at).toLocaleString()}</dd></div>
              <div className="meta-row"><dt>Created By</dt><dd>{lead.created_user?.name || '—'}</dd></div>
              <div className="meta-row"><dt>Last Updated</dt><dd>{new Date(lead.updated_at).toLocaleString()}</dd></div>
              <div className="meta-row"><dt>Updated By</dt><dd>{lead.updated_user?.name || '—'}</dd></div>
            </dl>
          </div>
        </div>

        <div className="lead-card">
          <div className="lead-card__header"><h3>Timeline</h3></div>
          <div className="lead-card__body">
            <ul className="timeline">
              <li className="timeline__item"><div className="timeline__dot" /><div className="timeline__content"><div className="timeline__title">Lead created</div><div className="timeline__meta">{new Date(lead.created_at).toLocaleString()} • {lead.created_user?.name || 'System'}</div></div></li>
              <li className="timeline__item"><div className="timeline__dot" /><div className="timeline__content"><div className="timeline__title">Last updated</div><div className="timeline__meta">{new Date(lead.updated_at).toLocaleString()} • {lead.updated_user?.name || 'System'}</div></div></li>
              <li className="timeline__hint">Detailed status history is not available yet.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="lead-details__triple">
        <div className="lead-card">
          <div className="lead-card__header"><h3>Work Items</h3></div>
          <div className="lead-card__body">
            {workItems.length === 0 ? (<p className="muted">No work items</p>) : (
              <ul className="related-list">{workItems.map(w => (<li key={w.id} className="related-item"><div><div className="related-title">{w.title}</div>{w.description && <div className="related-subtitle">{w.description}</div>}</div><div className="related-meta"><span className="badge">{w.status?.name || '—'}</span></div></li>))}</ul>
            )}
          </div>
        </div>

        <div className="lead-card">
          <div className="lead-card__header"><h3>Tasks</h3></div>
          <div className="lead-card__body">
            {tasks.length === 0 ? (<p className="muted">No tasks</p>) : (
              <ul className="related-list">{tasks.map(t => (<li key={t.id} className="related-item"><div><div className="related-title">{t.title}</div>{t.description && <div className="related-subtitle">{t.description}</div>}</div><div className="related-meta"><span className="badge badge--success">{t.status?.name || '—'}</span></div></li>))}</ul>
            )}
          </div>
        </div>
        <div className="lead-card">
          <div className="lead-card__header"><h3>Client Conversations</h3></div>
          <div className="lead-card__body">
            <ChatThread messages={chatMessages} onSend={handleSend} onDelete={(id) => deleteMessage(Number(id))} placeholder="Record a note from this lead..." sendLabel="Record" />
          </div>
        </div>
      </div>

      <div className="lead-details__footer"><button className="btn btn--ghost" onClick={() => navigate(-1)}>Back</button></div>
    </div>
  );
};

export default LeadDetails;
