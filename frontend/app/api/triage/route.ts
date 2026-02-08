// Force rebuild 1
import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";

// Provider initialized inside handler to avoid build-time errors

const triageSchema = z.object({
  injuryCategory: z
    .string()
    .describe(
      "A concise category for the injury/condition (e.g. 'Fracture', 'Burn', 'Chest Pain', 'Allergic Reaction', 'Headache/Migraine')"
    ),
  severity: z
    .enum(["low", "moderate", "high", "critical"])
    .describe(
      "How severe the condition appears: low (minor), moderate (needs attention), high (serious), critical (life-threatening)"
    ),
  recommendedCare: z
    .enum([
      "self-care",
      "primary-care",
      "specialist",
      "urgent-care",
      "emergency-room",
    ])
    .describe(
      "The recommended type of care: self-care for minor issues, primary-care for doctor visits, specialist for specific conditions, urgent-care for prompt but non-emergency care, emergency-room for emergencies"
    ),
  reasoning: z
    .string()
    .describe(
      "A brief 1-2 sentence explanation of why this care type is recommended"
    ),
  suggestedSymptoms: z
    .array(
      z.enum([
        "chest-pain",
        "stroke",
        "major-bleeding",
        "broken-bone",
        "severe-burn",
        "allergic-reaction",
        "high-fever",
        "head-injury",
        "other",
      ])
    )
    .describe(
      "Which symptom categories from the predefined list match the described condition"
    ),
  suggestedCareType: z
    .enum(["emergency", "urgent", "not-sure"])
    .describe(
      "Maps to the app's care type: emergency for ER-level, urgent for urgent care level, not-sure if ambiguous"
    ),
  suggestedSeverity: z
    .enum(["mild", "moderate", "severe"])
    .describe(
      "Maps to the app's severity scale: mild, moderate, or severe"
    ),
  warningFlags: z
    .array(z.string())
    .describe(
      "Any red-flag symptoms that warrant immediate medical attention, empty array if none"
    ),
});

export async function POST(req: Request) {
  try {
    const { transcript, language = "English" } = await req.json();

    if (!transcript || typeof transcript !== "string" || transcript.trim().length === 0) {
      return Response.json(
        { error: "No transcript provided" },
        { status: 400 }
      );
    }

    // Check if API key is configured
    if (!process.env.DEDALUS_API_KEY) {
      console.warn("DEDALUS_API_KEY not configured - using demo mode");
      // Fallback to demo mode
      const demoResponse = await fetch(new URL('/api/triage/demo', req.url), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
      });
      return demoResponse;
    }

    const { object } = await generateObject({
      model: dedalus("gpt-4o"),
      schema: triageSchema,
      system: `You are a medical triage assistant. Based on a patient's spoken description of their symptoms or injury, you categorize the condition and recommend the appropriate level of care.

IMPORTANT RULES:
- You are NOT providing a medical diagnosis. You are helping categorize the urgency and type of care needed.
- Always err on the side of caution. If in doubt, recommend a higher level of care.
- For any mention of chest pain, stroke symptoms, severe bleeding, difficulty breathing, or loss of consciousness, ALWAYS recommend emergency-room and mark severity as critical or high.
- Consider the patient's age and any mentioned medical history when making recommendations.
- Include relevant warning flags for serious symptoms.
- Map symptoms to the predefined categories as accurately as possible.
- Keep reasoning clear, concise, and empathetic.
- RESPOND IN ${language.toUpperCase()}. The 'reasoning' and 'warningFlags' fields MUST be in ${language}. The enum values (categories, severity) MUST remain in English as defined in the schema.`,
      prompt: `The patient describes their condition as follows: "${transcript}"

Please categorize this condition and recommend the appropriate care type.`,
    });

    return Response.json({ data: object });
  } catch (error) {
    console.error("Triage error:", error);
    return Response.json(
      { error: "Failed to process triage request" },
      { status: 500 }
    );
  }
}
