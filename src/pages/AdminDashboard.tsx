import { useAuth } from '../lib/auth';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
    LayoutGrid,
    UtensilsCrossed,
    MapPin,
    Package,
    LogOut,
    ChefHat,
    Menu
} from 'lucide-react';
import { useState } from 'react';
import { clsx } from 'clsx';

const navItems = [
    { path: '/admin', icon: LayoutGrid, label: 'Dashboard', exact: true },
    { path: '/admin/zones', icon: MapPin, label: 'Zonas' },
    { path: '/admin/tables', icon: UtensilsCrossed, label: 'Mesas' },
    { path: '/admin/categories', icon: Package, label: 'Categorías' },
    { path: '/admin/products', icon: ChefHat, label: 'Productos' },
];

export default function AdminDashboard() {
    const { logout } = useAuth();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const isActive = (path: string, exact = false) => {
        if (exact) return location.pathname === path;
        return location.pathname.startsWith(path);
    };

    return (
        <div className="min-h-screen bg-slate-100 flex">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={clsx(
                "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform lg:translate-x-0",
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="p-6 border-b border-slate-700">
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <span className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                            <ChefHat size={20} />
                        </span>
                        Comandero
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Panel de Gestión</p>
                </div>

                <nav className="p-4 space-y-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setSidebarOpen(false)}
                            className={clsx(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition",
                                isActive(item.path, item.exact)
                                    ? "bg-indigo-600 text-white"
                                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                            )}
                        >
                            <item.icon size={20} />
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
                    <button
                        onClick={logout}
                        className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:bg-red-500/20 hover:text-red-400 rounded-xl transition"
                    >
                        <LogOut size={20} />
                        Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 flex flex-col min-h-screen">
                {/* Top bar */}
                <header className="bg-white shadow-sm px-4 py-3 flex items-center gap-4 lg:px-6">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="lg:hidden p-2 hover:bg-slate-100 rounded-lg"
                    >
                        <Menu size={24} />
                    </button>
                    <h2 className="text-lg font-semibold text-slate-800">
                        {navItems.find(i => isActive(i.path, i.exact))?.label || 'Admin'}
                    </h2>
                </header>

                {/* Page content */}
                <main className="flex-1 p-4 lg:p-6 overflow-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
