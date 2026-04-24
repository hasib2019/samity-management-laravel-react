import React, { useState, useEffect, useMemo } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Plus, Edit, Trash2, Search, X, Folder, Shield, ChevronDown, ChevronRight, Lock } from 'lucide-react';
import { showSuccessToast, showErrorToast, confirmDelete } from '../../utils/sweetAlert';
import LoadingButton from '../../components/LoadingButton';

const PermissionList = () => {
    const [permissions, setPermissions] = useState([]);
    const [menus, setMenus] = useState([]);
    const [menuTree, setMenuTree] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPermission, setEditingPermission] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        menu_id: ''
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [expandedMenus, setExpandedMenus] = useState({});

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
            // Store raw tree for display
            setMenuTree(response.data);

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
        setSubmitting(true);
        try {
            if (editingPermission) {
                await api.put(`/permissions/${editingPermission.id}`, formData);
                showSuccessToast('Permission updated successfully');
            } else {
                await api.post('/permissions', formData);
                showSuccessToast('Permission created successfully');
            }
            setIsModalOpen(false);
            fetchPermissions();
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
                    await api.delete(`/permissions/${id}`);
                    fetchPermissions();
                    showSuccessToast('Permission deleted successfully');
                } catch (error) {
                    showErrorToast(error.response?.data?.message || 'Failed to delete');
                }
            }
        });
    };

    // Group permissions by Menu ID
    const permissionsByMenu = useMemo(() => {
        const grouped = {};
        const generalPermissions = [];

        permissions.forEach(permission => {
            // Filter by search term
            if (searchTerm) {
                const searchLower = searchTerm.toLowerCase();
                const matchName = permission.name.toLowerCase().includes(searchLower);
                const matchSlug = permission.slug.toLowerCase().includes(searchLower);
                const matchMenu = permission.menu?.name.toLowerCase().includes(searchLower);
                
                if (!matchName && !matchSlug && !matchMenu) return;
            }

            if (permission.menu_id) {
                if (!grouped[permission.menu_id]) {
                    grouped[permission.menu_id] = [];
                }
                grouped[permission.menu_id].push(permission);
            } else {
                generalPermissions.push(permission);
            }
        });

        return { grouped, generalPermissions };
    }, [permissions, searchTerm]);

    const toggleMenu = (menuId) => {
        setExpandedMenus(prev => ({
            ...prev,
            [menuId]: !prev[menuId]
        }));
    };

    // Initialize expanded state when data loads
    useEffect(() => {
        const initialExpanded = {};
        const expandAll = (items) => {
            items.forEach(item => {
                initialExpanded[item.id] = true;
                if (item.children) expandAll(item.children);
            });
        };
        expandAll(menuTree);
        setExpandedMenus(initialExpanded);
    }, [menuTree]);

    // Recursive Menu Component
    const PermissionNode = ({ menu, level = 0 }) => {
        const menuPermissions = permissionsByMenu.grouped[menu.id] || [];
        const hasChildren = (menu.children && menu.children.length > 0) || menuPermissions.length > 0;
        const isExpanded = expandedMenus[menu.id];

        // Skip if no children and no permissions (and searching/filtering might hide empty nodes)
        // Note: You might want to show empty menus if you want to allow adding permissions to them.
        // But for "Tree View" usually we show structure.
        
        return (
            <div className="mb-2">
                <div 
                    className={`flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${level > 0 ? 'ml-6' : ''}`}
                    onClick={() => toggleMenu(menu.id)}
                >
                    <div className="flex flex-1 items-center">
                        {hasChildren ? (
                            isExpanded ? <ChevronDown className="mr-2 w-4 h-4 text-gray-500" /> : <ChevronRight className="mr-2 w-4 h-4 text-gray-500" />
                        ) : <span className="w-6"></span>}
                        
                        <Folder className={`w-5 h-5 mr-2 ${level === 0 ? 'text-blue-600' : 'text-gray-500'}`} />
                        <span className={`font-medium ${level === 0 ? 'text-gray-800' : 'text-gray-700'}`}>{menu.name}</span>
                        
                        {menuPermissions.length > 0 && (
                            <span className="ml-2 bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">
                                {menuPermissions.length} permissions
                            </span>
                        )}
                    </div>
                </div>

                {isExpanded && (
                    <div className={`mt-2 ${level > 0 ? 'ml-6 border-l-2 border-gray-100 pl-4' : ''}`}>
                        {/* Render Permissions */}
                        {menuPermissions.length > 0 && (
                            <div className="grid grid-cols-1 gap-4 pl-4 mb-4 md:grid-cols-2 lg:grid-cols-3">
                                {menuPermissions.map(permission => (
                                    <div key={permission.id} className="flex justify-between items-start p-3 bg-white rounded-lg border border-gray-100 shadow-sm transition-shadow hover:shadow-md group">
                                        <div className="flex items-start">
                                            <Lock className="mt-1 mr-2 w-4 h-4 text-gray-400" />
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-900">{permission.name}</h4>
                                                <code className="text-xs text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200 mt-1 inline-block">
                                                    {permission.slug}
                                                </code>
                                            </div>
                                        </div>
                                        <div className="flex space-x-1 opacity-0 transition-opacity group-hover:opacity-100">
                                            {hasPermission('permission.edit') && (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleOpenModal(permission); }}
                                                    className="p-1 text-blue-600 rounded hover:bg-blue-50"
                                                >
                                                    <Edit className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                            {hasPermission('permission.delete') && (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(permission.id); }}
                                                    className="p-1 text-red-600 rounded hover:bg-red-50"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Render Children Menus */}
                        {menu.children && menu.children.map(childMenu => (
                            <PermissionNode key={childMenu.id} menu={childMenu} level={level + 1} />
                        ))}
                    </div>
                )}
            </div>
        );
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="w-12 h-12 rounded-full border-b-2 border-blue-600 animate-spin"></div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 justify-between items-center sm:flex-row">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Permission Management</h2>
                    <p className="mt-1 text-sm text-gray-500">Manage system permissions organized by module</p>
                </div>
                {hasPermission('permission.create') && (
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center px-4 py-2 text-white bg-blue-600 rounded-lg shadow-sm transition-colors hover:bg-blue-700"
                    >
                        <Plus className="mr-2 w-4 h-4" /> Add Permission
                    </button>
                )}
            </div>

            {/* Search Bar */}
            <div className="relative max-w-md">
                <div className="flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none">
                    <Search className="w-4 h-4 text-gray-400" />
                </div>
                <input
                    type="text"
                    className="block py-2 pr-3 pl-10 w-full leading-5 placeholder-gray-400 bg-white rounded-lg border border-gray-200 shadow-sm transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Search permissions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="space-y-4">
                {/* General Permissions (No Menu) */}
                {permissionsByMenu.generalPermissions.length > 0 && (
                    <div className="mb-6">
                        <div className="flex items-center px-4 py-2 mb-4 bg-gray-50 rounded-lg border border-gray-200">
                            <Shield className="mr-2 w-5 h-5 text-gray-500" />
                            <h3 className="font-semibold text-gray-700">General Permissions</h3>
                            <span className="ml-auto bg-gray-200 text-gray-600 text-xs font-medium px-2 py-0.5 rounded-full">
                                {permissionsByMenu.generalPermissions.length}
                            </span>
                        </div>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {permissionsByMenu.generalPermissions.map(permission => (
                                <div key={permission.id} className="flex justify-between items-start p-3 bg-white rounded-lg border border-gray-100 shadow-sm transition-shadow hover:shadow-md group">
                                    <div className="flex items-start">
                                        <Lock className="mt-1 mr-2 w-4 h-4 text-gray-400" />
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-900">{permission.name}</h4>
                                            <code className="text-xs text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200 mt-1 inline-block">
                                                {permission.slug}
                                            </code>
                                        </div>
                                    </div>
                                    <div className="flex space-x-1 opacity-0 transition-opacity group-hover:opacity-100">
                                        {hasPermission('permission.edit') && (
                                            <button 
                                                onClick={() => handleOpenModal(permission)}
                                                className="p-1 text-blue-600 rounded hover:bg-blue-50"
                                            >
                                                <Edit className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                        {hasPermission('permission.delete') && (
                                            <button 
                                                onClick={() => handleDelete(permission.id)}
                                                className="p-1 text-red-600 rounded hover:bg-red-50"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Recursive Tree View */}
                {menuTree.map(menu => (
                    <PermissionNode key={menu.id} menu={menu} />
                ))}
            </div>

            {Object.keys(permissionsByMenu.grouped).length === 0 && permissionsByMenu.generalPermissions.length === 0 && (
                <div className="py-12 text-center bg-white rounded-xl border border-gray-300 border-dashed">
                    <Shield className="mx-auto w-12 h-12 text-gray-300" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No permissions found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Get started by creating a new permission.
                    </p>
                    {hasPermission('permission.create') && (
                        <div className="mt-6">
                            <button
                                onClick={() => handleOpenModal()}
                                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md border border-transparent shadow-sm hover:bg-blue-700"
                            >
                                <Plus className="mr-2 -ml-1 w-5 h-5" aria-hidden="true" />
                                Add Permission
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex justify-center items-center px-4 pt-4 pb-20 min-h-screen text-center sm:block sm:p-0">
                        {/* Overlay - semi-transparent background */}
                        <div 
                            className="fixed inset-0 backdrop-blur-sm transition-opacity bg-black/50" 
                            aria-hidden="true" 
                            onClick={() => setIsModalOpen(false)}
                        ></div>

                        {/* This element is to trick the browser into centering the modal contents. */}
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                        {/* Modal Panel */}
                        <div className="relative inline-block overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full z-[101]">
                            <form onSubmit={handleSubmit}>
                                <div className="px-4 pt-5 pb-4 bg-white sm:p-6 sm:pb-4">
                                    <div className="flex justify-between items-start">
                                        <h3 className="text-lg font-medium leading-6 text-gray-900" id="modal-title">
                                            {editingPermission ? 'Edit Permission' : 'Add New Permission'}
                                        </h3>
                                        <button
                                            type="button"
                                            onClick={() => setIsModalOpen(false)}
                                            className="text-gray-400 bg-white rounded-md hover:text-gray-500 focus:outline-none"
                                        >
                                            <span className="sr-only">Close</span>
                                            <X className="w-6 h-6" aria-hidden="true" />
                                        </button>
                                    </div>
                                    <div className="mt-4 space-y-4">
                                        <div>
                                            <label className="block mb-1 text-sm font-medium text-gray-700">Permission Name</label>
                                            <input
                                                type="text"
                                                required
                                                className="block p-2 w-full rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                value={formData.name}
                                                onChange={e => setFormData({...formData, name: e.target.value})}
                                                placeholder="e.g. View Users"
                                            />
                                        </div>
                                        <div>
                                            <label className="block mb-1 text-sm font-medium text-gray-700">Slug</label>
                                            <input
                                                type="text"
                                                required
                                                className="block p-2 w-full rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                value={formData.slug}
                                                onChange={e => setFormData({...formData, slug: e.target.value})}
                                                placeholder="e.g. user.view"
                                            />
                                        </div>
                                        <div>
                                            <label className="block mb-1 text-sm font-medium text-gray-700">Menu</label>
                                            <select
                                                className="block p-2 w-full rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                value={formData.menu_id}
                                                onChange={e => setFormData({...formData, menu_id: e.target.value})}
                                            >
                                                <option value="">Select Menu</option>
                                                {menus.map(menu => (
                                                    <option key={menu.id} value={menu.id}>{menu.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div className="px-4 py-3 bg-gray-50 sm:px-6 sm:flex sm:flex-row-reverse">
                                    <LoadingButton
                                        type="submit"
                                        isLoading={submitting}
                                        loadingText={editingPermission ? 'Updating...' : 'Creating...'}
                                        className="px-4 py-2 w-full text-base font-medium text-white bg-blue-600 rounded-md border border-transparent shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                                    >
                                        {editingPermission ? 'Update' : 'Create'}
                                    </LoadingButton>
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="inline-flex justify-center px-4 py-2 mt-3 w-full text-base font-medium text-gray-700 bg-white rounded-md border border-gray-300 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PermissionList;
