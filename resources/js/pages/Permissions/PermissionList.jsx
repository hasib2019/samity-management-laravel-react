import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Plus, Edit, Trash2 } from 'lucide-react';

const PermissionList = () => {
    const [permissions, setPermissions] = useState([]);
    const [menus, setMenus] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPermission, setEditingPermission] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        menu_id: ''
    });

    const { hasPermission } = useAuth();

    useEffect(() => {
        fetchPermissions();
        fetchMenus();
    }, []);

    const fetchPermissions = async () => {
        try {
            const response = await api.get('/permissions');
            setPermissions(response.data);
        } catch (error) {
            console.error('Failed to fetch permissions', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMenus = async () => {
        try {
            const response = await api.get('/menus');
            // Flatten menus for select
            const flatMenus = [];
            const flatten = (items) => {
                items.forEach(item => {
                    flatMenus.push({ id: item.id, name: item.name });
                    if (item.children && item.children.length > 0) {
                        flatten(item.children);
                    }
                });
            };
            flatten(response.data);
            setMenus(flatMenus);
        } catch (error) {
            console.error('Failed to fetch menus', error);
        }
    };

    const handleOpenModal = (permission = null) => {
        if (permission) {
            setEditingPermission(permission);
            setFormData({
                name: permission.name,
                slug: permission.slug,
                menu_id: permission.menu_id || ''
            });
        } else {
            setEditingPermission(null);
            setFormData({
                name: '',
                slug: '',
                menu_id: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingPermission) {
                await api.put(`/permissions/${editingPermission.id}`, formData);
            } else {
                await api.post('/permissions', formData);
            }
            setIsModalOpen(false);
            fetchPermissions();
        } catch (error) {
            alert(error.response?.data?.message || 'Something went wrong');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this permission?')) {
            try {
                await api.delete(`/permissions/${id}`);
                fetchPermissions();
            } catch (error) {
                alert(error.response?.data?.message || 'Failed to delete');
            }
        }
    };

    if (loading) return <div>Loading permissions...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Permission Management</h2>
                {hasPermission('permission.create') && (
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        <Plus className="w-4 h-4 mr-2" /> Add Permission
                    </button>
                )}
            </div>

            <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slug</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Menu</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {permissions.map((permission) => (
                            <tr key={permission.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{permission.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{permission.slug}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {permission.menu?.name || 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    {hasPermission('permission.edit') && (
                                        <button onClick={() => handleOpenModal(permission)} className="text-blue-600 hover:text-blue-900 mr-3">
                                            <Edit className="w-4 h-4" />
                                        </button>
                                    )}
                                    {hasPermission('permission.delete') && (
                                        <button onClick={() => handleDelete(permission.id)} className="text-red-600 hover:text-red-900">
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
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <h3 className="text-lg font-bold mb-4">{editingPermission ? 'Edit Permission' : 'Add Permission'}</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Permission Name</label>
                                <input
                                    type="text"
                                    required
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    placeholder="e.g. View Users"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Slug</label>
                                <input
                                    type="text"
                                    required
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    value={formData.slug}
                                    onChange={e => setFormData({...formData, slug: e.target.value})}
                                    placeholder="e.g. user.view"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Menu</label>
                                <select
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    value={formData.menu_id}
                                    onChange={e => setFormData({...formData, menu_id: e.target.value})}
                                >
                                    <option value="">Select Menu</option>
                                    {menus.map(menu => (
                                        <option key={menu.id} value={menu.id}>{menu.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                    {editingPermission ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PermissionList;
