"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { LanguageCode, LANGUAGES, DICTIONARY } from "@/lib/languages";

interface LanguageContextType {
    language: LanguageCode;
    setLanguage: (code: LanguageCode) => void;
    t: (key: string) => string;
    isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguage] = useState<LanguageCode>("en");

    useEffect(() => {
        // Load saved language or default to English
        const saved = localStorage.getItem("carenet-language") as LanguageCode;
        if (saved && LANGUAGES.some((l) => l.code === saved)) {
            setLanguage(saved);
        }
    }, []);

    const handleSetLanguage = (code: LanguageCode) => {
        setLanguage(code);
        localStorage.setItem("carenet-language", code);

        // Set HTML dir attribute for RTL support (Arabic, Urdu)
        const isRTL = code === "ar" || code === "ur";
        document.documentElement.dir = isRTL ? "rtl" : "ltr";
        document.documentElement.lang = code;
    };

    const t = (key: string): string => {
        return DICTIONARY[language][key] || DICTIONARY["en"][key] || key;
    };

    const isRTL = language === "ar" || language === "ur";

    return (
        <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t, isRTL }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useTranslation() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error("useTranslation must be used within a LanguageProvider");
    }
    return context;
}
