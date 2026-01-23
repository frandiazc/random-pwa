import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pb } from '../../lib/pocketbase';
import { Plus, Trash2, Edit2, Save, X, Package, GripVertical } from 'lucide-react';
import { useState } from 'react';

interface Category {
    id: string;
    name: string;
    icon: string;
    order: number;
}

const EMOJI_OPTIONS = ['🍺', '🍷', '🍔', '🍕', '🥗', '🍰', '☕', '🥤', '🍳', '🥘', '🌮', '🍣', '🍝', '🥪'];

export default function CategoryManager() {
    const queryClient = useQueryClient();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newCategory, setNewCategory] = useState({ name: '', icon: '🍽️', order: 0 });
    const [editData, setEditData] = useState({ name: '', icon: '', order: 0 });

    const { data: categories, isLoading } = useQuery({
        queryKey: ['categories'],
        queryFn: () => pb.collection('categories').getFullList<Category>({ sort: 'order' })
    });

    const createCategory = useMutation({
        mutationFn: (data: { name: string; icon: string; order: number }) =>
            pb.collection('categories').create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            setNewCategory({ name: '', icon: '🍽️', order: (categories?.length || 0) + 1 });
        }
    });

    const updateCategory = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Category> }) =>
            pb.collection('categories').update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            setEditingId(null);
        }
    });

    const deleteCategory = useMutation({
        mutationFn: (id: string) => pb.collection('categories').delete(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] })
    });

    const handleEdit = (cat: Category) => {
        setEditingId(cat.id);
        setEditData({ name: cat.name, icon: cat.icon, order: cat.order });
    };

    const handleSave = () => {
        if (editingId) {
            updateCategory.mutate({ id: editingId, data: editData });
        }
    };

    return (
        <div className="space-y-6">
            {/* Create new category */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Plus size={20} className="text-indigo-600" />
                    Nueva Categoría
                </h3>
                <div className="flex flex-wrap gap-4 items-end">
                    <div>
                        <label className="block text-sm text-slate-600 mb-1">Icono</label>
                        <select
                            value={newCategory.icon}
                            onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                            className="text-2xl px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            {EMOJI_OPTIONS.map((emoji) => (
                                <option key={emoji} value={emoji}>{emoji}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm text-slate-600 mb-1">Nombre</label>
                        <input
                            type="text"
                            placeholder="Ej: Bebidas"
                            value={newCategory.name}
                            onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <button
                        onClick={() => newCategory.name && createCategory.mutate({ ...newCategory, order: (categories?.length || 0) + 1 })}
                        disabled={!newCategory.name || createCategory.isPending}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition flex items-center gap-2"
                    >
                        <Plus size={18} />
                        Crear
                    </button>
                </div>
            </div>

            {/* Categories list */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200">
                    <h3 className="font-semibold flex items-center gap-2">
                        <Package size={20} className="text-indigo-600" />
                        Categorías ({categories?.length || 0})
                    </h3>
                </div>

                {isLoading ? (
                    <div className="p-8 text-center text-slate-400">Cargando...</div>
                ) : categories?.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                        No hay categorías. Crea la primera arriba.
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {categories?.map((cat) => (
                            <div key={cat.id} className="p-4 flex items-center gap-4 hover:bg-slate-50">
                                <GripVertical size={20} className="text-slate-300 cursor-grab" />

                                {editingId === cat.id ? (
                                    <>
                                        <select
                                            value={editData.icon}
                                            onChange={(e) => setEditData({ ...editData, icon: e.target.value })}
                                            className="text-2xl px-2 py-1 border border-slate-200 rounded-lg"
                                        >
                                            {EMOJI_OPTIONS.map((emoji) => (
                                                <option key={emoji} value={emoji}>{emoji}</option>
                                            ))}
                                        </select>
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
                                        <span className="text-3xl">{cat.icon}</span>
                                        <span className="flex-1 font-medium">{cat.name}</span>
                                        <button onClick={() => handleEdit(cat)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg">
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => window.confirm('¿Eliminar categoría?') && deleteCategory.mutate(cat.id)}
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
