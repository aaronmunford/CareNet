import { z } from "zod";

const hospitalSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string(),
  phone: z.string(),
});

const incidentSchema = z.object({
  description: z.string().optional().default(""),
  careType: z.enum(["emergency", "urgent", "not-sure", ""]).optional().default(""),
  symptoms: z
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
    .optional()
    .default([]),
  severity: z.enum(["mild", "moderate", "severe"]).optional().default("moderate"),
});

const insuranceSchema = z.object({
  provider: z
    .enum(["aetna", "anthem", "cigna", "united", "medicare", "medicaid", "other", ""])
    .optional()
    .default(""),
  planType: z
    .enum([
      "hmo",
      "ppo",
      "epo",
      "medicaid-managed",
      "medicare-advantage",
      "original-medicare",
      "unknown",
      "",
    ])
    .optional()
    .default(""),
  networkName: z.string().optional().default(""),
  memberZip: z.string().optional().default(""),
});

const requestSchema = z.object({
  hospital: hospitalSchema,
  incident: incidentSchema,
  insurance: insuranceSchema,
  appointmentTime: z.enum(["asap", "today", "tomorrow", "this-week"]).optional().default("asap"),
});

function isDemoModeEnabled(): boolean {
  const value = process.env.ELEVENLABS_DEMO_MODE;
  return value === "1" || value === "true" || value === "yes";
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toE164US(phone: string): string | null {
  const digitsOnly = phone.replace(/\D/g, "");
  if (digitsOnly.length === 10) return `+1${digitsOnly}`;
  if (digitsOnly.length === 11 && digitsOnly.startsWith("1")) return `+${digitsOnly}`;
  return null;
}

function getToNumber(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("+")) return trimmed;
  return toE164US(trimmed);
}

function formatProviderError(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    return value.map((item) => formatProviderError(item)).join("; ");
  }
  if (typeof value === "object") {
    const maybeMessage =
      (value as Record<string, unknown>).message ||
      (value as Record<string, unknown>).error ||
      (value as Record<string, unknown>).detail;
    if (maybeMessage) return formatProviderError(maybeMessage);
    try {
      return JSON.stringify(value);
    } catch {
      return "";
    }
  }
  return "";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        {
          error: "Invalid request payload",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { hospital, incident, insurance, appointmentTime } = parsed.data;

    // Calculate appointment time - hardcoded to ASAP (within next 1-3 hours)
    const now = new Date();
    const appointmentDate = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now
    const appointmentTimeStr = appointmentDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    const appointmentDateStr = appointmentDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });

    const overrideToNumberRaw = process.env.ELEVENLABS_CALL_TO_NUMBER_OVERRIDE;
    const overrideToNumber = overrideToNumberRaw ? getToNumber(overrideToNumberRaw) : null;

    if (overrideToNumberRaw && !overrideToNumber) {
      return Response.json(
        {
          error:
            "Invalid ELEVENLABS_CALL_TO_NUMBER_OVERRIDE. Use E.164 format (e.g. +15551234567) or a US number.",
        },
        { status: 500 }
      );
    }

    if (isDemoModeEnabled()) {
      await delay(1200);
      return Response.json({
        data: {
          callId: `demo-${hospital.id}-${Date.now()}`,
          status: "simulated",
          demo: true,
          providerResponse: {
            message: "Demo mode enabled. No real outbound call was placed.",
            hospital: hospital.name,
          },
        },
      });
    }

    const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
    const agentId = process.env.ELEVENLABS_AGENT_ID;
    const agentPhoneNumberId = process.env.ELEVENLABS_AGENT_PHONE_NUMBER_ID;
    const outboundUrl =
      process.env.ELEVENLABS_OUTBOUND_CALL_URL ||
      "https://api.elevenlabs.io/v1/convai/twilio/outbound-call";

    if (!elevenLabsApiKey || !agentId || !agentPhoneNumberId) {
      return Response.json(
        {
          error:
            "Missing ElevenLabs configuration. Set ELEVENLABS_API_KEY, ELEVENLABS_AGENT_ID, and ELEVENLABS_AGENT_PHONE_NUMBER_ID.",
        },
        { status: 500 }
      );
    }

    const toNumber = overrideToNumber || toE164US(hospital.phone);

    if (!toNumber) {
      return Response.json(
        {
          error: `Hospital phone number is not a valid US number: ${hospital.phone}`,
        },
        { status: 400 }
      );
    }

    const payload = {
      agent_id: agentId,
      agent_phone_number_id: agentPhoneNumberId,
      to_number: toNumber,
      conversation_initiation_client_data: {
        dynamic_variables: {
          hospital_name: hospital.name,
          hospital_address: hospital.address,
          hospital_phone: hospital.phone,
          incident_description: incident.description || "Not provided",
          incident_care_type: incident.careType || "not-sure",
          incident_severity: incident.severity,
          incident_symptoms: incident.symptoms.join(", ") || "none specified",
          insurance_provider: insurance.provider || "unknown",
          insurance_plan_type: insurance.planType || "unknown",
          insurance_network_name: insurance.networkName || "not provided",
          insurance_member_zip: insurance.memberZip || "not provided",
          appointment_preference: "ASAP",
          appointment_time: appointmentTimeStr,
          appointment_date: appointmentDateStr,
          appointment_window: "within the next 2-3 hours",
        },
      },
    };

    const elevenLabsRes = await fetch(outboundUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": elevenLabsApiKey,
      },
      body: JSON.stringify(payload),
    });

    const responseBody = await elevenLabsRes.json().catch(() => null);

    if (!elevenLabsRes.ok) {
      const providerError =
        formatProviderError(responseBody?.detail) ||
        formatProviderError(responseBody?.error) ||
        `ElevenLabs request failed with ${elevenLabsRes.status}`;
      return Response.json(
        {
          error: providerError,
          providerStatus: elevenLabsRes.status,
          providerResponse: responseBody,
        },
        { status: 502 }
      );
    }

    const callId =
      responseBody?.conversation_id ||
      responseBody?.call_id ||
      responseBody?.sid ||
      null;
    const status = responseBody?.status || "initiated";

    return Response.json({
      data: {
        callId,
        status,
        demo: false,
        dialedNumber: toNumber,
        providerResponse: responseBody,
      },
    });
  } catch (error) {
    console.error("Agent call error:", error);
    return Response.json(
      { error: "Failed to initiate ElevenLabs outbound call" },
      { status: 500 }
    );
  }
}
