
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard, ExternalLink, ArrowUpRight, DollarSign, Wallet as WalletIcon } from "lucide-react";
import Link from "next/link";

interface Transaction {
    id: string;
    date: string;
    description: string;
    amount: number;
    status: string;
    card: string;
}

export default function WalletPage() {
    const { user, isLoading: authLoading } = useAuth();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [openingPortal, setOpeningPortal] = useState(false);

    useEffect(() => {
        if (!user) return;

        // Fetch transactions
        fetch('/api/transactions')
            .then(res => res.json())
            .then(data => {
                setTransactions(data.transactions || []);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [user]);

    const handleManageBilling = async () => {
        setOpeningPortal(true);
        try {
            const res = await fetch('/api/create-portal-session', { method: 'POST' });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                alert("Could not create portal session (Mock Mode)");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setOpeningPortal(false);
        }
    };

    if (authLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;

    if (!user) {
        return (
            <div className="flex h-[80vh] flex-col items-center justify-center gap-4 text-center">
                <div className="rounded-full bg-muted p-4">
                    <WalletIcon className="h-8 w-8 text-muted-foreground" />
                </div>
                <h1 className="text-2xl font-bold">Please Log In</h1>
                <p className="text-muted-foreground">You need to be logged in to view your wallet.</p>
                <Button asChild>
                    <Link href="/">Return Home</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10">
            <div className="mx-auto max-w-5xl space-y-8">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">My Wallet</h1>
                        <p className="text-slate-500">Manage your payments and copays.</p>
                    </div>
                    <Button variant="outline" asChild>
                        <Link href="/">Back to Dashboard</Link>
                    </Button>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {/* Balance / Spend Card */}
                    <Card className="md:col-span-1 shadow-sm border-slate-200">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Spent (YTD)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-slate-900">$100.00</div>
                            <p className="text-xs text-slate-500 mt-1">+ $50.00 this month</p>
                        </CardContent>
                    </Card>

                    {/* Payment Method Card */}
                    <Card className="md:col-span-2 shadow-sm border-slate-200">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div>
                                <CardTitle className="text-lg font-semibold">Payment Methods</CardTitle>
                                <CardDescription>Manage your cards and billing details via Flowglad</CardDescription>
                            </div>
                            <Button
                                onClick={handleManageBilling}
                                disabled={openingPortal}
                                className="gap-2 bg-slate-900 text-white hover:bg-slate-800"
                            >
                                {openingPortal ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                                Manage Billing
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4 rounded-lg border bg-white p-4">
                                <div className="h-10 w-14 rounded bg-slate-100 flex items-center justify-center">
                                    <CreditCard className="h-6 w-6 text-slate-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-sm text-slate-900">Visa ending in 4242</p>
                                    <p className="text-xs text-slate-500">Expires 12/28</p>
                                </div>
                                <Badge variant="outline" className="text-xs font-normal bg-green-50 text-green-700 border-green-200">Default</Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Transactions List */}
                <Card className="shadow-sm border-slate-200">
                    <CardHeader>
                        <CardTitle>Transaction History</CardTitle>
                        <CardDescription>Recent copays and medical payments.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {transactions.map(tx => (
                                    <div key={tx.id} className="flex items-center justify-between border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
                                                <ArrowUpRight className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm text-slate-900">{tx.description}</p>
                                                <p className="text-xs text-slate-500">{new Date(tx.date).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="block font-medium text-slate-900">-${(tx.amount / 100).toFixed(2)}</span>
                                            <Badge variant="secondary" className="mt-1 text-[10px] h-5 bg-green-50 text-green-700 hover:bg-green-50">{tx.status}</Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
