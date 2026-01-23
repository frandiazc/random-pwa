import PocketBase from 'pocketbase';

// Replace with your actual PocketBase URL if different
export const pb = new PocketBase('https://cordoba.myaddr.io/');

// Type definitions based on requirements
export interface OrderItem {
    id: string; // PB ID
    collectionId: string;
    collectionName: string;
    created: string;
    updated: string;

    // Custom Fields
    name: string;
    quantity: number;
    notes?: string;
    status: 'pending' | 'cooking' | 'ready' | 'served';
    table_id?: string;
    product?: string;
    expand?: {
        product?: {
            name: string;
            price: number;
        }
    };
}
