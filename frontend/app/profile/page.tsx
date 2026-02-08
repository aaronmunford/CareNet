"use client";

import { ProfilePage } from "@/components/profile-page";
import { LanguageProvider } from "@/components/language-provider";

export default function Profile() {
    return (
        <LanguageProvider>
            <ProfilePage />
        </LanguageProvider>
    );
}
