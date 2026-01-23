import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pb } from '../../lib/pocketbase';
import { Plus, Trash2, Edit2, Save, X, UtensilsCrossed } from 'lucide-react';
import { useState } from 'react';

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
    expand?: {
        zone?: Zone;
    };
}

export default function TableManager() {
    const queryClient = useQueryClient();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newTable, setNewTable] = useState({ number: 1, zone: '', capacity: 4 });
    const [editData, setEditData] = useState({ number: 1, zone: '', capacity: 4 });

    const { data: zones } = useQuery({
        queryKey: ['zones'],
        queryFn: () => pb.collection('zones').getFullList<Zone>()
    });

    const { data: tables, isLoading } = useQuery({
        queryKey: ['tables'],
        queryFn: () => pb.collection('tables').getFullList<Table>({
            expand: 'zone',
            sort: 'number'
        })
    });

    const createTable = useMutation({
        mutationFn: (data: { number: number; zone: string; capacity: number; status: string }) =>
            pb.collection('tables').create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tables'] });
            setNewTable({ number: (newTable.number + 1), zone: newTable.zone, capacity: 4 });
        }
    });

    const updateTable = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Table> }) =>
            pb.collection('tables').update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tables'] });
            setEditingId(null);
        }
    });

    const deleteTable = useMutation({
        mutationFn: (id: string) => pb.collection('tables').delete(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tables'] })
    });

    const handleEdit = (table: Table) => {
        setEditingId(table.id);
        setEditData({ number: table.number, zone: table.zone, capacity: table.capacity });
    };

    const handleSave = () => {
        if (editingId) {
            updateTable.mutate({ id: editingId, data: editData });
        }
    };

    const statusColors = {
        free: 'bg-green-100 text-green-700',
        occupied: 'bg-red-100 text-red-700',
        reserved: 'bg-amber-100 text-amber-700'
    };

    return (
        <div className="space-y-6">
            {/* Create new table */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Plus size={20} className="text-indigo-600" />
                    Nueva Mesa
                </h3>
                <div className="flex flex-wrap gap-4 items-end">
                    <div>
                        <label className="block text-sm text-slate-600 mb-1">Número</label>
                        <input
                            type="number"
                            min="1"
                            value={newTable.number}
                            onChange={(e) => setNewTable({ ...newTable, number: parseInt(e.target.value) })}
                            className="w-20 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-slate-600 mb-1">Zona</label>
                        <select
                            value={newTable.zone}
                            onChange={(e) => setNewTable({ ...newTable, zone: e.target.value })}
                            className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">Seleccionar...</option>
                            {zones?.map((zone) => (
                                <option key={zone.id} value={zone.id}>{zone.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-slate-600 mb-1">Capacidad</label>
                        <input
                            type="number"
                            min="1"
                            value={newTable.capacity}
                            onChange={(e) => setNewTable({ ...newTable, capacity: parseInt(e.target.value) })}
                            className="w-20 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <button
                        onClick={() => newTable.zone && createTable.mutate({ ...newTable, status: 'free' })}
                        disabled={!newTable.zone || createTable.isPending}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition flex items-center gap-2"
                    >
                        <Plus size={18} />
                        Crear
                    </button>
                </div>
            </div>

            {/* Tables grid by zone */}
            {zones?.map((zone) => {
                const zoneTables = tables?.filter(t => t.zone === zone.id) || [];
                if (zoneTables.length === 0) return null;

                return (
                    <div key={zone.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div
                            className="px-6 py-4 border-b border-slate-200 flex items-center gap-3"
                            style={{ backgroundColor: zone.color + '20' }}
                        >
                            <div className="w-4 h-4 rounded" style={{ backgroundColor: zone.color }} />
                            <h3 className="font-semibold">{zone.name}</h3>
                            <span className="text-sm text-slate-500">({zoneTables.length} mesas)</span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4">
                            {zoneTables.map((table) => (
                                <div
                                    key={table.id}
                                    className="relative bg-slate-50 rounded-xl p-4 border border-slate-200 hover:shadow-md transition group"
                                >
                                    {editingId === table.id ? (
                                        <div className="space-y-2">
                                            <input
                                                type="number"
                                                value={editData.number}
                                                onChange={(e) => setEditData({ ...editData, number: parseInt(e.target.value) })}
                                                className="w-full px-2 py-1 border rounded text-center"
                                            />
                                            <div className="flex gap-1">
                                                <button onClick={handleSave} className="flex-1 p-1 bg-green-500 text-white rounded">
                                                    <Save size={14} />
                                                </button>
                                                <button onClick={() => setEditingId(null)} className="flex-1 p-1 bg-slate-300 rounded">
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="text-center">
                                                <UtensilsCrossed size={24} className="mx-auto text-slate-400 mb-2" />
                                                <p className="text-2xl font-bold text-slate-800">{table.number}</p>
                                                <p className="text-xs text-slate-500">{table.capacity} pers.</p>
                                                <span className={`inline-block mt-2 px-2 py-1 rounded-full text-xs font-medium ${statusColors[table.status]}`}>
                                                    {table.status === 'free' ? 'Libre' : table.status === 'occupied' ? 'Ocupada' : 'Reservada'}
                                                </span>
                                            </div>
                                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition flex gap-1">
                                                <button onClick={() => handleEdit(table)} className="p-1 bg-white shadow rounded hover:bg-slate-100">
                                                    <Edit2 size={12} />
                                                </button>
                                                <button
                                                    onClick={() => window.confirm('¿Eliminar mesa?') && deleteTable.mutate(table.id)}
                                                    className="p-1 bg-white shadow rounded hover:bg-red-100 text-red-500"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}

            {isLoading && <div className="text-center py-8 text-slate-400">Cargando mesas...</div>}
            {!isLoading && (!tables || tables.length === 0) && (
                <div className="text-center py-8 text-slate-400">No hay mesas. Primero crea zonas y luego añade mesas.</div>
            )}
        </div>
    );
}
