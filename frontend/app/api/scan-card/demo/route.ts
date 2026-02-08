// Demo mode for insurance card scanning when API keys aren't configured
// Returns mock data so users can still test the app

export async function POST(req: Request) {
  try {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Return demo insurance data
    const demoData = {
      provider: "anthem",
      planType: "ppo",
      networkName: "Blue Cross Blue Shield",
      memberZip: "10001",
      patientName: "Demo User",
      dateOfBirth: "1990-01-15",
      isDemo: true, // Flag to indicate this is demo data
    };

    return Response.json({ data: demoData });
  } catch (error) {
    console.error("Demo scan error:", error);
    return Response.json(
      { error: "Failed to process demo scan" },
      { status: 500 }
    );
  }
}
