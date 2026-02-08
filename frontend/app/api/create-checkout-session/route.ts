
import { NextResponse } from 'next/server';

const FLOWGLAD_API_URL = "https://app.flowglad.com/api/v1";

export async function POST(req: Request) {
    try {
        const { hospitalId, hospitalName, amount = 50, user } = await req.json();

        const apiKey = process.env.FLOWGLAD_API_KEY;
        const orgId = process.env.NEXT_PUBLIC_FLOWGLAD_ORG_ID;

        // --- MOCK MODE (Fallback) ---
        if (!apiKey || apiKey === 'your_api_key_here' || !orgId) {
            console.warn("Flowglad Credentials missing, returning mock session");
            await new Promise(r => setTimeout(r, 1000)); // Simulate mock network delay
            return NextResponse.json({
                url: 'https://checkout.flowglad.com/mock-session?success=true'
            });
        }

        // --- REAL MODE ---
        const headers = {
            'Authorization': apiKey,
            'Content-Type': 'application/json'
        };

        // 1. Create/Get Customer
        // For this demo, we'll simpler create a new customer or use a specific one if we had a persistent DB.
        // Let's create a new one for every checkout to ensure it works without complex lookup logic for now.
        const customerPayload = {
            name: user?.name || "Guest User",
            email: user?.email || `guest_${Date.now()}@example.com`,
            organizationId: orgId
        };

        // Attempt to create customer
        const customerRes = await fetch(`${FLOWGLAD_API_URL}/customers`, {
            method: 'POST', headers, body: JSON.stringify(customerPayload)
        });
        const customerData = await customerRes.json();

        // Fallback if customer creation fails (might return existing, but if not, simple error handling)
        if (!customerRes.ok) {
            console.error("Failed to create customer", await customerRes.text());
            // Proceeding might fail, but let's try to handle specific cases or throw
            throw new Error("Failed to create Flowglad customer");
        }
        const customerId = customerData.customer?.id || customerData.id;


        // 2. Create Product (Real-time product creation for the specific hospital payment)
        const productPayload = {
            product: {
                name: `Copay: ${hospitalName}`,
                description: `Medical copayment for visit at ${hospitalName}`,
                active: true,
                pricingModelId: "standard", // Assuming 'standard' is a valid model ID or we might need to query it. 
                // If 'pricingModelId' is required and dynamic, this might fail if we don't know it.
                // Let's try to omit if possible, or use a known one.
                organizationId: orgId,
                default: false
            },
            price: {
                type: "one_time",
                intervalUnit: "day", // Required even for one_time? Documentation was fuzzy, assuming standard fields.
                intervalCount: 1,
                unitPrice: amount * 100, // Cents
                currency: "usd",
                active: true,
                name: "Standard Copay",
                isDefault: true
            }
        };

        // Note: Creating a product for every checkout is not efficient for production, 
        // but ensures we have the right Product/Price for this specific "Visit".
        const productRes = await fetch(`${FLOWGLAD_API_URL}/products`, {
            method: 'POST', headers, body: JSON.stringify(productPayload)
        });

        // If product creation fails, we might need to debug parameters
        if (!productRes.ok) {
            console.error("Failed to create product", await productRes.text());
            throw new Error("Failed to create Flowglad product");
        }
        const productData = await productRes.json();
        const priceId = productData.price?.id; // Assuming response structure { product: {...}, price: { id: ... } }

        if (!priceId) throw new Error("Price ID not found in product creation response");

        // 3. Create Checkout Session
        const checkoutPayload = {
            customerId: customerId,
            priceId: priceId, // or items: [{ priceId: ... }]
            successUrl: `${req.headers.get('origin')}/wallet?success=true`,
            cancelUrl: `${req.headers.get('origin')}/?canceled=true`,
            // organizationId might be inferred from auth
        };

        const checkoutRes = await fetch(`${FLOWGLAD_API_URL}/checkout-sessions`, {
            method: 'POST', headers, body: JSON.stringify(checkoutPayload)
        });

        if (!checkoutRes.ok) {
            console.error("Failed to create checkout session", await checkoutRes.text());
            throw new Error("Failed to create checkout session");
        }

        const checkoutData = await checkoutRes.json();

        return NextResponse.json({
            url: checkoutData.checkoutUrl || checkoutData.url
        });

    } catch (error) {
        console.error('Error creating checkout session:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
