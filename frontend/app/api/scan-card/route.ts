export async function POST(req: Request) {
  try {
    const { image } = await req.json();

    if (!image) {
      return Response.json({ error: "No image provided" }, { status: 400 });
    }

    // Fast scan simulation - 2.5 seconds for demo
    await new Promise(resolve => setTimeout(resolve, 2500));

    // Hardcoded demo data for presentation
    const data = {
      provider: "anthem",
      planType: "ppo",
      networkName: "Blue Cross Blue Shield",
      memberZip: "10027",
      patientName: "Raymond",
      dateOfBirth: "1948-10-04", // October 4, 1948
    };

    return Response.json({ data });
  } catch (error) {
    console.error("Card scan error:", error);
    return Response.json(
      { error: "Failed to process insurance card image" },
      { status: 500 }
    );
  }
}
