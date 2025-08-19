import React, { useMemo, useState } from 'react';
import { useWorkItems, useWorkItemsFilter, useTasksFilter } from '../hooks/useWorkItems';
import { useCustomers } from '../hooks/useCustomers';
import { useUsers } from '../hooks/useUsers';
import TagInput, { TagOption } from '../components/TagInput';
import { API_BASE_URL } from '../config/env';
import { AUTH_TOKEN_KEY } from '../config/env';

const Kanban: React.FC = () => {
  const [customerFilter, setCustomerFilter] = useState<(number | string)[] | null>(null);
  const [userFilter, setUserFilter] = useState<(number | string)[] | null>(null);
  const [statusFilter, setStatusFilter] = useState<(number | string)[] | null>(null);

  const { customers } = useCustomers();
  const { users } = useUsers();

  const customerOptions: TagOption[] = useMemo(() => customers.map(c => ({ value: c.id, label: c.name })), [customers]);
  const userOptions: TagOption[] = useMemo(() => users.map(u => ({ value: u.id, label: u.name })), [users]);

  const toNumArray = (vals: (number | string)[] | null | undefined) => (vals || []).map(v => Number(v)).filter(n => Number.isFinite(n));
  const customerIds = toNumArray(customerFilter);
  const userIds = toNumArray(userFilter);
  const statusIds = toNumArray(statusFilter);

  const { statuses, updateWorkItem } = useWorkItems();
  const { workItems } = useWorkItemsFilter({ customer_ids: customerIds, assigned_to_ids: userIds, status_ids: statusIds });
  const { tasks } = useTasksFilter({ customer_ids: customerIds, assigned_to_ids: userIds, status_ids: statusIds });

  const toDoStatusId = useMemo(() => statuses.find(s => s.name.toLowerCase() === 'to do')?.id, [statuses]);

  const handleDragStart = (e: React.DragEvent, payload: { type: 'workItem' | 'task'; id: number }) => {
    e.dataTransfer.setData('application/json', JSON.stringify(payload));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, statusId: number) => {
    e.preventDefault();
    try {
      const data = e.dataTransfer.getData('application/json');
      const parsed = JSON.parse(data) as { type: 'workItem' | 'task'; id: number };
      if (parsed.type === 'workItem') {
        await updateWorkItem(parsed.id, { status_id: statusId });
      } else {
        // Update task status via direct API call to tasks service to keep board in sync
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        await fetch(`${API_BASE_URL}/tasks/${parsed.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' }, body: JSON.stringify({ status_id: statusId }) });
      }
    } catch {
      // ignore
    }
  };

  const itemsByStatus = (statusId: number) => workItems.filter(w => (w.status_id ?? toDoStatusId) === statusId);
  const tasksByStatus = (statusId: number) => tasks.filter(t => (t.status_id ?? toDoStatusId) === statusId);

  const filteredStatuses = useMemo(() => {
    if (!statusIds.length) return statuses;
    return statuses.filter(s => statusIds.includes(s.id));
  }, [statuses, statusIds]);
  const cancelled = useMemo(() => filteredStatuses.find(s => s.name.toLowerCase() === 'cancelled') || null, [filteredStatuses]);
  const topStatuses = useMemo(() => filteredStatuses.filter(s => s.name.toLowerCase() !== 'cancelled'), [filteredStatuses]);

  const renderColumn = (statusId: number, statusName: string) => (
    <div key={statusId} className={`kanban__column ${statusName.toLowerCase() === 'cancelled' ? 'kanban__column--cancelled' : ''}`} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, statusId)}>
      <div className="kanban__column-header">
        <h3>{statusName}</h3>
        <span className="kanban__count">{itemsByStatus(statusId).length + tasksByStatus(statusId).length}</span>
      </div>
      <div className="kanban__column-body">
        {itemsByStatus(statusId).map(w => (
          <div
            key={`wi-${w.id}`}
            className="kanban-card kanban-card--item"
            draggable
            onDragStart={(e) => handleDragStart(e, { type: 'workItem', id: w.id })}
            title={w.title}
          >
            <div className="kanban-card__title">{w.title}</div>
            <div className="kanban-card__meta">
              <span>Customer: {w.customer?.name ?? w.customer_id}</span>
              <span>Owner: {w.assigned_user?.name ?? 'Unassigned'}</span>
            </div>
          </div>
        ))}
        {tasksByStatus(statusId).map(t => (
          <div
            key={`t-${t.id}`}
            className="kanban-card kanban-card--task"
            draggable
            onDragStart={(e) => handleDragStart(e, { type: 'task', id: t.id })}
            title={t.title}
          >
            <div className="kanban-card__title">{t.title}</div>
            <div className="kanban-card__meta">
              <span>Work Item: {t.work_item?.title ?? t.work_item_id}</span>
              <span>Owner: {t.assigned_user?.name ?? 'Unassigned'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="kanban">
      <div className="page__header">
        <h1>Kanban Board</h1>
      </div>

      <div className="filters filters--bar">
        <div className="filters__group">
          <label className="form-label">Customer</label>
          <TagInput
            value={customerFilter || []}
            options={customerOptions}
            multiple
            placeholder="Filter by customer"
            onChange={(v) => setCustomerFilter(Array.isArray(v) ? v : (v != null ? [v] : []))}
          />
        </div>
        <div className="filters__group">
          <label className="form-label">User</label>
          <TagInput
            value={userFilter || []}
            options={userOptions}
            multiple
            placeholder="Filter by user"
            onChange={(v) => setUserFilter(Array.isArray(v) ? v : (v != null ? [v] : []))}
          />
        </div>
        <div className="filters__group">
          <label className="form-label">Status</label>
          <TagInput
            value={statusFilter || []}
            options={statuses.map(s => ({ value: s.id, label: s.name }))}
            multiple
            placeholder="Filter by status"
            onChange={(v) => setStatusFilter(Array.isArray(v) ? v : (v != null ? [v] : []))}
          />
        </div>
      </div>

      {/* Top row: all statuses except Cancelled */}
      <div className="kanban__row kanban__row--top">
        <div className="kanban__scroll">
          {topStatuses.map(s => renderColumn(s.id, s.name))}
        </div>
      </div>

      {/* Bottom row: only Cancelled */}
      {cancelled && (
        <div className="kanban__row kanban__row--bottom">
          {renderColumn(cancelled.id, cancelled.name)}
        </div>
      )}
    </div>
  );
};

export default Kanban;
