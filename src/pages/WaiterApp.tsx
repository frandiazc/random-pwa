import { useQuery } from '@tanstack/react-query';
import { pb } from '../lib/pocketbase';
import { useNavigate } from 'react-router-dom';
import { Users, Clock, ChefHat } from 'lucide-react';
import { clsx } from 'clsx';

interface Zone {
    id: string;
    name: string;
    color: string;
}

interface Table {
    id: string;
    number: number;
    zone: string;
    status: 'free' | 'occupied' | 'reserved';
    capacity: number;
}

export default function WaiterApp() {
    const navigate = useNavigate();

    const { data: zones } = useQuery({
        queryKey: ['zones'],
        queryFn: () => pb.collection('zones').getFullList<Zone>()
    });

    const { data: tables } = useQuery({
        queryKey: ['tables'],
        queryFn: () => pb.collection('tables').getFullList<Table>({ sort: 'number' })
    });

    const handleTableSelect = (table: Table) => {
        navigate(`/waiter/table/${table.id}`);
    };

    const statusConfig = {
        free: { bg: 'bg-green-500', text: 'Libre', icon: null },
        occupied: { bg: 'bg-red-500', text: 'Ocupada', icon: <Clock size={14} /> },
        reserved: { bg: 'bg-amber-500', text: 'Reservada', icon: null }
    };

    return (
        <div className="min-h-screen bg-slate-100">
            {/* Mobile header */}
            <header className="bg-indigo-600 text-white px-4 py-4 sticky top-0 z-10 shadow-lg">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <ChefHat size={28} />
                        <div>
                            <h1 className="font-bold text-lg">Comandero</h1>
                            <p className="text-indigo-200 text-xs">Selecciona una mesa</p>
                        </div>
                    </div>
                    <a
                        href="/kitchen"
                        target="_blank"
                        className="px-3 py-2 bg-white/20 rounded-lg text-sm hover:bg-white/30 transition"
                    >
                        KDS
                    </a>
                </div>
            </header>

            {/* Zones and tables */}
            <div className="p-4 space-y-6 pb-20">
                {zones?.map((zone) => {
                    const zoneTables = tables?.filter(t => t.zone === zone.id) || [];
                    if (zoneTables.length === 0) return null;

                    return (
                        <section key={zone.id}>
                            <div className="flex items-center gap-2 mb-3">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: zone.color }}
                                />
                                <h2 className="font-semibold text-slate-700">{zone.name}</h2>
                                <span className="text-sm text-slate-400">({zoneTables.length})</span>
                            </div>

                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                                {zoneTables.map((table) => (
                                    <button
                                        key={table.id}
                                        onClick={() => handleTableSelect(table)}
                                        className={clsx(
                                            "relative bg-white rounded-xl p-4 shadow-sm border-2 transition-all active:scale-95",
                                            table.status === 'free' && "border-green-300 hover:border-green-500",
                                            table.status === 'occupied' && "border-red-300 hover:border-red-500",
                                            table.status === 'reserved' && "border-amber-300 hover:border-amber-500"
                                        )}
                                    >
                                        {/* Status indicator */}
                                        <div className={clsx(
                                            "absolute top-2 right-2 w-3 h-3 rounded-full",
                                            statusConfig[table.status].bg
                                        )} />

                                        <div className="text-center">
                                            <p className="text-3xl font-bold text-slate-800">{table.number}</p>
                                            <div className="flex items-center justify-center gap-1 text-xs text-slate-500 mt-1">
                                                <Users size={12} />
                                                {table.capacity}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </section>
                    );
                })}

                {(!zones || zones.length === 0) && (
                    <div className="text-center py-12 text-slate-400">
                        <p>No hay zonas configuradas.</p>
                        <a href="/admin" className="text-indigo-500 hover:underline">Ir al Admin</a>
                    </div>
                )}
            </div>
        </div>
    );
}
