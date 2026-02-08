import OpenAI from "openai";

// Client initialized inside handler to avoid build-time errors if keys missing

export async function POST(req: Request) {
  try {
    const { image } = await req.json();

    if (!image) {
      return Response.json({ error: "No image provided" }, { status: 400 });
    }

    // Check if API key is configured
    if (!process.env.DEDALUS_API_KEY) {
      console.warn("DEDALUS_API_KEY not configured - using demo mode");
      // Fallback to demo mode
      const demoResponse = await fetch(new URL('/api/scan-card/demo', req.url), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image }),
      });
      return demoResponse;
    }

    const client = new OpenAI({
      apiKey: process.env.DEDALUS_API_KEY,
      baseURL: "https://api.dedaluslabs.ai/v1",
    });

    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Extract insurance information from this insurance card image. Return a JSON object with these fields:
- provider: one of "aetna", "anthem", "cigna", "united", "medicare", "medicaid", or "other"
- planType: one of "hmo", "ppo", "epo", "medicaid-managed", "medicare-advantage", "original-medicare", or "unknown"
- networkName: the network name if visible, or null
- memberZip: ZIP code if visible, or null
- patientName: the patient/member name if visible, or null
- dateOfBirth: the date of birth in YYYY-MM-DD format if visible, or null

Return ONLY the JSON object, no other text.`,
            },
            {
              type: "image_url",
              image_url: { url: image },
            },
          ],
        },
      ],
      max_tokens: 200,
    });

    const content = response.choices[0]?.message?.content || "{}";
    // Parse JSON from response, handling potential markdown code blocks
    const jsonStr = content.replace(/```json\n?|\n?```/g, "").trim();
    const data = JSON.parse(jsonStr);

    if (data.provider) {
      data.provider = data.provider.trim().toLowerCase();
    }

    return Response.json({ data });
  } catch (error) {
    console.error("Card scan error:", error);
    return Response.json(
      { error: "Failed to process insurance card image" },
      { status: 500 }
    );
  }
}
