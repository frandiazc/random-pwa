import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pb } from '../../lib/pocketbase';
import { useState } from 'react';
import { ArrowLeft, Plus, Minus, Send, Trash2, ShoppingCart } from 'lucide-react';
import { clsx } from 'clsx';

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
}

interface CartItem {
    product: Product;
    quantity: number;
    notes: string;
}

export default function TableOrder() {
    const { tableId } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [cart, setCart] = useState<CartItem[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [showCart, setShowCart] = useState(false);

    const { data: table } = useQuery({
        queryKey: ['table', tableId],
        queryFn: () => pb.collection('tables').getOne(tableId!)
    });

    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: () => pb.collection('categories').getFullList<Category>({ sort: 'order' })
    });

    const { data: products } = useQuery({
        queryKey: ['products'],
        queryFn: () => pb.collection('products').getFullList<Product>({
            filter: 'available = true',
            sort: 'name'
        })
    });

    const submitOrder = useMutation({
        mutationFn: async () => {
            // Create order_items for each cart item
            const promises = cart.map(item =>
                pb.collection('order_items').create({
                    name: item.product.name,
                    quantity: item.quantity,
                    notes: item.notes,
                    status: 'pending',
                    table_id: tableId
                })
            );
            await Promise.all(promises);

            // Update table status to occupied
            if (table?.status === 'free') {
                await pb.collection('tables').update(tableId!, { status: 'occupied' });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tables'] });
            setCart([]);
            setShowCart(false);
            // Show success and go back
            navigate('/waiter');
        }
    });

    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(i => i.product.id === product.id);
            if (existing) {
                return prev.map(i =>
                    i.product.id === product.id
                        ? { ...i, quantity: i.quantity + 1 }
                        : i
                );
            }
            return [...prev, { product, quantity: 1, notes: '' }];
        });
    };

    const updateQuantity = (productId: string, delta: number) => {
        setCart(prev => prev
            .map(i => i.product.id === productId
                ? { ...i, quantity: Math.max(0, i.quantity + delta) }
                : i
            )
            .filter(i => i.quantity > 0)
        );
    };

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(i => i.product.id !== productId));
    };

    const cartTotal = cart.reduce((sum, i) => sum + (i.product.price * i.quantity), 0);
    const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

    const filteredProducts = selectedCategory
        ? products?.filter(p => p.category === selectedCategory)
        : products;

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col">
            {/* Header */}
            <header className="bg-indigo-600 text-white px-4 py-3 sticky top-0 z-20 shadow-lg">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/waiter')} className="p-2 hover:bg-white/20 rounded-lg">
                        <ArrowLeft size={24} />
                    </button>
                    <div className="flex-1">
                        <h1 className="font-bold text-lg">Mesa {table?.number}</h1>
                        <p className="text-indigo-200 text-xs">Añade productos al pedido</p>
                    </div>
                </div>
            </header>

            {/* Categories tabs */}
            <div className="bg-white border-b border-slate-200 sticky top-14 z-10 overflow-x-auto">
                <div className="flex p-2 gap-2 min-w-max">
                    <button
                        onClick={() => setSelectedCategory(null)}
                        className={clsx(
                            "px-4 py-2 rounded-full text-sm font-medium transition whitespace-nowrap",
                            !selectedCategory ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        )}
                    >
                        Todos
                    </button>
                    {categories?.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={clsx(
                                "px-4 py-2 rounded-full text-sm font-medium transition flex items-center gap-2 whitespace-nowrap",
                                selectedCategory === cat.id ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            )}
                        >
                            <span>{cat.icon}</span>
                            {cat.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Products grid */}
            <div className="flex-1 p-4 pb-24">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {filteredProducts?.map((product) => {
                        const cartItem = cart.find(i => i.product.id === product.id);
                        return (
                            <button
                                key={product.id}
                                onClick={() => addToCart(product)}
                                className={clsx(
                                    "relative bg-white rounded-xl p-4 shadow-sm border-2 transition-all active:scale-95 text-left",
                                    cartItem ? "border-indigo-400 bg-indigo-50" : "border-slate-200 hover:border-slate-300"
                                )}
                            >
                                {cartItem && (
                                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                        {cartItem.quantity}
                                    </div>
                                )}
                                <p className="font-medium text-slate-800 text-sm leading-tight">{product.name}</p>
                                <p className="text-green-600 font-bold mt-2">{product.price.toFixed(2)}€</p>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Cart button */}
            {cartCount > 0 && (
                <div className="fixed bottom-4 left-4 right-4 z-30">
                    <button
                        onClick={() => setShowCart(true)}
                        className="w-full bg-indigo-600 text-white py-4 rounded-2xl shadow-lg shadow-indigo-500/30 flex items-center justify-between px-6 active:scale-98 transition"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                <ShoppingCart size={18} />
                            </div>
                            <span className="font-medium">{cartCount} productos</span>
                        </div>
                        <span className="font-bold text-lg">{cartTotal.toFixed(2)}€</span>
                    </button>
                </div>
            )}

            {/* Cart drawer */}
            {showCart && (
                <div className="fixed inset-0 z-50 flex flex-col">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setShowCart(false)} />
                    <div className="mt-auto bg-white rounded-t-3xl max-h-[80vh] overflow-auto relative z-10">
                        <div className="sticky top-0 bg-white border-b border-slate-200 p-4">
                            <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto mb-3" />
                            <h2 className="font-bold text-lg">Tu pedido</h2>
                        </div>

                        <div className="p-4 space-y-3">
                            {cart.map((item) => (
                                <div key={item.product.id} className="bg-slate-50 rounded-xl p-4 flex items-center gap-4">
                                    <div className="flex-1">
                                        <p className="font-medium">{item.product.name}</p>
                                        <p className="text-sm text-slate-500">{item.product.price.toFixed(2)}€ x {item.quantity}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => updateQuantity(item.product.id, -1)}
                                            className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center hover:bg-slate-300"
                                        >
                                            <Minus size={16} />
                                        </button>
                                        <span className="w-8 text-center font-bold">{item.quantity}</span>
                                        <button
                                            onClick={() => updateQuantity(item.product.id, 1)}
                                            className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center hover:bg-indigo-200"
                                        >
                                            <Plus size={16} />
                                        </button>
                                        <button
                                            onClick={() => removeFromCart(item.product.id)}
                                            className="w-8 h-8 text-red-500 hover:bg-red-50 rounded-full flex items-center justify-center ml-2"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4 space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-600">Total</span>
                                <span className="text-2xl font-bold text-green-600">{cartTotal.toFixed(2)}€</span>
                            </div>
                            <button
                                onClick={() => submitOrder.mutate()}
                                disabled={submitOrder.isPending}
                                className="w-full py-4 bg-green-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-green-700 disabled:opacity-50 transition active:scale-98"
                            >
                                <Send size={20} />
                                {submitOrder.isPending ? 'Enviando...' : 'Enviar a Cocina'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
