import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { pb } from '../lib/pocketbase';
import type { OrderItem } from '../lib/pocketbase';
import { useOrderItems } from '../hooks/useOrderMutations';
import { CheckCircle2, Flame, AlertCircle, Clock, ChefHat, Zap } from 'lucide-react';
import { clsx } from 'clsx';

export default function KitchenDisplay() {
    const { data: orders, isLoading } = useOrderItems();
    const queryClient = useQueryClient();
    const [currentTime, setCurrentTime] = useState(new Date());

    // Update clock every second
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Real-time Subscription
    useEffect(() => {
        pb.collection('order_items').subscribe<OrderItem>('*', (e) => {
            console.log('Real-time event:', e.action, e.record);

            // Play sound on new order
            if (e.action === 'create') {
                try {
                    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                    audio.volume = 0.5;
                    audio.play().catch(() => { });
                } catch { }
            }

            queryClient.setQueryData<OrderItem[]>(['order_items'], (oldData) => {
                if (!oldData) return [];

                switch (e.action) {
                    case 'create':
                        return [e.record, ...oldData];
                    case 'delete':
                        return oldData.filter(item => item.id !== e.record.id);
                    case 'update':
                        return oldData.map(item => item.id === e.record.id ? e.record : item);
                    default:
                        return oldData;
                }
            });
        });

        return () => {
            pb.collection('order_items').unsubscribe('*');
        };
    }, [queryClient]);

    const pendingOrders = orders?.filter(o => o.status === 'pending') || [];
    const cookingOrders = orders?.filter(o => o.status === 'cooking') || [];

    const updateStatus = async (id: string, status: string) => {
        await pb.collection('order_items').update(id, { status });
        queryClient.invalidateQueries({ queryKey: ['order_items'] });
    };

    const getElapsedTime = (created: string) => {
        const diff = Math.floor((currentTime.getTime() - new Date(created).getTime()) / 1000);
        const mins = Math.floor(diff / 60);
        const secs = diff % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getUrgencyColor = (created: string) => {
        const diff = Math.floor((currentTime.getTime() - new Date(created).getTime()) / 1000 / 60);
        if (diff >= 10) return 'border-red-500 bg-red-500/10';
        if (diff >= 5) return 'border-amber-500 bg-amber-500/10';
        return 'border-orange-500';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
            {/* Header */}
            <header className="bg-black/30 backdrop-blur-sm border-b border-white/10 px-6 py-4 sticky top-0 z-10">
                <div className="flex items-center justify-between max-w-[1800px] mx-auto">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                            <Flame size={28} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Cocina</h1>
                            <p className="text-slate-400 text-sm">Kitchen Display System</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-2 bg-orange-500/20 text-orange-400 px-3 py-2 rounded-lg">
                                <Clock size={16} />
                                <span className="font-mono">{pendingOrders.length} pendientes</span>
                            </div>
                            <div className="flex items-center gap-2 bg-blue-500/20 text-blue-400 px-3 py-2 rounded-lg">
                                <ChefHat size={16} />
                                <span className="font-mono">{cookingOrders.length} preparando</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-3xl font-mono font-bold">{currentTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</p>
                            <div className="flex items-center gap-2 text-green-400 text-xs">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                En tiempo real
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {isLoading && (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
                </div>
            )}

            {!isLoading && pendingOrders.length === 0 && cookingOrders.length === 0 && (
                <div className="flex flex-col items-center justify-center py-32 opacity-50">
                    <CheckCircle2 size={80} className="text-green-500 mb-6" />
                    <p className="text-3xl font-bold">Todo al día, Chef</p>
                    <p className="text-slate-400 mt-2">No hay pedidos pendientes</p>
                </div>
            )}

            {/* Orders Grid */}
            <div className="p-6 max-w-[1800px] mx-auto">
                {pendingOrders.length > 0 && (
                    <section className="mb-8">
                        <h2 className="text-lg font-semibold text-orange-400 mb-4 flex items-center gap-2">
                            <Zap size={20} />
                            NUEVOS PEDIDOS
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {pendingOrders.map((item) => (
                                <div
                                    key={item.id}
                                    className={clsx(
                                        "bg-slate-800/80 backdrop-blur rounded-2xl p-5 border-l-4 shadow-xl transition-all hover:scale-[1.02] animate-in slide-in-from-top duration-300",
                                        getUrgencyColor(item.created)
                                    )}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <span className="bg-slate-700 text-xs px-3 py-1 rounded-full text-slate-300 font-mono">
                                            {new Date(item.created).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        <span className="font-mono text-orange-400 font-bold text-lg">
                                            MESA {item.table_id ? '?' : '1'}
                                        </span>
                                    </div>

                                    <h3 className="text-2xl font-bold mb-2">{item.name}</h3>

                                    <div className="flex items-center gap-4 mb-4">
                                        <span className="text-4xl font-bold text-white">x{item.quantity}</span>
                                        <div className="flex items-center gap-1 text-amber-400 font-mono">
                                            <Clock size={14} />
                                            {getElapsedTime(item.created)}
                                        </div>
                                    </div>

                                    {item.notes && (
                                        <div className="bg-red-900/40 border border-red-500/30 text-red-200 p-3 rounded-xl text-sm mb-4 flex gap-2 items-start">
                                            <AlertCircle size={18} className="mt-0.5 shrink-0" />
                                            <span className="font-medium">{item.notes}</span>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => updateStatus(item.id, 'cooking')}
                                        className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <ChefHat size={20} />
                                        PREPARANDO
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {cookingOrders.length > 0 && (
                    <section>
                        <h2 className="text-lg font-semibold text-blue-400 mb-4 flex items-center gap-2">
                            <ChefHat size={20} />
                            EN PREPARACIÓN
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {cookingOrders.map((item) => (
                                <div
                                    key={item.id}
                                    className="bg-blue-900/30 backdrop-blur rounded-2xl p-5 border-l-4 border-blue-500 shadow-xl"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <span className="bg-blue-800/50 text-xs px-3 py-1 rounded-full text-blue-300 font-mono">
                                            {new Date(item.created).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        <span className="font-mono text-blue-400 font-bold">
                                            MESA {item.table_id ? '?' : '1'}
                                        </span>
                                    </div>

                                    <h3 className="text-xl font-bold mb-2">{item.name}</h3>
                                    <p className="text-blue-300 mb-4">x{item.quantity}</p>

                                    <button
                                        onClick={() => updateStatus(item.id, 'ready')}
                                        className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle2 size={20} />
                                        ¡LISTO!
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
