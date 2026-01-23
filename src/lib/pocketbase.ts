import PocketBase from 'pocketbase';

// Replace with your actual PocketBase URL if different
export const pb = new PocketBase('http://pocketbase-kkscsg08gww00o0ckg8s4s40.79.117.130.206.sslip.io');

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
    table_id?: string; // Relation to table
    order_id?: string; // Relation to order container if exists
}
