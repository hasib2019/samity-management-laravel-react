import React, { useEffect, useState, useMemo } from 'react';
import api from '../../api/axios';
import Swal from 'sweetalert2';
import { useAuth } from '../../context/AuthContext';
import { Combobox } from '@headlessui/react';
import LoadingButton from '../../components/LoadingButton';

const toBool = (val) => {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') return val === 1;
  if (typeof val === 'string') {
    const v = val.toLowerCase();
    return v === 'active' || v === '1' || v === 'true';
  }
  return !!val;
};

const GlMapping = () => {
  const { hasPermission } = useAuth();
  const canView = hasPermission('gl.mapping.view');
  const canCreate = hasPermission('gl.mapping.create');
  const canEdit = hasPermission('gl.mapping.edit');
  const canDelete = hasPermission('gl.mapping.delete');

  const [items, setItems] = useState([]);
  const [types, setTypes] = useState([]);
  const [glAccounts, setGlAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [glQuery, setGlQuery] = useState('');
  const [form, setForm] = useState({
    gl_code_type: '',
    gl_mst_id: '',
    status: true,
  });

  useEffect(() => {
    if (canView) {
      fetchTypes();
      fetchGlAccounts();
      fetchItems();
    }
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(i => {
      const typeName = i.mapping_type?.name || '';
      const typeCode = i.gl_code_type || '';
      const glCode = i.gl_account?.glac_code || '';
      const glName = i.gl_account?.glac_name || '';
      const statusLabel = toBool(i.status) ? 'active' : 'inactive';
      return (
        String(typeName).toLowerCase().includes(q) ||
        String(typeCode).toLowerCase().includes(q) ||
        String(glCode).toLowerCase().includes(q) ||
        String(glName).toLowerCase().includes(q) ||
        statusLabel.includes(q)
      );
    });
  }, [items, search]);

  const fetchTypes = async () => {
    try {
      const res = await api.get('/gl-mapping-types');
      const activeTypes = (res.data || []).filter(t => toBool(t.status_bool ?? t.status));
      setTypes(activeTypes);
    } catch (e) {
      setTypes([]);
    }
  };

  const fetchGlAccounts = async () => {
    try {
      const res = await api.get('/gl-accounts', { params: { parent_child: 'C' } });
      const active = (res.data || []).filter(a => a.status === 'A');
      setGlAccounts(active);
    } catch (e) {
      setGlAccounts([]);
    }
  };

  const filteredGlAccounts = useMemo(() => {
    const q = glQuery.trim().toLowerCase();
    if (!q) return glAccounts;
    return glAccounts.filter(gl =>
      String(gl.glac_code || '').toLowerCase().includes(q) ||
      String(gl.glac_name || '').toLowerCase().includes(q)
    );
  }, [glAccounts, glQuery]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await api.get('/gl-mappings');
      setItems(res.data);
    } catch (e) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ gl_code_type: '', gl_mst_id: '', status: true });
    setIsModalOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      gl_code_type: item.gl_code_type || '',
      gl_mst_id: item.gl_mst_id || '',
      status: toBool(item.status),
    });
    setIsModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const v = type === 'checkbox' ? checked : value;
    setForm(prev => ({ ...prev, [name]: v }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        gl_code_type: form.gl_code_type,
        gl_mst_id: form.gl_mst_id,
        status: !!form.status,
      };
      if (editing) {
        await api.put(`/gl-mappings/${editing.id}`, payload);
        Swal.fire({ position: 'top-end', icon: 'success', title: 'Updated', showConfirmButton: false, timer: 1200, toast: true });
      } else {
        await api.post('/gl-mappings', payload);
        Swal.fire({ position: 'top-end', icon: 'success', title: 'Created', showConfirmButton: false, timer: 1200, toast: true });
      }
      setIsModalOpen(false);
      fetchItems();
    } catch (err) {
      if (err.response?.data?.errors) {
        const firstError = Object.values(err.response.data.errors)[0][0];
        Swal.fire({ position: 'top-end', icon: 'error', title: firstError, showConfirmButton: false, timer: 2000, toast: true });
      } else {
        Swal.fire({ position: 'top-end', icon: 'error', title: err.response?.data?.message || 'Operation failed', showConfirmButton: false, timer: 2000, toast: true });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id) => {
    const s = await Swal.fire({ title: 'Delete?', showCancelButton: true, confirmButtonText: 'Yes', cancelButtonText: 'Cancel' });
    if (!s.isConfirmed) return;
    try {
      await api.delete(`/gl-mappings/${id}`);
      Swal.fire({ position: 'top-end', icon: 'success', title: 'Deleted', showConfirmButton: false, timer: 1200, toast: true });
      fetchItems();
    } catch (err) {
      Swal.fire({ position: 'top-end', icon: 'error', title: err.response?.data?.message || 'Delete failed', showConfirmButton: false, timer: 2000, toast: true });
    }
  };

  if (!canView) return <div className="py-10 text-center text-red-500">Permission Denied</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">GL Mapping</h2>
        {canCreate && (
          <button onClick={openCreate} className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700">
            Add
          </button>
        )}
      </div>

      <div className="flex items-center">
        <div className="relative w-full">
          <input
            type="text"
            placeholder="Search..."
            className="px-3 py-2 w-full rounded-md border border-gray-300"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-hidden bg-white rounded-lg border border-gray-200 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">GL Account</th>
              <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td className="px-6 py-4" colSpan={4}>Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td className="px-6 py-4" colSpan={4}>No records</td></tr>
            ) : (
              filtered.map(item => (
                <tr key={item.id}>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    <div className="flex flex-col">
                      <span className="font-medium">{item.mapping_type?.name || ''}</span>
                      <span className="text-xs text-gray-500">{item.gl_code_type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    <div className="flex flex-col">
                      <span className="font-medium">{item.gl_account?.glac_name || ''}</span>
                      <span className="text-xs text-gray-500">{item.gl_account?.glac_code || ''}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs ${toBool(item.status) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {toBool(item.status) ? 'active' : 'inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {canEdit && (
                        <button onClick={() => openEdit(item)} className="px-3 py-1 text-white bg-indigo-600 rounded">Edit</button>
                      )}
                      {canDelete && (
                        <button onClick={() => remove(item.id)} className="px-3 py-1 text-white bg-red-600 rounded">Delete</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-xl bg-white rounded-lg shadow-xl z-[101]">
            <form onSubmit={submit}>
              <div className="px-4 pt-5 pb-4 bg-white sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center pb-2 mb-4 border-b">
                  <h3 className="text-lg font-medium text-gray-900">{editing ? 'Edit' : 'Add'} GL Mapping</h3>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-3 py-1 bg-gray-200 rounded">Close</button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Type</label>
                    <select
                      name="gl_code_type"
                      value={form.gl_code_type}
                      onChange={handleChange}
                      className="px-3 py-2 w-full rounded-md border border-gray-300"
                      required
                    >
                      <option value="">Select Type</option>
                      {types.map(t => (
                        <option key={t.id} value={t.type_code}>{t.name} ({t.type_code})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">GL Account</label>
                    <Combobox
                      value={glAccounts.find(a => a.id === form.gl_mst_id) || null}
                      onChange={(val) => setForm(prev => ({ ...prev, gl_mst_id: val?.id || '' }))}
                    >
                      <div className="relative">
                        <Combobox.Input
                          className="px-3 py-2 w-full rounded-md border border-gray-300"
                          displayValue={(val) => val ? `${val.glac_code} - ${val.glac_name}` : ''}
                          onChange={(e) => setGlQuery(e.target.value)}
                        />
                        <Combobox.Options className="overflow-auto absolute z-10 mt-1 w-full max-h-60 bg-white rounded-md ring-1 shadow-lg ring-black/5">
                          {filteredGlAccounts.map(gl => (
                            <Combobox.Option
                              key={gl.id}
                              value={gl}
                              className="px-3 py-2 text-sm cursor-pointer select-none hover:bg-gray-100"
                            >
                              <span>{gl.glac_code} - {gl.glac_name}</span>
                            </Combobox.Option>
                          ))}
                        </Combobox.Options>
                      </div>
                    </Combobox>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <div className="flex items-center">
                      <span className="mr-2">{form.status ? 'Active' : 'Inactive'}</span>
                      <input
                        type="checkbox"
                        name="status"
                        checked={!!form.status}
                        onChange={handleChange}
                        className="w-4 h-4"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end px-6 py-3 bg-gray-50">
                <LoadingButton
                  type="submit"
                  isLoading={submitting}
                  loadingText={editing ? 'Updating...' : 'Creating...'}
                  className="px-4 py-2 text-white bg-blue-600 rounded-md"
                >
                  {editing ? 'Update' : 'Create'}
                </LoadingButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlMapping;

