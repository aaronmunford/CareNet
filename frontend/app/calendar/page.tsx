"use client";

import { CalendarView } from "@/components/calendar-view";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function CalendarPage() {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/"
                            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Back to Search
                        </Link>
                        <div className="h-6 w-px bg-slate-200 mx-2" />
                        <div className="flex items-center gap-2">
                            <Image
                                src="/carenet-logo.svg"
                                alt="CareNet Logo"
                                width={100}
                                height={30}
                                className="h-8 w-auto"
                            />
                            <span className="text-lg font-normal text-slate-300">|</span>
                            <span className="text-lg font-medium text-slate-700">Calendar</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full">
                <CalendarView />
            </main>
        </div>
    );
}
