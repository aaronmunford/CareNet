
import { NextResponse } from 'next/server';

const FLOWGLAD_API_URL = "https://app.flowglad.com/api/v1";

export async function GET(req: Request) {
    try {
        const apiKey = process.env.FLOWGLAD_API_KEY;

        // --- MOCK MODE ---
        if (!apiKey || apiKey === 'your_api_key_here') {
            const transactions = [
                {
                    id: 'tx_mock_1',
                    date: new Date().toISOString(),
                    description: 'Copay - Mount Sinai Hospital (Mock)',
                    amount: 5000,
                    status: 'succeeded',
                    card: '**** 4242'
                }
            ];
            return NextResponse.json({ transactions });
        }

        // --- REAL MODE ---
        // Fetch invoices for the specific customer (if we knew ID) or ALL invoices for Org (for demo purposes)
        // GET /invoices

        const headers = { 'Authorization': apiKey };

        const response = await fetch(`${FLOWGLAD_API_URL}/invoices?limit=10`, { headers });

        if (!response.ok) {
            throw new Error("Failed to fetch invoices");
        }

        const data = await response.json();
        const invoices = data.invoices || []; // Adjust based on actual response structure

        const transactions = invoices.map((inv: any) => ({
            id: inv.id,
            date: inv.createdAt ? new Date(inv.createdAt).toISOString() : new Date().toISOString(),
            description: `Invoice #${inv.invoiceNumber || inv.id}`,
            amount: inv.amountDue || 0, // In cents?
            status: inv.status,
            card: 'Flowglad'
        }));

        return NextResponse.json({ transactions });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
    }
}
