import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
    LayoutDashboard, 
    Users, 
    ShieldCheck, 
    Menu as MenuIcon, 
    LogOut, 
    ChevronDown, 
    ChevronRight,
    UserCircle,
    Building
} from 'lucide-react';

const Sidebar = ({ menus }) => {
    const location = useLocation();
    const [openMenus, setOpenMenus] = useState({});

    // Keep parent menus open if a child is active
    useEffect(() => {
        const newOpenMenus = { ...openMenus };
        let changed = false;

        const checkActive = (items) => {
            for (const item of items) {
                const path = item.slug === 'dashboard' ? '/dashboard' : `/${item.slug}`;
                if (location.pathname === path || (item.children && checkActive(item.children))) {
                    if (!newOpenMenus[item.slug]) {
                        newOpenMenus[item.slug] = true;
                        changed = true;
                    }
                    return true;
                }
            }
            return false;
        };

        if (menus) {
            checkActive(menus);
            if (changed) {
                setOpenMenus(newOpenMenus);
            }
        }
    }, [location.pathname, menus]);

    const toggleMenu = (e, slug) => {
        e.preventDefault();
        e.stopPropagation();
        setOpenMenus(prev => ({
            ...prev,
            [slug]: !prev[slug]
        }));
    };

    const renderMenuItem = (menu, level = 0) => {
        const hasChildren = menu.children && menu.children.length > 0;
        const isOpen = openMenus[menu.slug];
        const isActive = location.pathname === (menu.slug === 'dashboard' ? '/dashboard' : `/${menu.slug}`);

        return (
            <div key={menu.id}>
                <div className="flex items-center">
                    <Link
                        to={hasChildren ? '#' : (menu.slug === 'dashboard' ? '/dashboard' : `/${menu.slug}`)}
                        onClick={(e) => hasChildren && toggleMenu(e, menu.slug)}
                        className={`flex-1 flex items-center px-4 py-2 text-sm font-medium rounded-md mb-1 transition-colors ${
                            isActive
                            ? 'text-white bg-blue-800'
                            : 'text-blue-100 hover:bg-blue-700'
                        }`}
                        style={{ marginLeft: `${level * 12}px` }}
                    >
                        <span className="mr-3">
                            {/* Simple icon mapping based on slug */}
                            {menu.slug === 'dashboard' && <LayoutDashboard size={20} />}
                            {(menu.slug === 'user-management-system' || menu.slug === 'users') && <Users size={20} />}
                            {menu.slug === 'roles' && <ShieldCheck size={20} />}
                            {menu.slug === 'permissions' && <ShieldCheck size={20} />}
                            {menu.slug === 'menu-management' && <MenuIcon size={20} />}
                            {menu.slug === 'samity-profile' && <Building size={20} />}
                            {!['dashboard', 'user-management-system', 'users', 'roles', 'permissions', 'menu-management', 'samity-profile'].includes(menu.slug) && <ShieldCheck size={20} />}
                        </span>
                        <span className="flex-1">{menu.name} </span>
                    </Link>
                    
                    {hasChildren && (
                        <button
                            onClick={(e) => toggleMenu(e, menu.slug)}
                            className="p-2 text-blue-100 hover:text-white focus:outline-none"
                        >
                            {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>
                    )}
                </div>

                {hasChildren && isOpen && (
                    <div className="space-y-1">
                        {menu.children.map(child => renderMenuItem(child, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-col w-64 min-h-screen text-white bg-blue-900">
            <div className="flex justify-center items-center h-16 text-xl font-bold bg-blue-950">
                RBAC Admin
            </div>
            <nav className="overflow-y-auto flex-1 px-2 py-4 space-y-1">
                {menus.map(menu => renderMenuItem(menu))}
            </nav>
        </div>
    );
};

const TopNavbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const getPageTitle = (pathname) => {
        if (pathname === '/dashboard') return 'Dashboard';
        if (pathname === '/deposit-request') return 'Pending Deposit Requests';
        if (pathname === '/deposit-money') return 'Deposit Money';
        if (pathname === '/samity-profile') return 'Samity Profile';
        if (pathname === '/member-profile') return 'Member Profile';
        if (pathname === '/gl-setup') return 'GL Account Setup';
        if (pathname === '/product-setup') return 'Product Setup';
        
        if (pathname.startsWith('/users') || pathname === '/user-management-system') return 'User Management';
        if (pathname.startsWith('/roles')) return 'Role Management';
        if (pathname.startsWith('/permissions')) return 'Permission Management';
        if (pathname.startsWith('/menu-management')) return 'Menu Management';
        
        return 'Dashboard';
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <header className="flex justify-between items-center px-6 h-16 bg-white shadow-sm">
            <h1 className="text-xl font-semibold text-gray-800">{getPageTitle(location.pathname)}</h1>
            <div className="flex items-center space-x-4">
                <div className="flex items-center text-sm font-medium text-gray-700">
                    <UserCircle className="mr-2 w-6 h-6 text-gray-400" />
                    {user?.name}
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center text-sm font-medium text-red-600 hover:text-red-800"
                >
                    <LogOut className="mr-1 w-5 h-5" />
                    Logout
                </button>
            </div>
        </header>
    );
};

const DashboardLayout = ({ children }) => {
    const { user, menus } = useAuth();

    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar menus={menus || []} />
            <div className="flex overflow-hidden flex-col flex-1">
                <TopNavbar />
                <main className="overflow-y-auto overflow-x-hidden flex-1 p-6 bg-gray-100">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
