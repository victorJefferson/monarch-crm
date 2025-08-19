import React, { useMemo, useState } from 'react';
import { useWorkItems, useTasks, useWorkItemsFilter } from '../hooks/useWorkItems';
import { useCustomers } from '../hooks/useCustomers';
import { useUsers } from '../hooks/useUsers';
import TagInput, { TagOption } from '../components/TagInput';
import FormModal from '../components/FormModal';
import { FormButton, FormField } from '../components/CommonForm';
import { BUTTON_LABELS } from '../utils/ButtonLabels';

interface WorkItemForm {
  title: string;
  description?: string;
  customer_id: number;
  assigned_to?: number;
  status_id: number;
}

interface TaskForm {
  title: string;
  description?: string;
  work_item_id: number;
  customer_id: number;
  assigned_to?: number;
  status_id: number;
}

const WorkItemTasks: React.FC<{ workItemId: number; customerId: number; userOptions: TagOption[]; statusOptions: TagOption[] }> = ({ workItemId, customerId, userOptions, statusOptions }) => {
  const { tasks, addTask, deleteTask, updateTask } = useTasks({ work_item_id: workItemId });
  const [isTaskOpen, setIsTaskOpen] = useState(false);
  const [editTaskId, setEditTaskId] = useState<number | null>(null);

  const editingTask = useMemo(() => tasks.find(t => t.id === editTaskId) || null, [tasks, editTaskId]);

  const fieldsTask: FormField<TaskForm>[] = [
    { name: 'title', label: 'Title', type: 'text', required: true, validation: { required: 'Title is required' } },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'assigned_to', label: 'Assign to', type: 'select', options: userOptions.map(o => ({ value: Number(o.value), label: o.label })) },
    { name: 'status_id', label: 'Status', type: 'select', required: true, options: statusOptions.map(o => ({ value: Number(o.value), label: o.label })) },
  ];

  const buttonsTask: FormButton[] = [
    { label: BUTTON_LABELS.CANCEL, type: 'button', variant: 'secondary', onClick: () => { setIsTaskOpen(false); setEditTaskId(null);} },
    { label: editTaskId ? BUTTON_LABELS.SAVE ?? 'Save' : BUTTON_LABELS.CREATE, type: 'submit', variant: 'primary' },
  ];

  const handleCreateTask = async (data: TaskForm) => {
    if (editTaskId) {
      await updateTask(editTaskId, {
        title: data.title,
        description: data.description,
        work_item_id: workItemId,
        customer_id: customerId,
        assigned_to: data.assigned_to ? Number(data.assigned_to) : undefined,
        status_id: Number(data.status_id),
      });
    } else {
      await addTask({
        title: data.title,
        description: data.description,
        work_item_id: workItemId,
        customer_id: customerId,
        assigned_to: data.assigned_to ? Number(data.assigned_to) : undefined,
        status_id: Number(data.status_id),
      });
    }
    setIsTaskOpen(false);
    setEditTaskId(null);
  };

  return (
    <div className="tasks">
      <div className="tasks__header">
        <h4>Tasks</h4>
        <div className="flex gap-2">
          <button className="btn btn--secondary" onClick={() => { setEditTaskId(null); setIsTaskOpen(true); }}>Add Task</button>
        </div>
      </div>
      <ul className="tasks__list">
        {tasks.map(t => (
          <li key={t.id} className="task-item">
            <div className="task-item__main">
              <div className="task-title">{t.title}</div>
              {t.description && <div className="task-desc">{t.description}</div>}
              <div className="text-xs text-gray-600">Status: {t.status?.name ?? '—'}</div>
            </div>
            <div className="task-actions">
              <button className="btn btn--ghost" onClick={() => { setEditTaskId(t.id); setIsTaskOpen(true); }}>Edit</button>
              <button className="btn btn--warning" onClick={() => deleteTask(t.id)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
      <FormModal
        isOpen={isTaskOpen}
        onClose={() => { setIsTaskOpen(false); setEditTaskId(null);} }
        title={editTaskId ? 'Edit Task' : 'Add Task'}
        fields={fieldsTask}
        buttons={buttonsTask}
        onSubmit={handleCreateTask}
        defaultValues={editTaskId && editingTask ? {
          title: editingTask.title as any,
          description: (editingTask.description || '') as any,
          work_item_id: workItemId as any,
          customer_id: customerId as any,
          assigned_to: (editingTask.assigned_to ?? undefined) as any,
          status_id: (editingTask.status_id ?? editingTask.status?.id) as any,
        } : undefined}
      />
    </div>
  );
};

const WorkItems: React.FC = () => {
  // Filters (single-select searchable dropdowns)
  const [customerFilter, setCustomerFilter] = useState<(number | string)[] | null>(null);
  const [userFilter, setUserFilter] = useState<(number | string)[] | null>(null);
  const [statusFilter, setStatusFilter] = useState<(number | string)[] | null>(null);

  // Data sources
  const { customers } = useCustomers();
  const { users } = useUsers();

  const customerOptions: TagOption[] = useMemo(() => customers.map(c => ({ value: c.id, label: c.name })), [customers]);
  const userOptions: TagOption[] = useMemo(() => users.map(u => ({ value: u.id, label: u.name })), [users]);

  const toNumArray = (vals: (number | string)[] | null | undefined) => (vals || []).map(v => Number(v)).filter(n => Number.isFinite(n));
  const customerIds = toNumArray(customerFilter);
  const userIds = toNumArray(userFilter);
  const statusIds = toNumArray(statusFilter);

  const { workItems, } = useWorkItemsFilter({ customer_ids: customerIds, assigned_to_ids: userIds, status_ids: statusIds });
  const { addWorkItem, deleteWorkItem, updateWorkItem, statuses } = useWorkItems();
  const statusOptions: TagOption[] = useMemo(() => statuses.map(s => ({ value: s.id, label: s.name })), [statuses]);

  // Create and Edit Work Item Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const editingWorkItem = useMemo(() => workItems.find(w => w.id === editId) || null, [workItems, editId]);

  const fieldsWI: FormField<WorkItemForm>[] = useMemo(() => ([
    { name: 'title', label: 'Title', type: 'text', required: true, validation: { required: 'Title is required' } },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'customer_id', label: 'Customer', type: 'select', required: true, options: customerOptions.map(o => ({ value: Number(o.value), label: o.label })) },
    { name: 'assigned_to', label: 'Assign to', type: 'select', options: userOptions.map(o => ({ value: Number(o.value), label: o.label })) },
    { name: 'status_id', label: 'Status', type: 'select', required: true, options: statusOptions.map(o => ({ value: Number(o.value), label: o.label })) },
  ]), [customerOptions, userOptions, statusOptions]);

  const buttonsWI: FormButton[] = [
    { label: BUTTON_LABELS.CANCEL, type: 'button', variant: 'secondary', onClick: () => { setIsCreateOpen(false); setEditId(null);} },
    { label: editId ? BUTTON_LABELS.SAVE ?? 'Save' : BUTTON_LABELS.CREATE, type: 'submit', variant: 'primary' },
  ];

  const handleWorkItemSubmit = async (data: WorkItemForm) => {
    if (editId) {
      await updateWorkItem(editId, {
        title: data.title,
        description: data.description,
        customer_id: Number(data.customer_id),
        assigned_to: data.assigned_to ? Number(data.assigned_to) : undefined,
        status_id: Number(data.status_id),
      });
      setEditId(null);
    } else {
      await addWorkItem({
        title: data.title,
        description: data.description,
        customer_id: Number(data.customer_id),
        assigned_to: data.assigned_to ? Number(data.assigned_to) : undefined,
        status_id: Number(data.status_id),
      });
    }
    setIsCreateOpen(false);
  };

  // Expandable rows for tasks
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const toggleExpand = (id: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className="work-items-page">
      <div className="page__header">
        <h1>Work Items</h1>
        <div className="page__actions">
          <button className="btn btn--primary" onClick={() => { setEditId(null); setIsCreateOpen(true); }}>Add Work Item</button>
        </div>
      </div>

      <div className="filters filters--bar">
        <div className="filters__group">
          <label className="form-label">Customer</label>
          <TagInput
            value={customerFilter || []}
            options={customerOptions}
            multiple
            placeholder="Search customer"
            onChange={(v) => setCustomerFilter(Array.isArray(v) ? v : (v != null ? [v] : []))}
          />
        </div>
        <div className="filters__group">
          <label className="form-label">User</label>
          <TagInput
            value={userFilter || []}
            options={userOptions}
            multiple
            placeholder="Search user"
            onChange={(v) => setUserFilter(Array.isArray(v) ? v : (v != null ? [v] : []))}
          />
        </div>
        <div className="filters__group">
          <label className="form-label">Status</label>
          <TagInput
            value={statusFilter || []}
            options={statusOptions}
            multiple
            placeholder="Search status"
            onChange={(v) => setStatusFilter(Array.isArray(v) ? v : (v != null ? [v] : []))}
          />
        </div>
      </div>

      <div className="data-table">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: '36px' }}></th>
              <th>Title</th>
              <th>Customer</th>
              <th>Owner</th>
              <th>Status</th>
              <th>Created</th>
              <th style={{ width: '220px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {workItems.map(w => (
              <>
                <tr key={w.id} className="table__row">
                  <td>
                    <button className="btn btn--ghost btn--icon" onClick={() => toggleExpand(w.id)} aria-label="Toggle tasks">
                      {expanded.has(w.id) ? '−' : '+'}
                    </button>
                  </td>
                  <td className="table__cell--primary">{w.title}</td>
                  <td>{w.customer?.name ?? w.customer_id}</td>
                  <td>{w.assigned_user?.name ?? 'Unassigned'}</td>
                  <td>{w.status?.name ?? '—'}</td>
                  <td>{new Date(w.created_at).toLocaleDateString()}</td>
                  <td className="table__actions">
                    <button className="btn btn--ghost" onClick={() => { setEditId(w.id); setIsCreateOpen(true); }}>Edit</button>
                    <button className="btn btn--warning" onClick={() => deleteWorkItem(w.id)}>Delete</button>
                  </td>
                </tr>
                {expanded.has(w.id) && (
                  <tr className="table__expand" key={`${w.id}-tasks`}>
                    <td colSpan={7}>
                      <WorkItemTasks workItemId={w.id} customerId={w.customer_id} userOptions={userOptions} statusOptions={statusOptions} />
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      <FormModal
        isOpen={isCreateOpen}
        onClose={() => { setIsCreateOpen(false); setEditId(null);} }
        title={editId ? 'Edit Work Item' : 'Create Work Item'}
        fields={fieldsWI}
        buttons={buttonsWI}
        onSubmit={handleWorkItemSubmit}
        defaultValues={editId && editingWorkItem ? {
          title: editingWorkItem.title as any,
          description: (editingWorkItem.description || '') as any,
          customer_id: editingWorkItem.customer_id as any,
          assigned_to: (editingWorkItem.assigned_to ?? undefined) as any,
          status_id: (editingWorkItem.status_id ?? editingWorkItem.status?.id) as any,
        } : undefined}
      />
    </div>
  );
};

export default WorkItems;
