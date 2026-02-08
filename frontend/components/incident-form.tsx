"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { IncidentInfo, CareType, Symptom, Severity } from "@/lib/types";
import { CARE_TYPE_LABELS, SYMPTOM_LABELS } from "@/lib/types";
import { VoiceTriage } from "@/components/voice-triage";
import {
  ArrowLeft,
  ArrowRight,
  Activity,
  AlertTriangle,
  Phone,
  Siren,
  HeartPulse,
  Flame,
  Brain,
  ThermometerSun,
  Bone,
  Droplets,
  CircleAlert,
  HelpCircle,
  Mic,
  PenLine,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/components/language-provider";


interface IncidentFormProps {
  data: IncidentInfo;
  onChange: (data: IncidentInfo) => void;
  onBack?: () => void;
  onSubmit: () => void;
}

const SYMPTOM_ICONS: Record<Symptom, React.ComponentType<{ className?: string }>> = {
  "chest-pain": HeartPulse,
  stroke: Brain,
  "major-bleeding": Droplets,
  "broken-bone": Bone,
  "severe-burn": Flame,
  "allergic-reaction": CircleAlert,
  "high-fever": ThermometerSun,
  "head-injury": Brain,
  other: HelpCircle,
};

const CARE_TYPE_ICONS: Record<CareType, React.ComponentType<{ className?: string }>> = {
  emergency: Siren,
  urgent: Activity,
  "not-sure": HelpCircle,
};

const CARE_TYPE_DESCRIPTIONS: Record<CareType, string> = {
  emergency: "Life-threatening or severe condition requiring immediate attention",
  urgent: "Non-life-threatening but needs prompt medical care today",
  "not-sure": "We'll help match you based on your symptoms and severity",
};

export function IncidentForm({
  data,
  onChange,
  onBack,
  onSubmit,
}: IncidentFormProps) {
  const { t } = useTranslation();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [inputMode, setInputMode] = useState<"voice" | "manual">("voice");

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!data.careType) e.careType = "Select a care type to continue";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function toggleSymptom(s: Symptom) {
    const next = data.symptoms.includes(s)
      ? data.symptoms.filter((x) => x !== s)
      : [...data.symptoms, s];
    onChange({ ...data, symptoms: next });
  }

  const severityOptions: {
    value: Severity;
    label: string;
    description: string;
    color: string;
    activeBg: string;
  }[] = [
      {
        value: "mild",
        label: t("severity.mild"),
        description: t("severity_desc.mild"),
        color: "text-blue-600",
        activeBg: "bg-blue-600",
      },
      {
        value: "moderate",
        label: t("severity.moderate"),
        description: t("severity_desc.moderate"),
        color: "text-amber-600",
        activeBg: "bg-amber-500",
      },
      {
        value: "severe",
        label: t("severity.severe"),
        description: t("severity_desc.severe"),
        color: "text-red-600",
        activeBg: "bg-red-600",
      },
    ];

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50">
          <Activity className="h-6 w-6 text-blue-600" />
        </div>
        <div className="flex flex-col gap-1.5">
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
            {t("incident.title")}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("incident.subtitle")}
          </p>
        </div>
      </div>

      {/* Emergency alert */}
      {data.severity === "severe" && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <div>
            <p className="text-sm font-semibold text-red-700">
              {t("incident.emergency_alert")}
            </p>
            <p className="mt-1 text-xs text-red-600/80">
              {t("incident.emergency_action")}
            </p>
          </div>
        </div>
      )}

      {/* Input mode toggle */}
      <div className="flex items-center gap-1 rounded-2xl border bg-muted/40 p-1">
        <button
          type="button"
          onClick={() => setInputMode("voice")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all",
            inputMode === "voice"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Mic className="h-4 w-4" />
          {t("triage.voice_btn")}
        </button>
        <button
          type="button"
          onClick={() => setInputMode("manual")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all",
            inputMode === "manual"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <PenLine className="h-4 w-4" />
          {t("triage.manual_btn")}
        </button>
      </div>

      {/* Voice triage */}
      {inputMode === "voice" && (
        <VoiceTriage
          onApplyTriage={(updates) => {
            onChange({
              ...data,
              description: updates.description,
              careType: updates.careType || data.careType,
              symptoms: updates.symptoms || data.symptoms,
              severity: updates.severity || data.severity,
            });
            setInputMode("manual");
          }}
        />
      )}

      {/* Manual form */}
      <div className={cn("flex flex-col gap-8", inputMode === "voice" && "hidden")}>
        {/* Description */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="description" className="text-sm font-medium">
            {t("incident.description")}{" "}
            <span className="text-xs text-muted-foreground">({t("insurance.optional")})</span>
          </Label>
          <Textarea
            id="description"
            placeholder={t("incident.description_placeholder")}
            value={data.description}
            onChange={(e) =>
              onChange({ ...data, description: e.target.value })
            }
            rows={3}
            className="resize-none"
          />
        </div>

        {/* Care type - visual cards */}
        <div className="flex flex-col gap-3">
          <Label className="text-sm font-medium">{t("incident.care_type")}</Label>
          <RadioGroup
            value={data.careType}
            onValueChange={(v) =>
              onChange({ ...data, careType: v as CareType })
            }
          >
            {(Object.keys(CARE_TYPE_LABELS) as CareType[]).map((key) => {
              const Icon = CARE_TYPE_ICONS[key];
              const isActive = data.careType === key;
              return (
                <label
                  key={key}
                  className={cn(
                    "flex cursor-pointer items-start gap-4 rounded-2xl border px-5 py-4 transition-all",
                    isActive
                      ? "border-blue-200 bg-blue-50/50 shadow-sm"
                      : "hover:border-muted-foreground/20 hover:bg-muted/30"
                  )}
                >
                  <RadioGroupItem
                    value={key}
                    id={`care-${key}`}
                    className="mt-0.5"
                  />
                  <div className="flex flex-1 items-start gap-3">
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                        isActive ? "bg-blue-100" : "bg-muted"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-5 w-5",
                          isActive
                            ? "text-blue-600"
                            : "text-muted-foreground"
                        )}
                      />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span
                        className={cn(
                          "text-sm",
                          isActive
                            ? "font-semibold text-foreground"
                            : "font-medium text-foreground"
                        )}
                      >
                        {t(`care_type.${key}`)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {t(`care_desc.${key}`)}
                      </span>
                    </div>
                  </div>
                </label>
              );
            })}
          </RadioGroup>
          {errors.careType && (
            <p className="text-xs text-destructive">{errors.careType}</p>
          )}
        </div>

        {/* Symptoms with icons */}
        <div className="flex flex-col gap-3">
          <div>
            <Label className="text-sm font-medium">{t("incident.symptoms")}</Label>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t("incident.symptoms_hint")}
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {(Object.keys(SYMPTOM_LABELS) as Symptom[]).map((key) => {
              const Icon = SYMPTOM_ICONS[key];
              const isChecked = data.symptoms.includes(key);
              return (
                <label
                  key={key}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-all",
                    isChecked
                      ? "border-blue-200 bg-blue-50/50 shadow-sm"
                      : "hover:border-muted-foreground/20 hover:bg-muted/30"
                  )}
                >
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={() => toggleSymptom(key)}
                  />
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      isChecked
                        ? "text-blue-600"
                        : "text-muted-foreground"
                    )}
                  />
                  <span className="text-sm leading-snug">
                    {t(`symptom.${key}`)}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Severity with visual scale */}
        <div className="flex flex-col gap-3">
          <Label className="text-sm font-medium">
            {t("incident.severity")}
          </Label>
          <div className="grid grid-cols-3 gap-2">
            {severityOptions.map((opt) => {
              const isActive = data.severity === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    onChange({ ...data, severity: opt.value })
                  }
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-2xl border px-3 py-4 text-center transition-all",
                    isActive
                      ? `${opt.activeBg} text-white shadow-lg`
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  <span className="text-sm font-bold">{opt.label}</span>
                  <span
                    className={cn(
                      "text-[11px]",
                      isActive
                        ? "text-white/80"
                        : "text-muted-foreground"
                    )}
                  >
                    {opt.description}
                  </span>
                </button>
              );
            })}
          </div>
          {/* Visual severity bar */}
          <div className="flex items-center gap-2 px-1">
            <div className="flex flex-1 gap-1">
              <div
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors",
                  data.severity === "mild"
                    ? "bg-blue-500"
                    : data.severity === "moderate"
                      ? "bg-amber-500"
                      : "bg-red-500"
                )}
              />
              <div
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors",
                  data.severity === "moderate"
                    ? "bg-amber-500"
                    : data.severity === "severe"
                      ? "bg-red-500"
                      : "bg-muted"
                )}
              />
              <div
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors",
                  data.severity === "severe"
                    ? "bg-red-500"
                    : "bg-muted"
                )}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between border-t pt-6">
        {onBack ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="gap-1.5 text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("insurance.back")}
          </Button>
        ) : (
          <div /> // Spacer to keep Continue button on the right
        )}
        <Button
          onClick={() => {
            if (validate()) onSubmit();
          }}
          className="h-11 rounded-2xl bg-blue-600 px-7 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition-all hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/25 active:scale-[0.98]"
        >
          {t("insurance.continue")}
          <ArrowRight className="ml-1.5 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
