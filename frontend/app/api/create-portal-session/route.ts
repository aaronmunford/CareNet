
import { NextResponse } from 'next/server';

const FLOWGLAD_API_URL = "https://app.flowglad.com/api/v1";

export async function POST(req: Request) {
    try {
        const apiKey = process.env.FLOWGLAD_API_KEY;
        const orgId = process.env.NEXT_PUBLIC_FLOWGLAD_ORG_ID;

        // --- MOCK MODE ---
        if (!apiKey || apiKey === 'your_api_key_here') {
            return NextResponse.json({
                url: 'https://demo.flowglad.com/portal/mock-customer-portal'
            });
        }

        // --- REAL MODE ---
        // In a real app, we would get the Customer ID from the logged-in user's database record.
        // Since we are simulating "Log In", we might not have a consistent flowglad Customer ID 
        // unless we saved it during the checkout process (which we haven't implemented persistence for).

        // LIMITATION: Without a persistent database mapping User -> FlowgladCustomerID, 
        // we can't open a portal for the *correct* customer if they are just "Demo User".

        // PLAN: Attempt to create a portal session for a 'latest' or specific demo customer 
        // OR create a new customer just to show the portal works (it will be empty).

        const headers = {
            'Authorization': apiKey,
            'Content-Type': 'application/json'
        };

        // Create a temporary customer to view the portal (if we don't have an ID)
        // In production, `await db.user.find(...).customerId`
        let customerId = "cus_demo_123"; // This won't work on real API

        // Just for the demo of the API call, let's create a new customer so we get a valid ID
        const customerPayload = {
            name: "Portal Demo User",
            email: `portal_demo_${Date.now()}@example.com`,
            organizationId: orgId
        };
        const custRes = await fetch(`${FLOWGLAD_API_URL}/customers`, { method: 'POST', headers, body: JSON.stringify(customerPayload) });
        if (custRes.ok) {
            const cData = await custRes.json();
            customerId = cData.customer?.id || cData.id;
        }

        const payload = {
            customerId: customerId,
            returnUrl: `${req.headers.get('origin')}/wallet`
        };

        const response = await fetch(`${FLOWGLAD_API_URL}/customer-portal-sessions`, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            console.error("Failed to create portal session", await response.text());
            throw new Error("Failed Key/Request");
        }

        const data = await response.json();

        return NextResponse.json({
            url: data.portalUrl || data.url
        });

    } catch (error) {
        console.error('Error creating portal session:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
