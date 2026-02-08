"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Hospital, IncidentInfo, InsuranceInfo } from "@/lib/types";
import { CARE_TYPE_LABELS, PLAN_TYPE_LABELS, PROVIDER_LABELS } from "@/lib/types";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  Loader2,
  PhoneCall,
  RotateCcw,
  Shield,
  ExternalLink,
} from "lucide-react";

type CallState = "calling" | "success" | "error";

interface AgentCallResponse {
  callId: string | null;
  status: string;
  demo: boolean;
  dialedNumber?: string;
}

function stringifyError(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    return value.map((item) => stringifyError(item)).filter(Boolean).join("; ");
  }
  if (typeof value === "object") {
    const maybeMessage =
      (value as Record<string, unknown>).message ||
      (value as Record<string, unknown>).error ||
      (value as Record<string, unknown>).detail;
    if (maybeMessage) return stringifyError(maybeMessage);
    try {
      return JSON.stringify(value);
    } catch {
      return "";
    }
  }
  return "";
}

interface AgentCallStepProps {
  hospital: Hospital;
  incident: IncidentInfo;
  insurance: InsuranceInfo;
  onBack: () => void;
  onStartOver: () => void;
}

export function AgentCallStep({
  hospital,
  incident,
  insurance,
  onBack,
  onStartOver,
}: AgentCallStepProps) {
  const [callState, setCallState] = useState<CallState>("calling");
  const [error, setError] = useState<string | null>(null);
  const [callResponse, setCallResponse] = useState<AgentCallResponse | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [showConfigDialog, setShowConfigDialog] = useState(false);

  const patientSummary = useMemo(() => {
    const symptoms = incident.symptoms.length > 0 ? incident.symptoms.join(", ") : "not specified";
    return {
      careType: incident.careType ? CARE_TYPE_LABELS[incident.careType] : "Not specified",
      severity: incident.severity,
      symptoms,
      description: incident.description || "No free-text description provided.",
      provider: insurance.provider ? PROVIDER_LABELS[insurance.provider] : "Not provided",
      planType: insurance.planType ? PLAN_TYPE_LABELS[insurance.planType] : "Not provided",
    };
  }, [incident, insurance]);

  const placeCall = useCallback(async () => {
    setCallState("calling");
    setError(null);
    setCallResponse(null);

    try {
      const res = await fetch("/api/agent-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hospital,
          incident,
          insurance,
          appointmentTime: "asap", // Hardcoded to ASAP
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        // Check if this is the ElevenLabs configuration error
        if (json?.error === "ELEVENLABS_NOT_CONFIGURED") {
          setCallState("error");
          setShowConfigDialog(true);
          return;
        }

        const errorMessage =
          stringifyError(json?.error) ||
          stringifyError(json?.providerResponse) ||
          "Failed to start the ElevenLabs outbound call.";
        const statusPrefix = typeof json?.providerStatus === "number" ? `[${json.providerStatus}] ` : "";
        throw new Error(`${statusPrefix}${errorMessage}`);
      }

      setCallResponse({
        callId: json?.data?.callId || null,
        status: json?.data?.status || "initiated",
        demo: Boolean(json?.data?.demo),
        dialedNumber: json?.data?.dialedNumber || undefined,
      });
      setCallState("success");
    } catch (err) {
      setCallState("error");
      setError(err instanceof Error ? err.message : "Unable to start the call.");
    }
  }, [hospital, incident, insurance]);

  useEffect(() => {
    placeCall();
  }, [placeCall, attempt]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50">
          <PhoneCall className="h-6 w-6 text-teal-600" />
        </div>
        <div className="flex flex-col gap-1.5">
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Booking your ASAP appointment
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Our CareNet AI agent is calling {hospital.name} to book an appointment within the next 2-3 hours.
          </p>
        </div>
      </div>

      {callState === "calling" && (
        <div className="flex items-center gap-3 rounded-2xl border border-teal-200 bg-teal-50 px-5 py-4">
          <Loader2 className="h-5 w-5 shrink-0 animate-spin text-teal-600" />
          <div>
            <p className="text-sm font-semibold text-teal-700">Calling {hospital.name} for ASAP booking</p>
            <p className="mt-0.5 text-xs text-teal-700/80">
              Our agent is requesting an appointment within the next 2-3 hours with your insurance and medical details.
            </p>
          </div>
        </div>
      )}

      {callState === "success" && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <div>
            <p className="text-sm font-semibold text-emerald-700">Appointment booking in progress</p>
            <p className="mt-0.5 text-xs text-emerald-700/80">
              Our agent is speaking with {hospital.name} to book your ASAP appointment within 2-3 hours.
            </p>
            <p className="mt-1 text-xs text-emerald-700/80">
              Status: {callResponse?.status}
              {callResponse?.callId ? ` • Call ID: ${callResponse.callId}` : ""}
            </p>
            {callResponse?.dialedNumber && (
              <p className="mt-1 text-xs text-emerald-700/80">
                Dialed: {callResponse.dialedNumber}
              </p>
            )}
            {callResponse?.demo && (
              <p className="mt-1 text-xs font-semibold text-emerald-700">
                Demo mode: no real hospital was called.
              </p>
            )}
          </div>
        </div>
      )}

      {callState === "error" && (
        <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 px-5 py-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div>
            <p className="text-sm font-semibold text-destructive">Failed to start the call</p>
            <p className="mt-0.5 text-xs text-destructive/80">
              {error || "Something went wrong while reaching ElevenLabs."}
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border bg-card p-4">
          <h3 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Building2 className="h-3.5 w-3.5 text-primary" />
            Selected hospital
          </h3>
          <p className="text-sm font-semibold">{hospital.name}</p>
          <p className="mt-1 text-xs text-muted-foreground">{hospital.address}</p>
          <div className="mt-3 flex items-center gap-2">
            <Badge variant="secondary" className="rounded-lg text-[11px]">
              {hospital.distanceMiles} mi
            </Badge>
            <Badge variant="secondary" className="rounded-lg text-[11px]">
              ~{hospital.etaMinutes} min
            </Badge>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-4">
          <h3 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Shield className="h-3.5 w-3.5 text-primary" />
            Insurance details sent
          </h3>
          <p className="text-sm font-medium">{patientSummary.provider}</p>
          <p className="mt-1 text-xs text-muted-foreground">{patientSummary.planType}</p>
          {insurance.networkName && (
            <p className="mt-2 text-xs text-muted-foreground">Network: {insurance.networkName}</p>
          )}
          {insurance.memberZip && (
            <p className="mt-1 text-xs text-muted-foreground">ZIP: {insurance.memberZip}</p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-4">
        <h3 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Activity className="h-3.5 w-3.5 text-primary" />
          Incident context sent to the agent
        </h3>
        <div className="grid gap-2 text-xs sm:grid-cols-3">
          <p>
            <span className="font-semibold text-foreground">Care:</span>{" "}
            <span className="text-muted-foreground">{patientSummary.careType}</span>
          </p>
          <p>
            <span className="font-semibold text-foreground">Severity:</span>{" "}
            <span className="capitalize text-muted-foreground">{patientSummary.severity}</span>
          </p>
          <p>
            <span className="font-semibold text-foreground">Symptoms:</span>{" "}
            <span className="text-muted-foreground">{patientSummary.symptoms}</span>
          </p>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{patientSummary.description}</p>
      </div>

      <div className="flex items-center justify-between border-t pt-6">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 text-muted-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to results
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 rounded-xl bg-transparent"
            onClick={() => setAttempt((prev) => prev + 1)}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Retry call
          </Button>
          <Button
            size="sm"
            className="rounded-xl bg-teal-600 text-white hover:bg-teal-700"
            onClick={onStartOver}
          >
            Start over
          </Button>
        </div>
      </div>

      {/* ElevenLabs Configuration Dialog */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PhoneCall className="h-5 w-5 text-blue-600" />
              AI Booking Agent Not Available
            </DialogTitle>
            <DialogDescription className="space-y-4 pt-4">
              <p>
                The AI booking agent feature requires ElevenLabs API configuration. This is an optional premium feature.
              </p>

              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm font-semibold text-blue-900 mb-2">You can still use CareNet to:</p>
                <ul className="space-y-1 text-sm text-blue-800">
                  <li>✓ Find nearby hospitals and urgent care</li>
                  <li>✓ Check insurance coverage</li>
                  <li>✓ Compare costs</li>
                  <li>✓ Get directions</li>
                  <li>✓ Call hospitals directly</li>
                </ul>
              </div>

              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-xs font-semibold text-amber-900 mb-1">For App Owners:</p>
                <p className="text-xs text-amber-800">
                  To enable this feature, configure ELEVENLABS_API_KEY, ELEVENLABS_AGENT_ID, and ELEVENLABS_AGENT_PHONE_NUMBER_ID in your Vercel environment variables.
                </p>
              </div>

              <p className="text-xs text-muted-foreground">
                💡 <strong>Tip:</strong> You can call the hospital directly using the phone number shown on the hospital card.
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowConfigDialog(false)}>
              Close
            </Button>
            <Button onClick={onBack}>
              Back to Results
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
