import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
    LayoutDashboard, 
    Users, 
    User,
    Shield,
    Key,
    Menu as MenuIcon, 
    Building,
    Building2,
    UserCheck,
    Settings,
    Package,
    BookOpen,
    GitCommit,
    GitBranch,
    Wallet,
    ArrowDownCircle,
    FileInput,
    ArrowUpCircle,
    FileOutput,
    FileText,
    Receipt,
    ScrollText,
    ArrowRightLeft,
    Book,
    Briefcase,
    FilePlus,
    HandCoins,
    CreditCard,
    LogOut, 
    ChevronDown, 
    ChevronRight,
    UserCircle,
    ShieldCheck
} from 'lucide-react';

const iconMap = {
    LayoutDashboard,
    Users,
    User,
    Shield,
    Key,
    Menu: MenuIcon,
    Building,
    Building2,
    UserCheck,
    Settings,
    Package,
    BookOpen,
    GitCommit,
    GitBranch,
    Wallet,
    ArrowDownCircle,
    FileInput,
    ArrowUpCircle,
    FileOutput,
    FileText,
    Receipt,
    ScrollText,
    ArrowRightLeft,
    Book,
    Briefcase,
    FilePlus,
    HandCoins,
    CreditCard,
    ShieldCheck
};

const DynamicIcon = ({ name, size = 20 }) => {
    const IconComponent = iconMap[name] || ShieldCheck; 
    return <IconComponent size={size} />;
};

const Sidebar = ({ menus, isOpen }) => {
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
                        <DynamicIcon name={menu.icon} size={20} />
                    </span>
                        <span className="flex-1 whitespace-nowrap">{menu.name} </span>
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
        <div className={`
            flex flex-col min-h-screen text-white bg-blue-900
            transition-all duration-300 ease-in-out
            fixed md:relative z-30 inset-y-0 left-0
            ${isOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64 md:w-0 md:translate-x-0 md:overflow-hidden'}
        `}>
            <div className="flex justify-center items-center h-16 text-xl font-bold bg-blue-950 whitespace-nowrap overflow-hidden">
                RBAC Admin
            </div>
            <nav className="overflow-y-auto flex-1 px-2 py-4 space-y-1 scrollbar-hide">
                {menus.map(menu => renderMenuItem(menu))}
            </nav>
        </div>
    );
};

const TopNavbar = ({ toggleSidebar }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <header className="flex justify-between items-center px-6 h-16 bg-white shadow-sm">
            <div className="flex items-center">
                <button 
                    onClick={toggleSidebar} 
                    className="mr-4 text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                    <MenuIcon size={24} />
                </button>
                <h1 className="text-xl font-semibold text-gray-800">Dashboard</h1>
            </div>
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
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const mergedMenus = React.useMemo(() => {
        const hrMenu = {
            id: -100,
            name: 'HR',
            slug: 'hr',
            icon: 'Briefcase',
            children: [
                { id: -101, name: 'HR Dashboard', slug: 'hr-dashboard', icon: 'LayoutDashboard' },
                { id: -102, name: 'Employees', slug: 'hr/employees', icon: 'Users' },
                { id: -106, name: 'Attendance', slug: 'hr/attendance', icon: 'UserCheck' },
                { id: -107, name: 'Leaves', slug: 'hr/leaves', icon: 'FileText' },
                { id: -103, name: 'Payroll', slug: 'hr/payroll', icon: 'Wallet' },
                { id: -104, name: 'HR Settings', slug: 'hr/settings', icon: 'Settings' },
                { id: -105, name: 'Audit Logs', slug: 'hr/audit-logs', icon: 'ScrollText' }
            ]
        };
        const exists = (menus || []).some(m => m.slug === 'hr');
        return exists ? (menus || []) : ([...(menus || []), hrMenu]);
    }, [menus]);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setSidebarOpen(false);
            } else {
                setSidebarOpen(true);
            }
        };

        // Initial check
        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden">
             {/* Mobile Overlay */}
             {isSidebarOpen && (
                <div 
                    className="fixed inset-0 z-20 bg-black bg-opacity-50 md:hidden" 
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}

            <Sidebar menus={mergedMenus || []} isOpen={isSidebarOpen} />
            <div className="flex overflow-hidden flex-col flex-1">
                <TopNavbar toggleSidebar={() => setSidebarOpen(!isSidebarOpen)} />
                <main className="overflow-y-auto overflow-x-hidden flex-1 p-6 bg-gray-100">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
