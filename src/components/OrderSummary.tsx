import { useOrderStore } from '../store/orderStore';
import { useOrderItems, useOrderMutations } from '../hooks/useOrderMutations';
import { Trash2, Send, PlusCircle } from 'lucide-react';
import { clsx } from 'clsx';

export default function OrderSummary() {
    const { cart, addToCart } = useOrderStore();
    const { data: remoteItems, isLoading } = useOrderItems();
    const { handleRemoveItem, submitOrder } = useOrderMutations();

    const handleAddMockItem = () => {
        const foods = ["Bravas", "Cerveza", "Croquetas", "Olivas", "Hamburguesa"];
        const randomFood = foods[Math.floor(Math.random() * foods.length)];
        addToCart({
            name: randomFood,
            quantity: 1,
            notes: Math.random() > 0.7 ? "Sin cebolla" : ""
        });
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 max-w-2xl mx-auto">
            <h2 className="text-xl font-bold mb-4 flex items-center justify-between">
                <span>Resumen de Mesa</span>
                <button
                    onClick={handleAddMockItem}
                    className="text-sm bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full flex items-center gap-1 hover:bg-indigo-100 transition"
                >
                    <PlusCircle size={16} /> Añadir Item
                </button>
            </h2>

            {/* ERROR / LOADING HANDLING */}
            {isLoading && <p className="text-gray-400 text-center py-4">Cargando comanda...</p>}

            <div className="space-y-6">

                {/* REMOTE ITEMS (CONFIRMED) */}
                {remoteItems && remoteItems.length > 0 && (
                    <section>
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Enviados a Cocina</h3>
                        <div className="space-y-2">
                            {remoteItems.map((item) => (
                                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    <div>
                                        <p className="font-medium text-gray-800">{item.name} <span className="text-xs text-gray-500">x{item.quantity}</span></p>
                                        {item.notes && <p className="text-xs text-orange-600 italic">{item.notes}</p>}
                                    </div>
                                    <button
                                        onClick={() => handleRemoveItem(item)}
                                        className="text-gray-400 hover:text-red-500 transition p-2"
                                        title="Eliminar de base de datos"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* LOCAL ITEMS (CART) */}
                {cart.length > 0 && (
                    <section className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <h3 className="text-xs font-semibold text-indigo-500 uppercase tracking-wider mb-2">En Carrito (Sin Confirmar)</h3>
                        <div className="space-y-2 mb-4">
                            {cart.map((item) => (
                                <div key={item.localId} className="flex items-center justify-between p-3 bg-indigo-50/50 rounded-lg border border-indigo-100 border-l-4 border-l-indigo-400">
                                    <div>
                                        <p className="font-medium text-gray-800">{item.name} <span className="text-xs text-gray-500">x{item.quantity}</span></p>
                                        {item.notes && <p className="text-xs text-orange-600 italic">{item.notes}</p>}
                                    </div>
                                    <button
                                        onClick={() => handleRemoveItem(item)}
                                        className="text-gray-400 hover:text-red-500 transition p-2"
                                        title="Quitar del carrito"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => submitOrder.mutate()}
                            disabled={submitOrder.isPending}
                            className={clsx(
                                "w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 shadow-lg transition transform active:scale-95",
                                submitOrder.isPending ? "bg-gray-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-500/30"
                            )}
                        >
                            <Send size={20} />
                            {submitOrder.isPending ? 'Enviando...' : 'Marchar a Cocina'}
                        </button>
                    </section>
                )}

                {cart.length === 0 && (!remoteItems || remoteItems.length === 0) && !isLoading && (
                    <div className="text-center py-10 bg-gray-50 rounded-xl border-dashed border-2 border-gray-200">
                        <p className="text-gray-400">La comanda está vacía.</p>
                        <button onClick={handleAddMockItem} className="mt-2 text-indigo-500 font-medium hover:underline">Añade algo</button>
                    </div>
                )}
            </div>
        </div>
    );
}
