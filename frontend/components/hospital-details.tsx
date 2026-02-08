"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import type { Hospital } from "@/lib/types";
import { cn } from "@/lib/utils";
import { DoctorAvatar } from "@/components/doctor-avatar";
import {
  MapPin,
  Phone,
  Globe,
  Navigation,
  Shield,
  AlertTriangle,
  ArrowLeft,
  Activity,
  Clock,
  DollarSign,
  ExternalLink,
  Star,
} from "lucide-react";

interface HospitalDetailsProps {
  hospital: Hospital | null;
  open: boolean;
  onClose: () => void;
}

export function HospitalDetails({ hospital, open, onClose }: HospitalDetailsProps) {
  if (!hospital) return null;

  const confidenceConfig = {
    verified: {
      label: "Verified",
      description: "Confirmed to accept this insurance plan based on provider directory data.",
      color: "text-[hsl(var(--success))]",
      bg: "bg-[hsl(var(--success))]/10",
      dot: "bg-[hsl(var(--success))]",
    },
    likely: {
      label: "Likely accepted",
      description: "Based on available data, this hospital likely accepts this plan. Confirm directly.",
      color: "text-[hsl(var(--warning))]",
      bg: "bg-[hsl(var(--warning))]/10",
      dot: "bg-[hsl(var(--warning))]",
    },
    unknown: {
      label: "Unknown",
      description: "We could not confirm insurance acceptance. Contact the hospital directly.",
      color: "text-muted-foreground",
      bg: "bg-muted",
      dot: "bg-muted-foreground",
    },
  };

  const conf = confidenceConfig[hospital.insuranceConfidence];
  const hasCost = hospital.costEstimateMin !== null && hospital.costEstimateMax !== null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="pr-8 text-lg font-bold leading-snug">
            {hospital.name}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-1 text-xs">
            <MapPin className="h-3 w-3 text-primary" />
            {hospital.address}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 pt-2">
          {/* Quick stats */}
          <div className="grid grid-cols-4 gap-2">
            <div className="flex flex-col items-center gap-1.5 rounded-xl bg-primary/5 py-4">
              <Navigation className="h-4.5 w-4.5 text-primary" />
              <span className="text-lg font-bold tabular-nums">{hospital.distanceMiles} mi</span>
              <span className="text-[11px] text-muted-foreground">Distance</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 rounded-xl bg-[hsl(var(--chart-3))]/5 py-4">
              <Clock className="h-4.5 w-4.5 text-[hsl(var(--chart-3))]" />
              <span className="text-lg font-bold tabular-nums">~{hospital.etaMinutes} min</span>
              <span className="text-[11px] text-muted-foreground">ETA</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 rounded-xl bg-amber-50 py-4">
              <Star className="h-4.5 w-4.5 text-amber-500" />
              <span className="text-lg font-bold tabular-nums">
                {hospital.rating !== null && hospital.rating !== undefined ? hospital.rating.toFixed(1) : "N/A"}
              </span>
              <span className="text-[11px] text-muted-foreground">Rating</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 rounded-xl bg-accent/5 py-4">
              <DollarSign className="h-4.5 w-4.5 text-accent" />
              <span className="text-lg font-bold tabular-nums">
                {hasCost ? `$${hospital.costEstimateMin!.toLocaleString()}` : "N/A"}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {hasCost ? `to $${hospital.costEstimateMax!.toLocaleString()}` : "Unavailable"}
              </span>
            </div>
          </div>

          <Separator />

          {hospital.doctors && hospital.doctors.length > 0 && (
            <>
              <div className="flex flex-col gap-2.5">
                <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Activity className="h-3.5 w-3.5 text-primary" />
                  Doctors
                </h4>
                <div className="flex flex-col gap-2">
                  {hospital.doctors.map((doc) => (
                    <div key={doc.name} className="rounded-xl border px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2">
                          <DoctorAvatar name={doc.name} size="md" />
                          <span className="truncate text-sm font-semibold">{doc.name}</span>
                        </div>
                        <span className="text-xs font-semibold text-amber-600">{doc.rating.toFixed(1)}★</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {doc.specialty} · {doc.yearsExperience} yrs · {doc.languages.join(", ")}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground">{doc.bio}</p>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />
            </>
          )}

          <div className="flex flex-col gap-2.5">
            <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Shield className="h-3.5 w-3.5 text-primary" />
              Insurance acceptance
            </h4>
            <div className={cn("flex items-start gap-3 rounded-xl p-4", conf.bg)}>
              <span className={cn("mt-1 h-2.5 w-2.5 shrink-0 rounded-full", conf.dot)} />
              <div>
                <p className={cn("text-sm font-semibold", conf.color)}>{conf.label}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{conf.description}</p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex items-start gap-2.5 rounded-xl border px-4 py-3.5">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              Insurance and costs are estimates. Always confirm with the hospital and your insurer. For emergencies, call 911.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Button variant="outline" className="rounded-xl bg-transparent" onClick={onClose}>
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
              Back
            </Button>
            <Button variant="outline" className="rounded-xl bg-transparent" asChild>
              <a href={`https://maps.google.com/?q=${encodeURIComponent(hospital.address)}`} target="_blank" rel="noopener noreferrer">
                <Navigation className="mr-1.5 h-3.5 w-3.5" />
                Directions
              </a>
            </Button>
            <Button className="rounded-xl bg-primary text-primary-foreground" asChild>
              <a href={`tel:${hospital.phone}`}>
                <Phone className="mr-1.5 h-3.5 w-3.5" />
                Call
              </a>
            </Button>
          </div>

          <div className="flex items-center gap-5 text-xs text-muted-foreground">
            <a href={hospital.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 transition-colors hover:text-primary">
              <Globe className="h-3 w-3" />
              Website
              <ExternalLink className="h-2.5 w-2.5" />
            </a>
            <a href={`tel:${hospital.phone}`} className="flex items-center gap-1 transition-colors hover:text-primary">
              <Phone className="h-3 w-3" />
              {hospital.phone}
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
