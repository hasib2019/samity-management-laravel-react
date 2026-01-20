import React, { useEffect, useState, useMemo } from 'react';
import api from '../../api/axios';
import Swal from 'sweetalert2';
import { useAuth } from '../../context/AuthContext';

const normalizeCode = (val) => {
  const up = String(val || '').toUpperCase();
  const sp = up.replace(/\s+/g, '_');
  return sp.replace(/[^A-Z0-9_]/g, '');
};

const toBool = (val) => {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') return val === 1;
  if (typeof val === 'string') {
    const v = val.toLowerCase();
    return v === 'active' || v === '1' || v === 'true';
  }
  return !!val;
};

const GlMappingType = () => {
  const { hasPermission } = useAuth();
  const canView = hasPermission('gl.mapping.type.view');
  const canCreate = hasPermission('gl.mapping.type.create');
  const canEdit = hasPermission('gl.mapping.type.edit');
  const canDelete = hasPermission('gl.mapping.type.delete');

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '',
    type_code: '',
    description: '',
    status: true,
  });

  useEffect(() => {
    if (canView) fetchItems();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(i => {
      const statusLabel = toBool(i.status_bool ?? i.status) ? 'active' : 'inactive';
      return (
        String(i.name || '').toLowerCase().includes(q) ||
        String(i.type_code || '').toLowerCase().includes(q) ||
        String(i.description || '').toLowerCase().includes(q) ||
        statusLabel.includes(q)
      );
    });
  }, [items, search]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await api.get('/gl-mapping-types');
      setItems(res.data);
    } catch (e) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', type_code: '', description: '', status: true });
    setIsModalOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      name: item.name || '',
      type_code: item.type_code || '',
      description: item.description || '',
      status: toBool(item.status_bool ?? item.status),
    });
    setIsModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let v = type === 'checkbox' ? checked : value;
    if (name === 'type_code') v = normalizeCode(value);
    setForm(prev => ({ ...prev, [name]: v }));
  };

  const handleNameBlur = () => {
    if (!form.type_code && form.name) {
      setForm(prev => ({ ...prev, type_code: normalizeCode(prev.name) }));
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/gl-mapping-types/${editing.id}`, form);
        Swal.fire({ position: 'top-end', icon: 'success', title: 'Updated', showConfirmButton: false, timer: 1200, toast: true });
      } else {
        await api.post('/gl-mapping-types', form);
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
    }
  };

  const remove = async (id) => {
    const s = await Swal.fire({ title: 'Delete?', showCancelButton: true, confirmButtonText: 'Yes', cancelButtonText: 'Cancel' });
    if (!s.isConfirmed) return;
    try {
      await api.delete(`/gl-mapping-types/${id}`);
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
        <h2 className="text-2xl font-bold text-gray-800">GL Mapping Type</h2>
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
              <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Type Code</th>
              <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Description</th>
              <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td className="px-6 py-4" colSpan={5}>Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td className="px-6 py-4" colSpan={5}>No records</td></tr>
            ) : (
              filtered.map(item => (
                <tr key={item.id}>
                  <td className="px-6 py-4 text-sm text-gray-700">{item.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{item.type_code}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{item.description}</td>
                  <td className="px-6 py-4">
                <span className={`px-2 py-1 rounded text-xs ${toBool(item.status_bool ?? item.status) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {toBool(item.status_bool ?? item.status) ? 'active' : 'inactive'}
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
                  <h3 className="text-lg font-medium text-gray-900">{editing ? 'Edit' : 'Add'} GL Mapping Type</h3>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-3 py-1 bg-gray-200 rounded">Close</button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      onBlur={handleNameBlur}
                      className="px-3 py-2 w-full rounded-md border border-gray-300"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Type Code</label>
                    <input
                      type="text"
                      name="type_code"
                      value={form.type_code}
                      onChange={handleChange}
                      className="px-3 py-2 w-full rounded-md border border-gray-300"
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">Auto-normalized to uppercase with underscores</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      className="px-3 py-2 w-full rounded-md border border-gray-300"
                      rows="3"
                    />
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
                <button type="submit" className="px-4 py-2 text-white bg-blue-600 rounded-md">{editing ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlMappingType;
