"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import type {
  TriageResult,
  IncidentInfo,
  CareType,
  Symptom,
  Severity,
} from "@/lib/types";
import {
  RECOMMENDED_CARE_LABELS,
  TRIAGE_SEVERITY_LABELS,
  SYMPTOM_LABELS,
} from "@/lib/types";
import {
  Mic,
  MicOff,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Siren,
  Activity,
  Stethoscope,
  Heart,
  Home,
  Phone,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { useTranslation } from "@/components/language-provider";
import { LANGUAGES } from "@/lib/languages";

interface VoiceTriageProps {
  onApplyTriage: (updates: Partial<IncidentInfo> & { description: string }) => void;
  language?: string;
}

type RecordingState = "idle" | "recording" | "processing" | "done" | "error";

const CARE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "self-care": Home,
  "primary-care": Stethoscope,
  specialist: Heart,
  "urgent-care": Activity,
  "emergency-room": Siren,
};

const CARE_COLORS: Record<string, { bg: string; text: string; border: string; ring: string }> = {
  // ... existing colors
  "self-care": {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    ring: "ring-emerald-500",
  },
  "primary-care": {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    ring: "ring-blue-500",
  },
  specialist: {
    bg: "bg-violet-50",
    text: "text-violet-700",
    border: "border-violet-200",
    ring: "ring-violet-500",
  },
  "urgent-care": {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    ring: "ring-amber-500",
  },
  "emergency-room": {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    ring: "ring-red-500",
  },
};

const SEVERITY_COLORS: Record<string, string> = {
  low: "bg-emerald-100 text-emerald-700",
  moderate: "bg-amber-100 text-amber-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
};

