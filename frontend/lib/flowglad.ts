
const FLOWGLAD_API_URL = "https://app.flowglad.com/api/v1";

interface FlowgladConfig {
    apiKey: string;
    orgId: string;
}

async function flowgladRequest(
    endpoint: string,
    method: string,
    body: any,
    config: FlowgladConfig
) {
    const headers = {
        "Authorization": `Bearer ${config.apiKey}`, // Doc implies raw key in Authorization header? or Bearer? Doc snippet: "--header 'Authorization: <api-key>'"
        "Content-Type": "application/json",
    };

    const response = await fetch(`${FLOWGLAD_API_URL}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Flowglad API Error: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    return response.json();
}

export async function createCustomer(
    customer: { name: string; email: string; phone?: string },
    config: FlowgladConfig
) {
    // Check if customer exists? For now, just create new or update.
    // Docs for create customer?
    // Assuming POST /customers
    return flowgladRequest("/customers", "POST", userToCustomerPayload(customer, config.orgId), config);
}

export async function createProductAndPrice(
    productName: string,
    amountCents: number,
    config: FlowgladConfig
) {
    const payload = {
        product: {
            name: productName,
            active: true,
            pricingModelId: "standard", // Assumption
            organizationId: config.orgId,
            description: "Co-payment for service",
            default: false
        },
        price: {
            type: "one_time",
            unitPrice: amountCents, // Flowglad uses atomic units? 
            currency: "usd", // Checking docs... Doc example: "unitPrice": 4503599627370495
            active: true,
            name: "Standard Price",
            isDefault: true,
            billingScheme: "per_unit",
        }
    };
    // Note: The doc example for create product included price. 
    // Endpoint: POST /products
    return flowgladRequest("/products", "POST", payload, config);
}

export async function createCheckoutSession(
    payload: { customerId: string; priceId: string; successUrl: string; cancelUrl: string },
    config: FlowgladConfig
) {
    return flowgladRequest("/checkout-sessions", "POST", payload, config);
}

export async function createCustomerPortalSession(
    payload: { customerId: string; returnUrl: string },
    config: FlowgladConfig
) {
    return flowgladRequest("/customer-portal-sessions", "POST", payload, config);
}

export async function listInvoices(
    customerId: string,
    config: FlowgladConfig
) {
    // GET /invoices?customerId=...
    return flowgladRequest(`/invoices?customerId=${customerId}`, "GET", null, config);
}


function userToCustomerPayload(user: any, orgId: string) {
    return {
        name: user.name,
        email: user.email,
        phone: user.phone,
        organizationId: orgId,
    };
}
