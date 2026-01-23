import { useQuery } from '@tanstack/react-query';
import { pb } from '../../lib/pocketbase';
import { useState } from 'react';
import { Search, Monitor, Beer, Printer, CheckCircle } from 'lucide-react';
import type { OrderItem } from '../../lib/pocketbase';

interface Table {
    id: string;
    number: number;
    status: string;
    zone: string;
}

export default function BarInterface() {
    const [selectedTable, setSelectedTable] = useState<string | null>(null);

    // Fetch all tables
    const { data: tables } = useQuery({
        queryKey: ['tables'],
        queryFn: () => pb.collection('tables').getFullList<Table>({ sort: 'number' })
    });

    // Fetch items for selected table
    const { data: tableItems } = useQuery({
        queryKey: ['table_items', selectedTable],
        queryFn: async () => {
            if (!selectedTable) return [];
            return await pb.collection('order_items').getFullList<OrderItem>({
                filter: `table_id = "${selectedTable}"`,
                sort: 'created',
                expand: 'product'
            });
        },
        enabled: !!selectedTable
    });

    const occupiedTables = tables?.filter(t => t.status === 'occupied') || [];

    return (
        <div className="flex h-screen bg-slate-100 overflow-hidden">
            {/* Sidebar Tables List */}
            <div className="w-80 bg-white border-r border-slate-200 flex flex-col">
                <div className="p-4 border-b border-slate-200">
                    <h1 className="text-xl font-bold flex items-center gap-2 text-slate-800">
                        <Beer className="text-amber-500" />
                        Barra / Caja
                    </h1>
                </div>

                <div className="p-3 bg-slate-50 border-b border-slate-200">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar mesa..."
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {occupiedTables.length === 0 ? (
                        <div className="p-8 text-center text-slate-400">
                            No hay mesas ocupadas.
                        </div>
                    ) : (
                        occupiedTables.map(table => (
                            <button
                                key={table.id}
                                onClick={() => setSelectedTable(table.id)}
                                className={`w-full p-4 border-b border-slate-100 flex items-center justify-between hover:bg-slate-50 transition ${selectedTable === table.id ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : ''}`}
                            >
                                <div className="text-left">
                                    <p className="font-bold text-slate-800">Mesa {table.number}</p>
                                    <p className="text-xs text-slate-500">Abierta hace 12m</p>
                                </div>
                                <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
                                    Activa
                                </span>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col">
                {selectedTable ? (
                    <>
                        <header className="bg-white h-16 border-b border-slate-200 flex items-center justify-between px-6">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800">Mesa {tables?.find(t => t.id === selectedTable)?.number}</h2>
                                <span className="text-sm text-slate-400">Ticket #29384</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg font-medium transition">
                                    <Printer size={18} />
                                    Imprimir Pre-cuenta
                                </button>
                                <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg font-bold shadow-lg shadow-indigo-500/20 transition">
                                    <CheckCircle size={18} />
                                    Cobrar Mesa
                                </button>
                            </div>
                        </header>

                        <div className="flex-1 p-6 overflow-y-auto">
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 max-w-3xl mx-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="text-left py-3 px-6 font-semibold text-slate-600">Artículo</th>
                                            <th className="text-center py-3 px-6 font-semibold text-slate-600">Cant.</th>
                                            <th className="text-center py-3 px-6 font-semibold text-slate-600">Estado</th>
                                            <th className="text-right py-3 px-6 font-semibold text-slate-600">Precio</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {tableItems?.map((item) => {
                                            const itemPrice = (item.expand?.product?.price || 0) * item.quantity;
                                            return (
                                                <tr key={item.id} className="hover:bg-slate-50">
                                                    <td className="py-4 px-6">
                                                        <p className="font-medium text-slate-800">{item.name}</p>
                                                        {item.notes && <p className="text-xs text-orange-500 italic">{item.notes}</p>}
                                                    </td>
                                                    <td className="py-4 px-6 text-center font-mono">{item.quantity}</td>
                                                    <td className="py-4 px-6 text-center">
                                                        <span className={`text-xs px-2 py-1 rounded-full font-medium uppercase
                                                            ${item.status === 'served' ? 'bg-green-100 text-green-700' :
                                                                item.status === 'ready' ? 'bg-blue-100 text-blue-700' :
                                                                    'bg-amber-100 text-amber-700'}`}>
                                                            {item.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6 text-right font-mono font-bold">
                                                        {itemPrice.toFixed(2)}€
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot className="bg-slate-50 border-t border-slate-200">
                                        <tr>
                                            <td colSpan={3} className="py-4 px-6 text-right font-medium text-slate-600">Subtotal</td>
                                            <td className="py-4 px-6 text-right font-bold text-slate-800">
                                                {(tableItems?.reduce((sum, item) => sum + ((item.expand?.product?.price || 0) * item.quantity), 0) || 0).toFixed(2)}€
                                            </td>
                                        </tr>
                                        <tr>
                                            <td colSpan={3} className="py-4 px-6 text-right font-medium text-slate-600">IVA (10%) included</td>
                                            <td className="py-4 px-6 text-right font-bold text-slate-800">
                                                {((tableItems?.reduce((sum, item) => sum + ((item.expand?.product?.price || 0) * item.quantity), 0) || 0) - (tableItems?.reduce((sum, item) => sum + ((item.expand?.product?.price || 0) * item.quantity), 0) || 0) / 1.10).toFixed(2)}€
                                            </td>
                                        </tr>
                                        <tr className="bg-slate-100">
                                            <td colSpan={3} className="py-6 px-6 text-right text-lg font-bold text-slate-800">TOTAL</td>
                                            <td className="py-6 px-6 text-right text-2xl font-bold text-indigo-600">
                                                {(tableItems?.reduce((sum, item) => sum + ((item.expand?.product?.price || 0) * item.quantity), 0) || 0).toFixed(2)}€
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                        <Monitor size={64} className="mb-4 opacity-20" />
                        <p className="text-xl font-medium">Selecciona una mesa para gestionar</p>
                    </div>
                )}
            </div>
        </div>
    );
}