export function VoiceTriage({ onApplyTriage }: VoiceTriageProps) {
  const { t, language } = useTranslation();
  const [state, setState] = useState<RecordingState>("idle");
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [speechSupported, setSpeechSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const pulseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
    }
  }, []);

  const startRecording = useCallback(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in this browser. Please try Chrome or Edge.");
      setState("error");
      return;
    }

    setError(null);
    setTranscript("");
    setInterimTranscript("");
    setTriageResult(null);

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    // Set recognition language based on current selection
    const speechLang = LANGUAGES.find(l => l.code === language)?.speechCode || "en-US";
    recognition.lang = speechLang;

    recognition.onstart = () => {
      setState("recording");
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let final = "";
      let interim = "";

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (final) setTranscript(final);
      setInterimTranscript(interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "no-speech") {
        setError("No speech detected. Please try again and speak clearly.");
      } else if (event.error === "not-allowed") {
        setError("Microphone access denied. Please allow microphone access in your browser settings.");
      } else {
        setError(`Speech recognition error: ${event.error}`);
      }
      setState("error");
    };

    recognition.onend = () => {
      // Only set idle if not already processing
      if (state === "recording") {
        setState("idle");
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [state]);

  const stopRecording = useCallback(async () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    const fullTranscript = transcript + (interimTranscript ? " " + interimTranscript : "");
    setTranscript(fullTranscript.trim());
    setInterimTranscript("");

    if (!fullTranscript.trim()) {
      setError("No speech was detected. Please try again.");
      setState("error");
      return;
    }

    setState("processing");

    try {
      // Get the full language name for the prompt
      const currentLang = LANGUAGES.find(l => l.code === language)?.name || "English";

      const res = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: fullTranscript.trim(),
          language: currentLang
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to process triage");
      }

      const json = await res.json();
      if (json.data) {
        setTriageResult(json.data);
        setState("done");
      } else {
        throw new Error(json.error || "Unknown error");
      }
    } catch (err) {
      setError("Failed to analyze symptoms. Please try again.");
      setState("error");
    }
  }, [transcript, interimTranscript]);

  const reset = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setState("idle");
    setTranscript("");
    setInterimTranscript("");
    setTriageResult(null);
    setError(null);
  }, []);

  const handleApply = useCallback(() => {
    if (!triageResult) return;
    onApplyTriage({
      description: transcript,
      careType: triageResult.suggestedCareType as CareType,
      symptoms: triageResult.suggestedSymptoms as Symptom[],
      severity: triageResult.suggestedSeverity as Severity,
    });
  }, [triageResult, transcript, onApplyTriage]);

  if (!speechSupported) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
        <MicOff className="h-5 w-5 shrink-0 text-amber-600" />
        <div>
          <p className="text-sm font-semibold text-amber-800">
            Voice input not available
          </p>
          <p className="mt-0.5 text-xs text-amber-600">
            Speech recognition is not supported in this browser. Please use
            Chrome, Edge, or Safari for voice input.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Recording area */}
      {state === "idle" && !triageResult && (
        <div className="flex flex-col items-center gap-5 rounded-2xl border border-dashed border-blue-200 bg-blue-50/30 px-6 py-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <Mic className="h-7 w-7 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {t("triage.voice_instruction")}
              </p>
              <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                {t("triage.voice_subtext")}
              </p>
            </div>
          </div>
          <Button
            onClick={startRecording}
            className="h-12 gap-2 rounded-2xl bg-blue-600 px-6 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition-all hover:bg-blue-700 hover:shadow-lg active:scale-[0.98]"
          >
            <Mic className="h-4 w-4" />
            {t("triage.start_speaking")}
          </Button>
        </div>
      )}

      {state === "recording" && (
        <div className="flex flex-col items-center gap-5 rounded-2xl border border-red-200 bg-red-50/30 px-6 py-8">
          <div className="relative flex items-center justify-center">
            <div
              ref={pulseRef}
              className="absolute h-20 w-20 animate-ping rounded-full bg-red-200 opacity-40"
              style={{ animationDuration: "1.5s" }}
            />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-red-500 shadow-lg shadow-red-500/30">
              <Mic className="h-7 w-7 text-white" />
            </div>
          </div>
          <div className="flex flex-col items-center gap-1 text-center">
            <p className="text-sm font-semibold text-red-700">
              {t("triage.listening")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("triage.voice_instruction")}
            </p>
          </div>

          {/* Live transcript */}
          {(transcript || interimTranscript) && (
            <div className="w-full rounded-xl border bg-card px-4 py-3">
              <p className="text-xs font-medium text-muted-foreground">
                Transcript
              </p>
              <p className="mt-1 text-sm text-foreground">
                {transcript}
                {interimTranscript && (
                  <span className="text-muted-foreground">
                    {transcript ? " " : ""}
                    {interimTranscript}
                  </span>
                )}
              </p>
            </div>
          )}

          <Button
            onClick={stopRecording}
            variant="destructive"
            className="h-12 gap-2 rounded-2xl px-6 text-sm font-semibold shadow-md transition-all active:scale-[0.98]"
          >
            <MicOff className="h-4 w-4" />
            {t("triage.stop")}
          </Button>
        </div>
      )}

      {state === "processing" && (
        <div className="flex flex-col items-center gap-5 rounded-2xl border bg-card px-6 py-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
            <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
          </div>
          <div className="flex flex-col items-center gap-1 text-center">
            <p className="text-sm font-semibold text-foreground">
              {t("triage.analyzing")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("triage.voice_subtext").split(".")[1] || "AI is categorizing your condition."}
            </p>
          </div>
          {transcript && (
            <div className="w-full rounded-xl border bg-muted/30 px-4 py-3">
              <p className="text-xs font-medium text-muted-foreground">
                Your description
              </p>
              <p className="mt-1 text-sm text-foreground">{transcript}</p>
            </div>
          )}
        </div>
      )}

      {state === "error" && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-red-200 bg-red-50/50 px-6 py-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-red-700">
              Something went wrong
            </p>
            <p className="mt-1 text-xs text-red-600/80">{error}</p>
          </div>
          <Button
            onClick={reset}
            variant="outline"
            className="gap-1.5 rounded-xl text-sm"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {t("triage.try_again")}
          </Button>
        </div>
      )}

      {/* Triage result */}
      {state === "done" && triageResult && (
        <div className="flex flex-col gap-4">
          {/* Recommended care - hero card */}
          <div
            className={cn(
              "flex flex-col gap-4 rounded-2xl border-2 px-5 py-5",
              CARE_COLORS[triageResult.recommendedCare]?.border,
              CARE_COLORS[triageResult.recommendedCare]?.bg
            )}
          >
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
                  triageResult.recommendedCare === "emergency-room"
                    ? "bg-red-100"
                    : triageResult.recommendedCare === "urgent-care"
                      ? "bg-amber-100"
                      : "bg-white/80"
                )}
              >
                {(() => {
                  const Icon =
                    CARE_ICONS[triageResult.recommendedCare] || Activity;
                  return (
                    <Icon
                      className={cn(
                        "h-6 w-6",
                        CARE_COLORS[triageResult.recommendedCare]?.text
                      )}
                    />
                  );
                })()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Sparkles
                    className={cn(
                      "h-3.5 w-3.5",
                      CARE_COLORS[triageResult.recommendedCare]?.text
                    )}
                  />
                  <span
                    className={cn(
                      "text-[11px] font-semibold uppercase tracking-wider",
                      CARE_COLORS[triageResult.recommendedCare]?.text
                    )}
                  >
                    AI Recommendation
                  </span>
                </div>
                <h3
                  className={cn(
                    "mt-1 text-lg font-bold",
                    CARE_COLORS[triageResult.recommendedCare]?.text
                  )}
                >
                  {RECOMMENDED_CARE_LABELS[triageResult.recommendedCare]}
                </h3>
                <p className="mt-1 text-sm text-foreground/80">
                  {triageResult.reasoning}
                </p>
              </div>
            </div>

            {/* Severity + Category badges */}
            <div className="flex flex-wrap gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
                  SEVERITY_COLORS[triageResult.severity]
                )}
              >
                {TRIAGE_SEVERITY_LABELS[triageResult.severity]} severity
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1 text-xs font-semibold text-foreground">
                {triageResult.injuryCategory}
              </span>
            </div>
          </div>

          {/* Warning flags */}
          {triageResult.warningFlags.length > 0 && (
            <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
              <div>
                <p className="text-sm font-semibold text-red-700">
                  Warning flags
                </p>
                <ul className="mt-1.5 flex flex-col gap-1">
                  {triageResult.warningFlags.map((flag, i) => (
                    <li key={i} className="text-xs text-red-600/80">
                      {flag}
                    </li>
                  ))}
                </ul>
                {triageResult.recommendedCare === "emergency-room" && (
                  <p className="mt-2 text-xs font-semibold text-red-700">
                    If this is a life-threatening emergency, call{" "}
                    <a
                      href="tel:911"
                      className="inline-flex items-center gap-1 underline"
                    >
                      <Phone className="h-3 w-3" />
                      911
                    </a>{" "}
                    immediately.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Matched symptoms */}
          {triageResult.suggestedSymptoms.length > 0 && (
            <div className="rounded-xl border bg-card px-4 py-3">
              <p className="text-xs font-medium text-muted-foreground">
                Detected symptoms
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {triageResult.suggestedSymptoms.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    {SYMPTOM_LABELS[s]}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Transcript */}
          <div className="rounded-xl border bg-muted/30 px-4 py-3">
            <p className="text-xs font-medium text-muted-foreground">
              Your description
            </p>
            <p className="mt-1 text-sm text-foreground">{transcript}</p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={reset}
              className="gap-1.5 rounded-xl text-sm"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {t("triage.try_again")}
            </Button>
            <Button
              onClick={handleApply}
              className="flex-1 h-11 gap-2 rounded-2xl bg-blue-600 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition-all hover:bg-blue-700 hover:shadow-lg active:scale-[0.98]"
            >
              {t("triage.apply")}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Disclaimer */}
          <p className="text-center text-[10px] text-muted-foreground">
            This AI triage is not a medical diagnosis. Always seek professional
            medical advice for health concerns.
          </p>
        </div>
      )}
    </div>
  );
}
