import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pb } from '../../lib/pocketbase';
import { Plus, Trash2, Edit2, Save, X, MapPin } from 'lucide-react';
import { useState } from 'react';

interface Zone {
    id: string;
    name: string;
    color: string;
}

export default function ZoneManager() {
    const queryClient = useQueryClient();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newZone, setNewZone] = useState({ name: '', color: '#6366f1' });
    const [editData, setEditData] = useState({ name: '', color: '' });

    const { data: zones, isLoading } = useQuery({
        queryKey: ['zones'],
        queryFn: () => pb.collection('zones').getFullList<Zone>()
    });

    const createZone = useMutation({
        mutationFn: (data: { name: string; color: string }) =>
            pb.collection('zones').create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['zones'] });
            setNewZone({ name: '', color: '#6366f1' });
        }
    });

    const updateZone = useMutation({
        mutationFn: ({ id, data }: { id: string; data: { name: string; color: string } }) =>
            pb.collection('zones').update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['zones'] });
            setEditingId(null);
        }
    });

    const deleteZone = useMutation({
        mutationFn: (id: string) => pb.collection('zones').delete(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['zones'] })
    });

    const handleEdit = (zone: Zone) => {
        setEditingId(zone.id);
        setEditData({ name: zone.name, color: zone.color });
    };

    const handleSave = () => {
        if (editingId) {
            updateZone.mutate({ id: editingId, data: editData });
        }
    };

    return (
        <div className="space-y-6">
            {/* Create new zone */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Plus size={20} className="text-indigo-600" />
                    Nueva Zona
                </h3>
                <div className="flex flex-wrap gap-4">
                    <input
                        type="text"
                        placeholder="Nombre (ej: Terraza)"
                        value={newZone.name}
                        onChange={(e) => setNewZone({ ...newZone, name: e.target.value })}
                        className="flex-1 min-w-[200px] px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                        type="color"
                        value={newZone.color}
                        onChange={(e) => setNewZone({ ...newZone, color: e.target.value })}
                        className="w-12 h-10 rounded-lg cursor-pointer border border-slate-200"
                    />
                    <button
                        onClick={() => newZone.name && createZone.mutate(newZone)}
                        disabled={!newZone.name || createZone.isPending}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition flex items-center gap-2"
                    >
                        <Plus size={18} />
                        Crear
                    </button>
                </div>
            </div>

            {/* Zones list */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200">
                    <h3 className="font-semibold flex items-center gap-2">
                        <MapPin size={20} className="text-indigo-600" />
                        Zonas ({zones?.length || 0})
                    </h3>
                </div>

                {isLoading ? (
                    <div className="p-8 text-center text-slate-400">Cargando...</div>
                ) : zones?.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                        No hay zonas. Crea la primera arriba.
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {zones?.map((zone) => (
                            <div key={zone.id} className="p-4 flex items-center gap-4 hover:bg-slate-50">
                                {editingId === zone.id ? (
                                    <>
                                        <input
                                            type="color"
                                            value={editData.color}
                                            onChange={(e) => setEditData({ ...editData, color: e.target.value })}
                                            className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200"
                                        />
                                        <input
                                            type="text"
                                            value={editData.name}
                                            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                        <button onClick={handleSave} className="p-2 text-green-600 hover:bg-green-50 rounded-lg">
                                            <Save size={18} />
                                        </button>
                                        <button onClick={() => setEditingId(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg">
                                            <X size={18} />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <div
                                            className="w-10 h-10 rounded-lg shadow-inner"
                                            style={{ backgroundColor: zone.color }}
                                        />
                                        <span className="flex-1 font-medium">{zone.name}</span>
                                        <button onClick={() => handleEdit(zone)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg">
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => window.confirm('¿Eliminar zona?') && deleteZone.mutate(zone.id)}
                                            className="p-2 text-red-400 hover:bg-red-50 rounded-lg"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
