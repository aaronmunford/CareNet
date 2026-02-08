
"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { UserProfile, DEFAULT_USER_PROFILE, InsuranceInfo } from "./types";

interface User {
    id: string;
    email: string;
    profile: UserProfile;
}

interface AuthContextType {
    user: User | null;
    signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
    signIn: (email: string, password: string) => Promise<void>;
    logout: () => void;
    updateProfile: (profile: Partial<UserProfile>) => void;
    updateInsurance: (insurance: InsuranceInfo) => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check local storage for persisted session
        const storedUser = localStorage.getItem("carenet_user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setIsLoading(false);
    }, []);

    const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
        // In production, this would call a backend API
        // For now, we'll create a local user with a profile
        const newUser: User = {
            id: `user_${Date.now()}`,
            email,
            profile: {
                ...DEFAULT_USER_PROFILE,
                firstName,
                lastName,
                email,
            },
        };
        setUser(newUser);
        localStorage.setItem("carenet_user", JSON.stringify(newUser));
        // Store password hash separately (in production, this would be handled by backend)
        localStorage.setItem(`carenet_pwd_${email}`, password); // Note: Not secure, for demo only
    };

    const signIn = async (email: string, password: string) => {
        // In production, this would call a backend API
        // For now, check localStorage
        const storedPassword = localStorage.getItem(`carenet_pwd_${email}`);
        if (!storedPassword || storedPassword !== password) {
            throw new Error("Invalid credentials");
        }

        const storedUser = localStorage.getItem("carenet_user");
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            if (parsedUser.email === email) {
                setUser(parsedUser);
                return;
            }
        }
        throw new Error("User not found");
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("carenet_user");
    };

    const updateProfile = (profileUpdate: Partial<UserProfile>) => {
        if (!user) return;

        const updatedUser = {
            ...user,
            profile: {
                ...user.profile,
                ...profileUpdate,
            },
        };
        setUser(updatedUser);
        localStorage.setItem("carenet_user", JSON.stringify(updatedUser));
    };

    const updateInsurance = (insurance: InsuranceInfo) => {
        if (!user) return;

        // Store insurance info in localStorage separately
        localStorage.setItem("carenet_insurance", JSON.stringify(insurance));
    };

    return (
        <AuthContext.Provider value={{ user, signUp, signIn, logout, updateProfile, updateInsurance, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
