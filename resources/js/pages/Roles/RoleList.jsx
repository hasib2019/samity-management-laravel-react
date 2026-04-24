import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { showSuccessToast, showErrorToast, confirmDelete } from '../../utils/sweetAlert';
import LoadingButton from '../../components/LoadingButton';

const RoleList = () => {
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        permissions: []
    });

    const { hasPermission } = useAuth();

    useEffect(() => {
        fetchRoles();
        fetchPermissions();
    }, []);

    const fetchRoles = async () => {
        try {
            const response = await api.get('/roles');
            setRoles(response.data);
        } catch (error) {
            console.error('Failed to fetch roles', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPermissions = async () => {
        try {
            const response = await api.get('/permissions');
            setPermissions(response.data);
        } catch (error) {
            console.error('Failed to fetch permissions', error);
        }
    };

    const handleOpenModal = (role = null) => {
        if (role) {
            setEditingRole(role);
            setFormData({
                name: role.name,
                permissions: role.permissions.map(p => p.id)
            });
        } else {
            setEditingRole(null);
            setFormData({
                name: '',
                permissions: []
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingRole) {
                await api.put(`/roles/${editingRole.id}`, formData);
                showSuccessToast('Role updated successfully');
            } else {
                await api.post('/roles', formData);
                showSuccessToast('Role created successfully');
            }
            setIsModalOpen(false);
            fetchRoles();
        } catch (error) {
            showErrorToast(error.response?.data?.message || 'Something went wrong');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        confirmDelete().then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await api.delete(`/roles/${id}`);
                    fetchRoles();
                    showSuccessToast('Role deleted successfully');
                } catch (error) {
                    showErrorToast(error.response?.data?.message || 'Failed to delete');
                }
            }
        });
    };

    const togglePermission = (id) => {
        setFormData(prev => ({
            ...prev,
            permissions: prev.permissions.includes(id)
                ? prev.permissions.filter(pId => pId !== id)
                : [...prev.permissions, id]
        }));
    };

    if (loading) return <div>Loading roles...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Role Management</h2>
                {hasPermission('role.create') && (
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        <Plus className="w-4 h-4 mr-2" /> Add Role
                    </button>
                )}
            </div>

            <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slug</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permissions Count</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {roles.map((role) => (
                            <tr key={role.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{role.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{role.slug}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{role.permissions.length}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    {hasPermission('role.edit') && (
                                        <button onClick={() => handleOpenModal(role)} className="text-blue-600 hover:text-blue-900 mr-3">
                                            <Edit className="w-4 h-4" />
                                        </button>
                                    )}
                                    {hasPermission('role.delete') && role.slug !== 'super-admin' && (
                                        <button onClick={() => handleDelete(role.id)} className="text-red-600 hover:text-red-900">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-bold mb-4">{editingRole ? 'Edit Role' : 'Add Role'}</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Role Name</label>
                                <input
                                    type="text"
                                    required
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {permissions.map(permission => (
                                        <label key={permission.id} className="flex items-center space-x-2 text-sm">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                                                checked={formData.permissions.includes(permission.id)}
                                                onChange={() => togglePermission(permission.id)}
                                            />
                                            <span>{permission.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <LoadingButton
                                    type="submit"
                                    isLoading={submitting}
                                    loadingText={editingRole ? 'Updating...' : 'Creating...'}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                    {editingRole ? 'Update' : 'Create'}
                                </LoadingButton>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoleList;
