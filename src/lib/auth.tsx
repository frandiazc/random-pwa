import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { pb } from './pocketbase';

interface AuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check if already authenticated
        setIsAuthenticated(pb.authStore.isValid);
        setIsLoading(false);

        // Listen for auth changes
        pb.authStore.onChange(() => {
            setIsAuthenticated(pb.authStore.isValid);
        });
    }, []);

    const login = async (email: string, password: string) => {
        await pb.collection('_superusers').authWithPassword(email, password);
    };

    const logout = () => {
        pb.authStore.clear();
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
