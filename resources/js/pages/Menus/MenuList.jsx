import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Plus, Edit, Trash2, Eye, EyeOff, Info } from 'lucide-react';

const MenuList = () => {
    const [menus, setMenus] = useState([]);
    const [allMenus, setAllMenus] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMenu, setEditingMenu] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        icon: '',
        parent_id: '',
        order: 0,
        is_hidden: true
    });

    const { hasPermission } = useAuth();

    useEffect(() => {
        fetchMenus();
    }, []);

    const fetchMenus = async () => {
        try {
            const response = await api.get('/menus');
            setMenus(response.data);
            
            // Flatten for parent selection
            const flat = [];
            const flatten = (items) => {
                items.forEach(item => {
                    flat.push({ id: item.id, name: item.name });
                    if (item.children && item.children.length > 0) {
                        flatten(item.children);
                    }
                });
            };
            flatten(response.data);
            setAllMenus(flat);
        } catch (error) {
            console.error('Failed to fetch menus', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (menu = null) => {
        if (menu) {
            setEditingMenu(menu);
            setFormData({
                name: menu.name,
                slug: menu.slug,
                icon: menu.icon || '',
                parent_id: menu.parent_id || '',
                order: menu.order || 0,
                is_hidden: menu.is_hidden
            });
        } else {
            setEditingMenu(null);
            setFormData({
                name: '',
                slug: '',
                icon: '',
                parent_id: '',
                order: 0,
                is_hidden: true
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingMenu) {
                await api.put(`/menus/${editingMenu.id}`, formData);
            } else {
                await api.post('/menus', formData);
            }
            setIsModalOpen(false);
            fetchMenus();
        } catch (error) {
            alert(error.response?.data?.message || 'Something went wrong');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this menu? Children will also be affected if any.')) {
            try {
                await api.delete(`/menus/${id}`);
                fetchMenus();
            } catch (error) {
                alert(error.response?.data?.message || 'Failed to delete');
            }
        }
    };

    const renderMenuRows = (items, depth = 0) => {
        return items.map(menu => (
            <React.Fragment key={menu.id}>
                <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <span style={{ marginLeft: `${depth * 20}px` }}>
                            {depth > 0 && '↳ '} {menu.name}
                        </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                            {menu.is_hidden ? (
                                <span className="flex items-center text-red-500 bg-red-50 px-2 py-1 rounded text-xs" title="Hidden from all users except super-admin">
                                    <EyeOff className="w-3 h-3 mr-1" /> Hidden
                                </span>
                            ) : (
                                <span className="flex items-center text-green-500 bg-green-50 px-2 py-1 rounded text-xs" title="Visible to users with proper permissions">
                                    <Eye className="w-3 h-3 mr-1" /> Visible
                                </span>
                            )}
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex flex-wrap gap-1">
                            {menu.permissions?.map(p => (
                                <span key={p.id} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] border border-blue-100">
                                    {p.slug}
                                </span>
                            ))}
                            {(!menu.permissions || menu.permissions.length === 0) && (
                                <span className="text-gray-400 text-xs italic">No permissions set</span>
                            )}
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{menu.order}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end items-center space-x-3">
                            <div className="relative group">
                                <Info className="w-4 h-4 text-gray-400 cursor-help" />
                                <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block w-48 p-2 bg-gray-800 text-white text-[10px] rounded shadow-lg z-10">
                                    {menu.is_hidden 
                                        ? "This menu is hidden from the sidebar for everyone except Super Admin." 
                                        : "This menu is visible to users who have the associated permissions."}
                                </div>
                            </div>
                            {hasPermission('menu-management.edit') && (
                                <button onClick={() => handleOpenModal(menu)} className="text-blue-600 hover:text-blue-900">
                                    <Edit className="w-4 h-4" />
                                </button>
                            )}
                            {hasPermission('menu-management.delete') && (
                                <button onClick={() => handleDelete(menu.id)} className="text-red-600 hover:text-red-900">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </td>
                </tr>
                {menu.children && menu.children.length > 0 && renderMenuRows(menu.children, depth + 1)}
            </React.Fragment>
        ));
    };

    if (loading) return <div>Loading menus...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Menu Management</h2>
                    <p className="text-sm text-gray-500">Manage dashboard navigation and permission-based visibility.</p>
                </div>
                {hasPermission('menu-management.create') && (
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        <Plus className="w-4 h-4 mr-2" /> Add Menu
                    </button>
                )}
            </div>

            <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permissions Required</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {renderMenuRows(menus)}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <h3 className="text-lg font-bold mb-4">{editingMenu ? 'Edit Menu' : 'Add Menu'}</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Menu Name</label>
                                <input
                                    type="text"
                                    required
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Icon</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    value={formData.icon}
                                    onChange={e => setFormData({...formData, icon: e.target.value})}
                                    placeholder="e.g. users, shield, key"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Parent Menu</label>
                                <select
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    value={formData.parent_id}
                                    onChange={e => setFormData({...formData, parent_id: e.target.value})}
                                >
                                    <option value="">No Parent</option>
                                    {allMenus.filter(m => !editingMenu || m.id !== editingMenu.id).map(menu => (
                                        <option key={menu.id} value={menu.id}>{menu.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Order</label>
                                <input
                                    type="number"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    value={formData.order}
                                    onChange={e => setFormData({...formData, order: parseInt(e.target.value)})}
                                />
                            </div>
                            <div className="flex items-center space-x-2 py-2">
                                <input
                                    type="checkbox"
                                    id="is_hidden"
                                    checked={formData.is_hidden}
                                    onChange={e => setFormData({...formData, is_hidden: e.target.checked})}
                                    className="rounded border-gray-300 text-blue-600"
                                />
                                <label htmlFor="is_hidden" className="text-sm font-medium text-gray-700">
                                    Hide Menu (Only visible to Super Admin)
                                </label>
                            </div>
                            <div className="bg-blue-50 p-3 rounded text-xs text-blue-700 border border-blue-100">
                                <strong>Note:</strong> New menus are hidden by default for security. 
                                A <code>.view</code> permission will be automatically created.
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
                                    {editingMenu ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MenuList;
