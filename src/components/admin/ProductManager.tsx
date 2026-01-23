import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pb } from '../../lib/pocketbase';
import { Plus, Trash2, Edit2, ChefHat, Euro, ToggleLeft, ToggleRight } from 'lucide-react';
import { useState } from 'react';

interface Category {
    id: string;
    name: string;
    icon: string;
}

interface Product {
    id: string;
    name: string;
    price: number;
    category: string;
    available: boolean;
    expand?: {
        category?: Category;
    };
}

export default function ProductManager() {
    const queryClient = useQueryClient();
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ name: '', price: 0, category: '', available: true });
    const [filterCategory, setFilterCategory] = useState<string>('');

    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: () => pb.collection('categories').getFullList<Category>({ sort: 'order' })
    });

    const { data: products, isLoading } = useQuery({
        queryKey: ['products'],
        queryFn: () => pb.collection('products').getFullList<Product>({
            expand: 'category',
            sort: 'name'
        })
    });

    const createProduct = useMutation({
        mutationFn: (data: Partial<Product>) => pb.collection('products').create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            setFormData({ name: '', price: 0, category: formData.category, available: true });
            setShowForm(false);
        }
    });

    const updateProduct = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Product> }) =>
            pb.collection('products').update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            setEditingId(null);
        }
    });

    const deleteProduct = useMutation({
        mutationFn: (id: string) => pb.collection('products').delete(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] })
    });

    const toggleAvailability = (product: Product) => {
        updateProduct.mutate({ id: product.id, data: { available: !product.available } });
    };

    const handleEdit = (product: Product) => {
        setEditingId(product.id);
        setFormData({
            name: product.name,
            price: product.price,
            category: product.category,
            available: product.available
        });
        setShowForm(true);
    };

    const handleSubmit = () => {
        if (editingId) {
            updateProduct.mutate({ id: editingId, data: formData });
        } else {
            createProduct.mutate(formData);
        }
    };

    const filteredProducts = filterCategory
        ? products?.filter(p => p.category === filterCategory)
        : products;

    return (
        <div className="space-y-6">
            {/* Header with filter and add button */}
            <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex items-center gap-4">
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="px-4 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">Todas las categorías</option>
                        {categories?.map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                        ))}
                    </select>
                    <span className="text-slate-500">{filteredProducts?.length || 0} productos</span>
                </div>
                <button
                    onClick={() => { setShowForm(true); setEditingId(null); setFormData({ name: '', price: 0, category: '', available: true }); }}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
                >
                    <Plus size={18} />
                    Nuevo Producto
                </button>
            </div>

            {/* Form modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                        <h3 className="text-lg font-semibold mb-4">
                            {editingId ? 'Editar Producto' : 'Nuevo Producto'}
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-600 mb-1">Nombre</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Ej: Cerveza Mahou"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-600 mb-1">Precio (€)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-600 mb-1">Categoría</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">Seleccionar...</option>
                                    {categories?.map((cat) => (
                                        <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="available"
                                    checked={formData.available}
                                    onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                                    className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <label htmlFor="available" className="text-sm text-slate-600">Disponible</label>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => { setShowForm(false); setEditingId(null); }}
                                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={!formData.name || !formData.category}
                                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
                            >
                                {editingId ? 'Guardar' : 'Crear'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Products grid */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200">
                    <h3 className="font-semibold flex items-center gap-2">
                        <ChefHat size={20} className="text-indigo-600" />
                        Productos
                    </h3>
                </div>

                {isLoading ? (
                    <div className="p-8 text-center text-slate-400">Cargando...</div>
                ) : filteredProducts?.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                        No hay productos. Crea el primero arriba.
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {filteredProducts?.map((product) => (
                            <div
                                key={product.id}
                                className={`p-4 flex items-center gap-4 hover:bg-slate-50 ${!product.available ? 'opacity-50' : ''}`}
                            >
                                <span className="text-2xl">{product.expand?.category?.icon || '🍽️'}</span>
                                <div className="flex-1">
                                    <p className="font-medium">{product.name}</p>
                                    <p className="text-sm text-slate-500">{product.expand?.category?.name}</p>
                                </div>
                                <div className="flex items-center gap-1 font-bold text-green-600">
                                    <Euro size={16} />
                                    {product.price.toFixed(2)}
                                </div>
                                <button
                                    onClick={() => toggleAvailability(product)}
                                    className={`p-2 rounded-lg transition ${product.available ? 'text-green-600 hover:bg-green-50' : 'text-slate-400 hover:bg-slate-100'}`}
                                    title={product.available ? 'Desactivar' : 'Activar'}
                                >
                                    {product.available ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                                </button>
                                <button onClick={() => handleEdit(product)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg">
                                    <Edit2 size={18} />
                                </button>
                                <button
                                    onClick={() => window.confirm('¿Eliminar producto?') && deleteProduct.mutate(product.id)}
                                    className="p-2 text-red-400 hover:bg-red-50 rounded-lg"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
