import { create } from 'zustand';

export interface LocalOrderItem {
    localId: string; // Temporary ID for React keys
    name: string;
    quantity: number;
    notes?: string;
}

interface OrderState {
    cart: LocalOrderItem[];
    addToCart: (item: Omit<LocalOrderItem, 'localId'>) => void;
    removeFromCart: (localId: string) => void;
    clearCart: () => void;
}

export const useOrderStore = create<OrderState>((set) => ({
    cart: [],
    addToCart: (item) => set((state) => ({
        cart: [...state.cart, { ...item, localId: crypto.randomUUID() }]
    })),
    removeFromCart: (localId) => set((state) => ({
        cart: state.cart.filter((i) => i.localId !== localId)
    })),
    clearCart: () => set({ cart: [] }),
}));
