"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CardScanner } from "@/components/card-scanner";
import type { InsuranceInfo, InsuranceProvider, PlanType } from "@/lib/types";
import { PROVIDER_LABELS, PLAN_TYPE_LABELS } from "@/lib/types";
import {
  ArrowLeft,
  ArrowRight,
  Shield,
  HelpCircle,
  Lock,
  Sparkles,
  Info,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/components/language-provider";
import { useAuth } from "@/lib/auth-context";
import { AuthDialog } from "@/components/auth-dialog";


interface InsuranceFormProps {
  data: InsuranceInfo;
  onChange: (data: InsuranceInfo) => void;
  onBack: () => void;
  onContinue: () => void;
}

const PROVIDER_INFO: Record<string, string> = {
  aetna: "Covers most major Manhattan hospitals",
  anthem: "Broad network coverage in NYC area",
  cigna: "Extensive in-network options available",
  united: "Largest commercial health insurer",
  medicare: "Accepted at all participating hospitals",
  medicaid: "Public hospitals offer full coverage",
  other: "Coverage varies by plan",
};

export function InsuranceForm({
  data,
  onChange,
  onBack,
  onContinue,
}: InsuranceFormProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!data.provider) newErrors.provider = t("insurance.provider_placeholder");
    if (!data.planType) newErrors.planType = t("insurance.plan_type_placeholder");
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header with illustration */}
      <div className="flex flex-col gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50">
          <Shield className="h-6 w-6 text-blue-600" />
        </div>
        <div className="flex flex-col gap-1.5">
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
            {t("insurance.title")}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("insurance.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50/50 px-4 py-2.5">
          <Lock className="h-3.5 w-3.5 shrink-0 text-blue-600" />
          <p className="text-xs text-blue-700">
            {t("insurance.privacy")}
          </p>
        </div>

        {/* Auth Prompt for non-signed-in users */}
        {!user && (
          <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50/50 px-4 py-3">
            <UserPlus className="h-4 w-4 shrink-0 text-green-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900">
                Save your insurance information
              </p>
              <p className="mt-1 text-xs text-green-700">
                Create an account to save your insurance details and track your medical history across visits.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 border-green-200 bg-white text-green-700 hover:bg-green-50"
                onClick={() => setShowAuthDialog(true)}
              >
                Sign Up / Sign In
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Auth Dialog */}
      <AuthDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        defaultMode="signup"
      />

      {/* Card scanner with context */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-semibold text-foreground">
            {t("insurance.quick_scan")}
          </span>
          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600">
            {t("insurance.fastest")}
          </span>
        </div>
        <CardScanner
          onExtracted={(extracted) => {
            onChange({
              ...data,
              ...(extracted.provider && { provider: extracted.provider }),
              ...(extracted.planType && { planType: extracted.planType }),
              ...(extracted.networkName !== undefined && {
                networkName: extracted.networkName,
              }),
              ...(extracted.memberZip !== undefined && {
                memberZip: extracted.memberZip,
              }),
              ...(extracted.patientName !== undefined && {
                patientName: extracted.patientName,
              }),
              ...(extracted.dateOfBirth !== undefined && {
                dateOfBirth: extracted.dateOfBirth,
              }),
            });
          }}
        />
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs font-medium text-muted-foreground">
          {t("insurance.or_manual")}
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Form fields */}
      <div className="flex flex-col gap-5">
        {/* Patient Name & DOB - Optional */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="patientName"
              className="flex items-center gap-1 text-sm font-medium"
            >
              Patient Name
              <span className="text-xs text-muted-foreground">({t("insurance.optional")})</span>
            </Label>
            <Input
              id="patientName"
              placeholder="John Doe"
              className="h-11"
              value={data.patientName || ""}
              onChange={(e) =>
                onChange({ ...data, patientName: e.target.value })
              }
            />
            <p className="text-[11px] text-muted-foreground">
              Name as it appears on card
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="dateOfBirth"
              className="flex items-center gap-1 text-sm font-medium"
            >
              Date of Birth
              <span className="text-xs text-muted-foreground">({t("insurance.optional")})</span>
            </Label>
            <Input
              id="dateOfBirth"
              type="date"
              className="h-11"
              value={data.dateOfBirth || ""}
              onChange={(e) =>
                onChange({ ...data, dateOfBirth: e.target.value })
              }
            />
            <p className="text-[11px] text-muted-foreground">
              Member date of birth
            </p>
          </div>
        </div>

        {/* Provider */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="provider" className="text-sm font-medium">
            {t("insurance.provider")}
          </Label>
          <Select
            value={data.provider}
            onValueChange={(v) =>
              onChange({ ...data, provider: v as InsuranceProvider })
            }
          >
            <SelectTrigger
              id="provider"
              className={cn(
                "h-11",
                errors.provider ? "border-destructive" : ""
              )}
            >
              <SelectValue placeholder={t("insurance.provider_placeholder")} />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(PROVIDER_LABELS) as InsuranceProvider[]).map(
                (key) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <span>{PROVIDER_LABELS[key]}</span>
                    </div>
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
          {errors.provider && (
            <p className="text-xs text-destructive">{errors.provider}</p>
          )}
          {data.provider && PROVIDER_INFO[data.provider] && (
            <div className="flex items-center gap-1.5 text-xs text-blue-600">
              <Info className="h-3 w-3" />
              {PROVIDER_INFO[data.provider]}
            </div>
          )}
        </div>

        {/* Plan type */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="planType" className="text-sm font-medium">
            {t("insurance.plan_type")}
          </Label>
          <Select
            value={data.planType}
            onValueChange={(v) =>
              onChange({ ...data, planType: v as PlanType })
            }
          >
            <SelectTrigger
              id="planType"
              className={cn(
                "h-11",
                errors.planType ? "border-destructive" : ""
              )}
            >
              <SelectValue placeholder={t("insurance.plan_type_placeholder")} />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(PLAN_TYPE_LABELS) as PlanType[]).map((key) => (
                <SelectItem key={key} value={key}>
                  {PLAN_TYPE_LABELS[key]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.planType && (
            <p className="text-xs text-destructive">{errors.planType}</p>
          )}
          {data.planType && (
            <p className="text-xs text-muted-foreground">
              {data.planType === "hmo"
                ? "HMO plans typically require referrals and have lower out-of-pocket costs."
                : data.planType === "ppo"
                  ? "PPO plans offer more flexibility in choosing hospitals and doctors."
                  : data.planType === "epo"
                    ? "EPO plans cover only in-network providers except in emergencies."
                    : "Coverage details vary by specific plan."}
            </p>
          )}
        </div>

        {/* Network & ZIP */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="networkName"
              className="flex items-center gap-1 text-sm font-medium"
            >
              {t("insurance.network")}
              <span className="text-xs text-muted-foreground">{t("insurance.optional")}</span>
            </Label>
            <Input
              id="networkName"
              placeholder="e.g. Open Access Plus"
              className="h-11"
              value={data.networkName}
              onChange={(e) =>
                onChange({ ...data, networkName: e.target.value })
              }
            />
            <p className="text-[11px] text-muted-foreground">
              {t("insurance.network_hint")}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="memberZip"
              className="flex items-center gap-1 text-sm font-medium"
            >
              {t("insurance.zip")}
              <span className="text-xs text-muted-foreground">{t("insurance.optional")}</span>
            </Label>
            <Input
              id="memberZip"
              placeholder="10001"
              className="h-11"
              value={data.memberZip}
              maxLength={5}
              onChange={(e) =>
                onChange({
                  ...data,
                  memberZip: e.target.value.replace(/\D/g, ""),
                })
              }
            />
            <p className="text-[11px] text-muted-foreground">
              {t("insurance.zip_hint")}
            </p>
          </div>
        </div>

        {/* In-network toggle */}
        <div className="flex items-center justify-between rounded-xl border bg-card px-5 py-4">
          <div className="flex flex-col gap-0.5">
            <Label
              htmlFor="preferInNetwork"
              className="cursor-pointer text-sm font-medium"
            >
              {t("insurance.prefer_network")}
            </Label>
            <p className="text-[11px] text-muted-foreground">
              {t("insurance.prefer_network_hint")}
            </p>
          </div>
          <Switch
            id="preferInNetwork"
            checked={data.preferInNetwork}
            onCheckedChange={(checked) =>
              onChange({ ...data, preferInNetwork: checked })
            }
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between border-t pt-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-1.5 text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("insurance.back")}
        </Button>
        <Button
          onClick={() => {
            if (validate()) onContinue();
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
