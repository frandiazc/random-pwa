import { MapPin, UtensilsCrossed, Package, ChefHat, TrendingUp, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { pb } from '../../lib/pocketbase';
import { Link } from 'react-router-dom';

export default function DashboardHome() {
    const { data: zones } = useQuery({
        queryKey: ['zones'],
        queryFn: () => pb.collection('zones').getFullList()
    });

    const { data: tables } = useQuery({
        queryKey: ['tables'],
        queryFn: () => pb.collection('tables').getFullList()
    });

    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: () => pb.collection('categories').getFullList()
    });

    const { data: products } = useQuery({
        queryKey: ['products'],
        queryFn: () => pb.collection('products').getFullList()
    });

    const { data: pendingOrders } = useQuery({
        queryKey: ['pending_orders'],
        queryFn: () => pb.collection('order_items').getList(1, 10, {
            filter: "status = 'pending'",
            sort: '-created'
        })
    });

    const stats = [
        { label: 'Zonas', value: zones?.length || 0, icon: MapPin, color: 'bg-blue-500', link: '/admin/zones' },
        { label: 'Mesas', value: tables?.length || 0, icon: UtensilsCrossed, color: 'bg-green-500', link: '/admin/tables' },
        { label: 'Categorías', value: categories?.length || 0, icon: Package, color: 'bg-purple-500', link: '/admin/categories' },
        { label: 'Productos', value: products?.length || 0, icon: ChefHat, color: 'bg-orange-500', link: '/admin/products' },
    ];

    return (
        <div className="space-y-6">
            {/* Stats grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => (
                    <Link
                        key={stat.label}
                        to={stat.link}
                        className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition group"
                    >
                        <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center text-white mb-4`}>
                            <stat.icon size={24} />
                        </div>
                        <p className="text-3xl font-bold text-slate-800">{stat.value}</p>
                        <p className="text-slate-500 text-sm">{stat.label}</p>
                    </Link>
                ))}
            </div>

            {/* Quick actions */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Pending orders */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                        <h3 className="font-semibold flex items-center gap-2">
                            <Clock size={20} className="text-orange-500" />
                            Pedidos Pendientes
                        </h3>
                        <span className="bg-orange-100 text-orange-600 px-2 py-1 rounded-full text-sm font-medium">
                            {pendingOrders?.totalItems || 0}
                        </span>
                    </div>
                    <div className="p-4">
                        {pendingOrders?.items && pendingOrders.items.length > 0 ? (
                            <div className="space-y-2">
                                {pendingOrders.items.slice(0, 5).map((order) => (
                                    <div key={order.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                                        <span className="font-medium">{order['name'] as string}</span>
                                        <span className="text-sm text-slate-500">x{order['quantity'] as number}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-slate-400 text-center py-4">No hay pedidos pendientes</p>
                        )}
                    </div>
                </div>

                {/* Quick links */}
                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl p-6 text-white">
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                        <TrendingUp size={24} />
                        Accesos Rápidos
                    </h3>
                    <div className="space-y-3">
                        <a
                            href="/waiter"
                            target="_blank"
                            className="block bg-white/20 hover:bg-white/30 rounded-xl p-4 transition"
                        >
                            <p className="font-medium">📱 Abrir Comandero</p>
                            <p className="text-sm text-indigo-200">App para camareros</p>
                        </a>
                        <a
                            href="/kitchen"
                            target="_blank"
                            className="block bg-white/20 hover:bg-white/30 rounded-xl p-4 transition"
                        >
                            <p className="font-medium">🍳 Abrir Cocina (KDS)</p>
                            <p className="text-sm text-indigo-200">Pantalla de cocina</p>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
