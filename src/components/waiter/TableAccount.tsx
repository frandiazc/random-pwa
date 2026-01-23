import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pb } from '../../lib/pocketbase';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Banknote, Trash2, PlusCircle, Printer } from 'lucide-react';
import type { OrderItem } from '../../lib/pocketbase';

export default function TableAccount() {
    const { tableId } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: table } = useQuery({
        queryKey: ['table', tableId],
        queryFn: () => pb.collection('tables').getOne(tableId!)
    });

    // Fetch ALL items for this table that are not paid/cancelled
    const { data: items } = useQuery({
        queryKey: ['table_items', tableId],
        queryFn: async () => {
            return await pb.collection('order_items').getFullList<OrderItem>({
                filter: `table_id = "${tableId}" && status != 'cancelled'`,
                sort: 'created'
            });
        }
    });

    const removeItem = useMutation({
        mutationFn: (id: string) => pb.collection('order_items').delete(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['table_items', tableId] })
    });

    const closeTable = useMutation({
        mutationFn: async () => {
            // In a real app we would mark orders as Paid/Closed
            // For now, we just delete them to reset the demo
            const promises = items?.map(item => pb.collection('order_items').delete(item.id)) || [];
            await Promise.all(promises);

            // Free the table
            await pb.collection('tables').update(tableId!, { status: 'free' });
        },
        onSuccess: () => navigate('/waiter')
    });

    const total = items?.reduce((sum) => {
        // We'd need to fetch prices, assuming we store price snapshot or fetch product
        // For this demo, let's assume we need to join products or have price.
        // Quick fix: Let's refetch product details or assume a fixed price map for now if not expanded.
        // Ideally: expand='product' in query.
        return sum + (0); // Placeholder until we fix expansion
    }, 0) || 0;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <header className="bg-white px-4 py-4 border-b border-slate-200 sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/waiter')} className="p-2 hover:bg-slate-100 rounded-lg">
                        <ArrowLeft size={24} />
                    </button>
                    <div className="flex-1">
                        <h1 className="font-bold text-lg">Mesa {table?.number} - Cuenta</h1>
                        <p className="text-slate-500 text-xs">Gestión de ticket</p>
                    </div>
                </div>
            </header>

            <div className="flex-1 p-4">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <span className="font-semibold text-slate-700">Artículos</span>
                        <span className="text-sm text-slate-400">{items?.length || 0} total</span>
                    </div>

                    <div className="divide-y divide-slate-100">
                        {items?.map((item) => (
                            <div key={item.id} className="p-4 flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-800">{item.quantity}x</span>
                                        <span className="font-medium">{item.name}</span>
                                    </div>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 capitalize mt-1 inline-block">
                                        {item.status}
                                    </span>
                                </div>
                                <button
                                    onClick={() => window.confirm('¿Borrar artículo?') && removeItem.mutate(item.id)}
                                    className="p-2 text-red-300 hover:text-red-500 transition"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>

                    {items?.length === 0 && (
                        <div className="p-8 text-center text-slate-400">
                            La mesa está vacía.
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                    <button className="flex flex-col items-center justify-center p-4 bg-white border border-slate-200 rounded-xl gap-2 active:bg-slate-50">
                        <Printer size={24} className="text-slate-600" />
                        <span className="text-sm font-medium">Imprimir Ticket</span>
                    </button>
                    <button
                        onClick={() => navigate(`/waiter/table/${tableId}`)}
                        className="flex flex-col items-center justify-center p-4 bg-white border border-slate-200 rounded-xl gap-2 active:bg-slate-50"
                    >
                        <PlusCircle size={24} className="text-indigo-600" />
                        <span className="text-sm font-medium">Añadir más</span>
                    </button>
                </div>
            </div>

            <div className="bg-white border-t border-slate-200 p-4 space-y-3 pb-8">
                <div className="flex justify-between items-end mb-2">
                    <span className="text-slate-500 font-medium">Total a pagar</span>
                    <span className="text-3xl font-bold text-slate-900">{total.toFixed(2)}€</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => closeTable.mutate()}
                        className="py-3 px-4 bg-green-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition"
                    >
                        <Banknote size={20} />
                        Efectivo
                    </button>
                    <button
                        onClick={() => closeTable.mutate()}
                        className="py-3 px-4 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition"
                    >
                        <CreditCard size={20} />
                        Tarjeta
                    </button>
                </div>
            </div>
        </div>
    );
}
