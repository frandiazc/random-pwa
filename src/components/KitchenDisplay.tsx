import React, { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { pb } from '../lib/pocketbase';
import type { OrderItem } from '../lib/pocketbase';
import { useOrderItems } from '../hooks/useOrderMutations';
import { Clock, CheckCircle2, Flame, AlertCircle } from 'lucide-react';

export default function KitchenDisplay() {
    const { data: orders, isLoading } = useOrderItems();
    const queryClient = useQueryClient();

    // Real-time Subscription
    useEffect(() => {
        // Subscribe to ALL changes in order_items
        pb.collection('order_items').subscribe<OrderItem>('*', (e) => {
            console.log('Real-time event:', e.action, e.record);

            queryClient.setQueryData<OrderItem[]>(['order_items'], (oldData) => {
                if (!oldData) return [];

                switch (e.action) {
                    case 'create':
                        // Add new item to the TOP (since we sort by -created)
                        return [e.record, ...oldData];

                    case 'delete':
                        // Remove item instantly
                        return oldData.filter(item => item.id !== e.record.id);

                    case 'update':
                        // Update existing item
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

    return (
        <div className="bg-slate-900 min-h-screen text-white p-6">
            <header className="flex items-center justify-between mb-8 border-b border-slate-700 pb-4">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <Flame className="text-orange-500" />
                    KDS - Cocina
                </h1>
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    Conectado en tiempo real
                </div>
            </header>

            {isLoading && <p className="text-center text-slate-500">Cargando tickets...</p>}

            {!isLoading && orders?.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 opacity-50">
                    <CheckCircle2 size={64} className="text-slate-600 mb-4" />
                    <p className="text-xl">Todo limpio, Chef.</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {orders?.map((item) => (
                    <div key={item.id} className="bg-slate-800 rounded-lg p-4 border-l-4 border-orange-500 shadow-lg animate-in zoom-in duration-300">
                        <div className="flex justify-between items-start mb-2">
                            <span className="bg-slate-700 text-xs px-2 py-1 rounded text-slate-300">
                                {new Date(item.created).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {/* In a real app, table number would be here */}
                            <span className="font-mono text-orange-400 font-bold">MESA 1</span>
                        </div>

                        <h3 className="text-xl font-bold mb-1">{item.name}</h3>
                        <p className="text-slate-400 text-sm mb-3">Cantidad: <span className="text-white font-bold">{item.quantity}</span></p>

                        {item.notes && (
                            <div className="bg-red-900/30 text-red-200 p-2 rounded text-sm mb-3 flex gap-2 items-start">
                                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                {item.notes}
                            </div>
                        )}

                        <div className="mt-auto pt-4 border-t border-slate-700">
                            <button className="w-full bg-slate-700 hover:bg-green-600 hover:text-white transition py-2 rounded font-medium text-slate-300 text-sm">
                                MARCAR COMPLETADO
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
