import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { setAppLanguage } from '../i18n';
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
    ShieldCheck,
    Languages,
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
    const { i18n } = useTranslation();
    const [openMenus, setOpenMenus] = useState({});
    const [siteName, setSiteName] = useState('Samity Management');
    const [devBy, setDevBy] = useState({ text: '', url: '' });

    useEffect(() => {
        import('../api/axios').then(({ default: api }) => {
            api.get('/site-info').then(res => {
                if (res.data?.site_name) setSiteName(res.data.site_name);
                if (res.data?.developed_by_text) {
                    setDevBy({ text: res.data.developed_by_text, url: res.data.developed_by_url || '#' });
                }
            }).catch(() => {});
        });
    }, []);

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
                        <span className="flex-1 whitespace-nowrap">
                            {i18n.language === 'bn' && menu.name_bn ? menu.name_bn : menu.name}{' '}
                        </span>
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
            <div className="flex justify-center items-center h-16 px-3 text-lg font-bold bg-blue-950 overflow-hidden">
                <span className="text-center leading-tight line-clamp-2">{siteName}</span>
            </div>
            <nav className="overflow-y-auto flex-1 px-2 py-4 space-y-1 scrollbar-hide">
                {menus.map(menu => renderMenuItem(menu))}
            </nav>
            {devBy.text && (
                <div className="px-3 py-2 text-center text-[10px] text-blue-300 bg-blue-950 border-t border-blue-800">
                    Developed By:{' '}
                    <a
                        href={devBy.url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-blue-200 hover:text-white hover:underline"
                    >
                        {devBy.text}
                    </a>
                </div>
            )}
        </div>
    );
};

const LanguageSwitcher = () => {
    const { i18n, t } = useTranslation();
    const { user, updateLanguage } = useAuth();

    const handleChange = async (lang) => {
        if (lang === i18n.language) return;
        setAppLanguage(lang);
        if (user) {
            updateLanguage(lang).catch(() => {});
        }
    };

    return (
        <div className="flex items-center text-sm font-medium text-gray-600" title={t('language.switch')}>
            <Languages className="mr-2 w-5 h-5 text-gray-400" />
            <div className="flex overflow-hidden rounded-md border border-gray-200">
                <button
                    type="button"
                    onClick={() => handleChange('en')}
                    className={`px-2 py-1 ${i18n.language === 'en' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                    EN
                </button>
                <button
                    type="button"
                    onClick={() => handleChange('bn')}
                    className={`px-2 py-1 ${i18n.language === 'bn' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                    বাংলা
                </button>
            </div>
        </div>
    );
};

const TopNavbar = ({ toggleSidebar }) => {
    const { user, logout } = useAuth();
    const { t } = useTranslation();
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
                <h1 className="text-xl font-semibold text-gray-800">{t('nav.dashboard')}</h1>
            </div>
            <div className="flex items-center space-x-4">
                <LanguageSwitcher />
                <div className="flex items-center text-sm font-medium text-gray-700">
                    <UserCircle className="mr-2 w-6 h-6 text-gray-400" />
                    {user?.name}
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center text-sm font-medium text-red-600 hover:text-red-800"
                >
                    <LogOut className="mr-1 w-5 h-5" />
                    {t('nav.logout')}
                </button>
            </div>
        </header>
    );
};

const DashboardLayout = ({ children }) => {
    const { user, menus } = useAuth();
    const [isSidebarOpen, setSidebarOpen] = useState(true);

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

            <Sidebar menus={menus || []} isOpen={isSidebarOpen} />
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
