import React, { useEffect, useState } from 'react';
import api from '../../api/axios';

const typeLabels = {
  create: 'Created',
  update: 'Updated',
  delete: 'Deleted',
};

const modelFilters = [
  { key: '', label: 'All HR' },
  { key: 'department', label: 'Departments' },
  { key: 'designation', label: 'Designations' },
  { key: 'shift', label: 'Shifts' },
  { key: 'holiday', label: 'Holidays' },
  { key: 'employee', label: 'Employees' },
];

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState({ model: '' });
  const [expanded, setExpanded] = useState(null);

  const load = async (page = 1, currentFilter = filter) => {
    setLoading(true);
    try {
      const params = { page };
      if (currentFilter.model) params.model = currentFilter.model;
      const res = await api.get('/hr/audit-logs', { params });
      const data = res.data;
      setLogs(data.data || []);
      setMeta({
        current_page: data.current_page,
        last_page: data.last_page,
        total: data.total,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1, filter);
  }, []);

  const onFilterChange = (key) => {
    const next = { ...filter, model: key };
    setFilter(next);
    load(1, next);
  };

  const toggleExpand = (id) => {
    setExpanded(expanded === id ? null : id);
  };

  const renderJson = (obj) => {
    if (!obj) return <span className="text-gray-400 text-xs">empty</span>;
    return (
      <pre className="text-xs bg-gray-50 rounded-lg p-2 overflow-x-auto">
        {JSON.stringify(obj, null, 2)}
      </pre>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">HR Audit Logs</h2>
        {meta && (
          <div className="text-sm text-gray-500">
            Total {meta.total} records
          </div>
        )}
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-3">
        <span className="text-sm text-gray-600">Filter by module:</span>
        <div className="flex flex-wrap gap-2">
          {modelFilters.map((m) => (
            <button
              key={m.key}
              onClick={() => onFilterChange(m.key)}
              className={`px-3 py-1 rounded-full text-xs border ${
                filter.model === m.key
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        {loading ? (
          <div className="text-center text-gray-500 text-sm">Loading...</div>
        ) : logs.length === 0 ? (
          <div className="text-center text-gray-500 text-sm">
            No audit logs found for the selected filter.
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div
                key={log.id}
                className="border rounded-lg px-4 py-3 hover:bg-gray-50 transition"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          log.action === 'create'
                            ? 'bg-green-100 text-green-700'
                            : log.action === 'update'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {typeLabels[log.action] || log.action}
                      </span>
                      <span className="text-gray-700 font-medium">
                        {log.auditable_type}
                      </span>
                      <span className="text-gray-400 text-xs">
                        #{log.auditable_id}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      <span>
                        By {log.user?.name || 'System'} (ID:{' '}
                        {log.user_id || 'N/A'})
                      </span>
                      <span>IP: {log.ip_address || '-'}</span>
                      <span>
                        Time:{' '}
                        {log.created_at
                          ? new Date(log.created_at).toLocaleString()
                          : '-'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleExpand(log.id)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    {expanded === log.id ? 'Hide details' : 'View details'}
                  </button>
                </div>

                {expanded === log.id && (
                  <div className="mt-3 grid md:grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs font-semibold text-gray-600 mb-1">
                        Old Values
                      </div>
                      {renderJson(log.old_values)}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-gray-600 mb-1">
                        New Values
                      </div>
                      {renderJson(log.new_values)}
                    </div>
                    <div className="md:col-span-2">
                      <div className="text-xs font-semibold text-gray-600 mb-1">
                        User Agent
                      </div>
                      <div className="text-xs text-gray-500 break-all bg-gray-50 rounded-lg p-2">
                        {log.user_agent || '-'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-between mt-4 text-sm">
            <button
              disabled={meta.current_page <= 1}
              onClick={() => load(meta.current_page - 1, filter)}
              className="px-3 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <div className="text-gray-500">
              Page {meta.current_page} of {meta.last_page}
            </div>
            <button
              disabled={meta.current_page >= meta.last_page}
              onClick={() => load(meta.current_page + 1, filter)}
              className="px-3 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;

