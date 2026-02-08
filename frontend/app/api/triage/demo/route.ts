// Demo mode for voice triage when API keys aren't configured

export async function POST(req: Request) {
  try {
    const { transcript } = await req.json();

    if (!transcript) {
      return Response.json(
        { error: "No transcript provided" },
        { status: 400 }
      );
    }

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Analyze transcript for keywords to provide relevant demo response
    const lowerTranscript = transcript.toLowerCase();

    let demoResponse;

    if (lowerTranscript.includes("chest") || lowerTranscript.includes("heart")) {
      demoResponse = {
        injuryCategory: "Chest Pain",
        severity: "critical",
        recommendedCare: "emergency-room",
        reasoning: "Chest pain requires immediate medical evaluation to rule out cardiac issues.",
        suggestedSymptoms: ["chest-pain"],
        suggestedCareType: "emergency",
        suggestedSeverity: "severe",
        warningFlags: ["Potential cardiac event - seek immediate care"],
        isDemo: true,
      };
    } else if (lowerTranscript.includes("broken") || lowerTranscript.includes("fracture") || lowerTranscript.includes("arm") || lowerTranscript.includes("leg")) {
      demoResponse = {
        injuryCategory: "Fracture",
        severity: "high",
        recommendedCare: "emergency-room",
        reasoning: "Suspected fracture requires X-ray and orthopedic evaluation.",
        suggestedSymptoms: ["broken-bone"],
        suggestedCareType: "emergency",
        suggestedSeverity: "moderate",
        warningFlags: [],
        isDemo: true,
      };
    } else if (lowerTranscript.includes("burn")) {
      demoResponse = {
        injuryCategory: "Burn",
        severity: "high",
        recommendedCare: "emergency-room",
        reasoning: "Severe burns require immediate medical attention to prevent infection and assess damage.",
        suggestedSymptoms: ["severe-burn"],
        suggestedCareType: "emergency",
        suggestedSeverity: "severe",
        warningFlags: ["Risk of infection and fluid loss"],
        isDemo: true,
      };
    } else if (lowerTranscript.includes("fever")) {
      demoResponse = {
        injuryCategory: "High Fever",
        severity: "moderate",
        recommendedCare: "urgent-care",
        reasoning: "High fever should be evaluated, especially if persistent or accompanied by other symptoms.",
        suggestedSymptoms: ["high-fever"],
        suggestedCareType: "urgent",
        suggestedSeverity: "moderate",
        warningFlags: [],
        isDemo: true,
      };
    } else {
      // Generic response for unrecognized symptoms
      demoResponse = {
        injuryCategory: "General Medical Concern",
        severity: "moderate",
        recommendedCare: "urgent-care",
        reasoning: "Your symptoms warrant medical evaluation. Urgent care can provide timely assessment.",
        suggestedSymptoms: ["other"],
        suggestedCareType: "urgent",
        suggestedSeverity: "moderate",
        warningFlags: [],
        isDemo: true,
      };
    }

    return Response.json({ data: demoResponse });
  } catch (error) {
    console.error("Demo triage error:", error);
    return Response.json(
      { error: "Failed to process demo triage" },
      { status: 500 }
    );
  }
}
