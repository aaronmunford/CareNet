"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Hospital } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  MapPin,
  Clock,
  Phone,
  Navigation,
  ChevronRight,
  Shield,
  DollarSign,
  AlertTriangle,
} from "lucide-react";
import { useTranslation } from "@/components/language-provider";

interface HospitalCardProps {
  hospital: Hospital;
  rank: number;
  onViewDetails: (hospital: Hospital) => void;
  onCallHospital?: (hospital: Hospital) => void;
  onBook?: (hospital: Hospital) => void;
}

function ConfidenceBadge({ confidence }: { confidence: "verified" | "likely" | "unknown" | "out_of_network" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
        confidence === "verified" && "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]",
        confidence === "likely" && "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]",
        confidence === "out_of_network" && "bg-red-100 text-red-700",
        confidence === "unknown" && "bg-muted text-muted-foreground"
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          confidence === "verified" && "bg-[hsl(var(--success))]",
          confidence === "likely" && "bg-[hsl(var(--warning))]",
          confidence === "out_of_network" && "bg-red-500",
          confidence === "unknown" && "bg-muted-foreground"
        )}
      />
      <span>
        {confidence === "verified" ? "In Network" :
          confidence === "out_of_network" ? "Out of Network" :
            confidence === "likely" ? "Likely In Network" : "Unknown Coverage"}
      </span>
    </span>
  );
}

export function HospitalCard({ hospital, rank, onViewDetails, onCallHospital, onBook }: HospitalCardProps) {
  const { t } = useTranslation();
  const hasCost = hospital.costEstimateMin !== null && hospital.costEstimateMax !== null;

  const facilityTypeLabels: Record<string, { label: string; color: string }> = {
    hospital_er: { label: "Emergency Room", color: "bg-red-100 text-red-700" },
    urgent_care: { label: "Urgent Care", color: "bg-orange-100 text-orange-700" },
    dentist: { label: "Dental Office", color: "bg-cyan-100 text-cyan-700" },
    physical_therapist: { label: "Physical Therapy", color: "bg-green-100 text-green-700" },
    primary_care: { label: "Primary Care", color: "bg-blue-100 text-blue-700" },
    specialist: { label: "Specialist", color: "bg-purple-100 text-purple-700" },
  };

  const facilityInfo = hospital.type ? facilityTypeLabels[hospital.type] : null;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5">
      <div className="flex flex-col gap-4 p-5">
        {/* Header */}
        <div className="flex items-start gap-3">
          {hospital.logo ? (
            <img
              src={hospital.logo}
              alt={`${hospital.name} logo`}
              className="h-9 w-9 shrink-0 rounded-xl object-contain bg-white shadow-sm"
            />
          ) : (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-sm font-bold text-white shadow-sm">
              {hospital.name.charAt(0).toUpperCase()}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold leading-snug text-foreground">{hospital.name}</h3>
              {facilityInfo && (
                <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-semibold", facilityInfo.color)}>
                  {facilityInfo.label}
                </span>
              )}
            </div>
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0 text-primary/60" />
              <span className="truncate">{hospital.address}</span>
            </p>
          </div>
        </div>

        {/* Out of Network Warning */}
        {hospital.insuranceConfidence === "unknown" && hospital.costEstimateMin && hospital.costEstimateMin >= 4000 && (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-red-900">Contract Dispute - Out of Network</p>
              <p className="mt-0.5 text-[11px] text-red-700">
                This hospital is currently in a contract dispute with your insurance. You may be charged ${hospital.costEstimateMin.toLocaleString()} out-of-pocket.
              </p>
            </div>
          </div>
        )}

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col gap-1.5 rounded-xl bg-primary/5 px-3 py-3">
            <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-primary/70">
              <Navigation className="h-3 w-3" />
              {t("hospital.distance")}
            </span>
            <span className="text-base font-bold tabular-nums text-foreground">
              {typeof hospital.distanceMiles === "number" ? `${hospital.distanceMiles} mi` : "-- mi"}
            </span>
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Clock className="h-2.5 w-2.5" />
              {typeof hospital.etaMinutes === "number" ? `~${hospital.etaMinutes} min` : "-- min"}
            </span>
          </div>

          <div className="flex flex-col gap-1.5 rounded-xl bg-[hsl(var(--chart-3))]/5 px-3 py-3">
            <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--chart-3))]/70">
              <Shield className="h-3 w-3" />
              {t("hospital.insurance")}
            </span>
            <ConfidenceBadge confidence={hospital.insuranceConfidence} />
          </div>

          <div className="flex flex-col gap-1.5 rounded-xl bg-accent/5 px-3 py-3">
            <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-accent/70">
              <DollarSign className="h-3 w-3" />
              {t("hospital.est_cost")}
            </span>
            {hasCost ? (
              <>
                <span className="text-base font-bold tabular-nums text-foreground">
                  ${hospital.costEstimateMin!.toLocaleString()}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  to ${hospital.costEstimateMax!.toLocaleString()}
                </span>
              </>
            ) : (
              <span className="text-xs text-muted-foreground">N/A</span>
            )}
          </div>
        </div>

        {/* Capabilities */}
        <div className="flex flex-wrap gap-1.5">
          {hospital.capabilities.map((cap) => (
            <Badge key={cap} variant="secondary" className="rounded-lg px-2.5 py-0.5 text-[11px] font-medium">
              {cap}
            </Badge>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-2 border-t px-5 py-3">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs font-semibold text-primary hover:text-primary"
            onClick={(e) => { e.stopPropagation(); onViewDetails(hospital); }}
          >
            {t("hospital.view_details")}
            <ChevronRight className="h-3 w-3" />
          </Button>
          {onBook && (
            <Button
              size="sm"
              className="gap-1.5 rounded-xl bg-green-600 text-xs font-semibold text-white hover:bg-green-700 shadow-sm transition-all hover:shadow-md"
              onClick={(e) => { e.stopPropagation(); onBook(hospital); }}
            >
              <DollarSign className="h-3.5 w-3.5" />
              Pay Copay ($150)
            </Button>
          )}
          {onCallHospital && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 rounded-xl text-xs font-semibold hover:bg-muted"
              onClick={(e) => { e.stopPropagation(); onCallHospital(hospital); }}
            >
              <Phone className="h-3.5 w-3.5" />
              Book with CareNet Agent
            </Button>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-primary" asChild>
            <a href={`tel:${hospital.phone}`} aria-label={`Call ${hospital.name}`} onClick={(e) => e.stopPropagation()}>
              <Phone className="h-3.5 w-3.5" />
            </a>
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-primary" asChild>
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(hospital.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Directions to ${hospital.name}`}
              onClick={(e) => e.stopPropagation()}
            >
              <Navigation className="h-3.5 w-3.5" />
            </a>
          </Button>
        </div>
      </div>
    </article>
  );
}
