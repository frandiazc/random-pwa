import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pb } from '../lib/pocketbase';
import type { OrderItem } from '../lib/pocketbase';
import { useOrderStore } from '../store/orderStore';
import type { LocalOrderItem } from '../store/orderStore';

export const useOrderItems = () => {
    return useQuery({
        queryKey: ['order_items'],
        queryFn: async () => {
            const records = await pb.collection('order_items').getFullList<OrderItem>({
                sort: '-created',
            });
            return records;
        }
    });
};

export const useOrderMutations = () => {
    const queryClient = useQueryClient();
    const { cart, clearCart, removeFromCart } = useOrderStore();

    // 1. Submit Cart to DB
    const submitOrder = useMutation({
        mutationFn: async () => {
            const promises = cart.map(item =>
                pb.collection('order_items').create({
                    name: item.name,
                    quantity: item.quantity,
                    notes: item.notes,
                    status: 'pending',
                    // table_id: ... in a real app
                })
            );
            await Promise.all(promises);
        },
        onSuccess: () => {
            clearCart();
            queryClient.invalidateQueries({ queryKey: ['order_items'] });
        },
    });

    // 2. Delete Remote Item
    const deleteRemoteItem = useMutation({
        mutationFn: async (id: string) => {
            await pb.collection('order_items').delete(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['order_items'] });
        },
    });

    // 3. Unified Remove Function
    const handleRemoveItem = async (item: LocalOrderItem | OrderItem) => {
        // Type guard or property check to distinguish
        if ('localId' in item) {
            // It's a local item
            removeFromCart(item.localId);
        } else {
            // It's a remote item (DB)
            if (window.confirm(`¿Seguro que quieres borrar ${item.name} de la comanda enviada?`)) {
                try {
                    await deleteRemoteItem.mutateAsync(item.id);
                } catch (error) {
                    console.error("Error eliminando item:", error);
                    alert("No se pudo eliminar. Verifica permisos.");
                }
            }
        }
    };

    return {
        submitOrder,
        deleteRemoteItem,
        handleRemoveItem
    };
};
