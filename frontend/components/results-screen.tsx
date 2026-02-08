"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { HospitalCard } from "@/components/hospital-card";
import { PaymentModal } from "@/components/payment-modal";

const HospitalMap = dynamic(
  () => import("@/components/hospital-map").then((mod) => mod.HospitalMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center rounded-2xl border bg-muted/30">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    ),
  }
);
import type {
  Hospital,
  InsuranceInfo,
  IncidentInfo,
  SortOption,
  FilterState,
  InsuranceConfidence,
} from "@/lib/types";
import {
  SlidersHorizontal,
  AlertTriangle,
  Search,
  Shield,
  Activity,
  Loader2,
  Mic,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/components/language-provider";


// Manhattan addresses for location lookup
const MANHATTAN_LOCATIONS: Record<string, { lat: number; lng: number }> = {
  "upper east side": { lat: 40.7736, lng: -73.9566 },

  "upper west side": { lat: 40.7870, lng: -73.9754 },
  "midtown": { lat: 40.7549, lng: -73.9840 },
  "chelsea": { lat: 40.7465, lng: -74.0014 },
  "east village": { lat: 40.7265, lng: -73.9815 },
  "west village": { lat: 40.7336, lng: -74.0027 },
  "soho": { lat: 40.7233, lng: -73.9990 },
  "tribeca": { lat: 40.7163, lng: -74.0086 },
  "financial district": { lat: 40.7075, lng: -74.0113 },
  "harlem": { lat: 40.8116, lng: -73.9465 },
  "washington heights": { lat: 40.8417, lng: -73.9393 },
  "lower east side": { lat: 40.7150, lng: -73.9843 },
  "murray hill": { lat: 40.7488, lng: -73.9757 },
  "gramercy": { lat: 40.7382, lng: -73.9860 },
  "hell's kitchen": { lat: 40.7638, lng: -73.9918 },
  "kips bay": { lat: 40.7420, lng: -73.9780 },
  "yorkville": { lat: 40.7766, lng: -73.9488 },
  "morningside heights": { lat: 40.8080, lng: -73.9620 },
  "inwood": { lat: 40.8677, lng: -73.9212 },
};

interface ResultsScreenProps {
  hospitals: Hospital[];
  insurance: InsuranceInfo;
  incident: IncidentInfo;
  onViewDetails: (hospital: Hospital) => void;
  onCallHospital?: (hospital: Hospital) => void;
  onChangeInsurance: () => void;
  onChangeIncident: () => void;
  userLocation: { lat: number; lng: number; label: string } | null;
  onUserLocationChange: (loc: { lat: number; lng: number; label: string } | null) => void;
  loading?: boolean;
  facilityMode?: "all" | "emergency" | "urgent-care" | "dentist" | "physical-therapy";
  debugUrl?: string; // Add debug URL prop
  error?: string | null;
}

const HOSPITAL_CAPABILITIES = ["Trauma I", "Trauma II", "Stroke Center", "Burn Center", "Pediatric"];
const URGENT_CARE_CAPABILITIES = ["Walk-in", "X-Ray", "Labs", "Stitches", "Pediatric", "After Hours"];
const DENTIST_CAPABILITIES = ["Pediatric", "Emergency", "Cosmetic", "Surgery"];
const PT_CAPABILITIES = ["Sports", "Post-Op", "Geriatric", "Pediatric"];
const ALL_CAPABILITIES = Array.from(new Set([...HOSPITAL_CAPABILITIES, ...URGENT_CARE_CAPABILITIES, ...DENTIST_CAPABILITIES, ...PT_CAPABILITIES]));
const CONFIDENCE_OPTIONS: InsuranceConfidence[] = ["verified", "likely", "unknown"];

// Haversine formula to calculate distance between two coordinates in miles
function calculateDistanceMiles(
  lat1: number | string,
  lon1: number | string,
  lat2: number | string,
  lon2: number | string
): number {
  const rLat1 = Number(lat1);
  const rLon1 = Number(lon1);
  const rLat2 = Number(lat2);
  const rLon2 = Number(lon2);

  if (isNaN(rLat1) || isNaN(rLon1) || isNaN(rLat2) || isNaN(rLon2)) return Infinity;

  const R = 3958.8; // Earth's radius in miles
  const dLat = ((rLat2 - rLat1) * Math.PI) / 180;
  const dLon = ((rLon2 - rLon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((rLat1 * Math.PI) / 180) *
    Math.cos((rLat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function ResultsScreen({
  hospitals,
  insurance,
  incident,
  onViewDetails,
  onCallHospital,
  onChangeInsurance,
  onChangeIncident,
  userLocation,
  onUserLocationChange,
  loading = false,
  facilityMode = "all",
  debugUrl,
  error,
}: ResultsScreenProps) {
  const { t } = useTranslation();
  const capabilityOptions =
    facilityMode === "all"
      ? ALL_CAPABILITIES
      : facilityMode === "emergency"
        ? HOSPITAL_CAPABILITIES
        : facilityMode === "urgent-care"
          ? URGENT_CARE_CAPABILITIES
          : facilityMode === "dentist"
            ? DENTIST_CAPABILITIES
            : PT_CAPABILITIES;

  const [sort, setSort] = useState<SortOption>("closest");
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "map">("map"); // Default to map view if mobile
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [hospitalForPayment, setHospitalForPayment] = useState<Hospital | null>(null);
  const [locationInput, setLocationInput] = useState("");
  const [locatingGPS, setLocatingGPS] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    capabilities: [],
    insuranceConfidence: [], // Show all insurance confidence levels (both in-network and out-of-network)
    maxDistance: 5,
  });

  // Sync location input with userLocation prop
  useEffect(() => {
    if (userLocation?.label && userLocation.label !== locationInput) {
      setLocationInput(userLocation.label);
    }
  }, [userLocation]);

  const handleBook = (hospital: Hospital) => {
    setHospitalForPayment(hospital);
    setPaymentModalOpen(true);
  };

  const showEmergencyAlert = incident.severity === "severe" && incident.careType === "emergency";

  const handleLocationSearch = useCallback(() => {
    const query = locationInput.trim().toLowerCase();
    if (!query) return;
    // Check known neighborhoods
    const match = Object.entries(MANHATTAN_LOCATIONS).find(
      ([name]) => query.includes(name) || name.includes(query)
    );
    if (match) {
      onUserLocationChange({ lat: match[1].lat, lng: match[1].lng, label: locationInput.trim() });
    } else {
      // Default to midtown for unrecognized
      onUserLocationChange({ lat: 40.7549, lng: -73.9840, label: locationInput.trim() });
    }
  }, [locationInput, onUserLocationChange]);

  const handleGPSLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setLocatingGPS(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onUserLocationChange({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: "Current location",
        });
        setLocationInput("Current location");
        setLocatingGPS(false);
      },
      () => {
        setLocatingGPS(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [onUserLocationChange]);

  const scoredHospitals = useMemo(() => {
    // Calculate real distances if user location is available
    let hospitalsWithDistance = hospitals.map((h) => {
      if (userLocation) {
        const realDistance = calculateDistanceMiles(
          userLocation.lat,
          userLocation.lng,
          h.lat,
          h.lng
        );
        const dist = Math.round(realDistance * 10) / 10;
        // Estimate ETA: 15mph average speed in city -> 4 mins per mile
        const eta = Math.round(dist * 4);
        return { ...h, distanceMiles: dist, etaMinutes: eta };
      }
      return h;
    });

    // Apply distance filter only if user location is set
    let result = userLocation
      ? hospitalsWithDistance.filter((h) => (h.distanceMiles ?? Infinity) <= filters.maxDistance)
      : hospitalsWithDistance;
    if (filters.capabilities.length > 0) {
      result = result.filter((h) => filters.capabilities.some((c) => h.capabilities.includes(c)));
    }
    if (filters.insuranceConfidence.length > 0) {
      result = result.filter((h) => filters.insuranceConfidence.includes(h.insuranceConfidence));
    }
    result.sort((a, b) => {
      switch (sort) {
        case "closest":
          // Only sort by distance if user location is available
          if (!userLocation) return 0;
          return (a.distanceMiles ?? Infinity) - (b.distanceMiles ?? Infinity);
        case "lowest-cost": return (a.costEstimateMin ?? Infinity) - (b.costEstimateMin ?? Infinity);
        case "best-match":
        default:
          return (
            (a.insuranceConfidence === "verified" ? 0 : a.insuranceConfidence === "likely" ? 1 : 2) -
            (b.insuranceConfidence === "verified" ? 0 : b.insuranceConfidence === "likely" ? 1 : 2)
          );
      }
    });
    return result;
  }, [hospitals, sort, filters, userLocation]);

  function toggleCapability(cap: string) {
    setFilters((prev) => ({
      ...prev,
      capabilities: prev.capabilities.includes(cap)
        ? prev.capabilities.filter((c) => c !== cap)
        : [...prev.capabilities, cap],
    }));
  }

  function toggleConfidence(conf: InsuranceConfidence) {
    setFilters((prev) => ({
      ...prev,
      insuranceConfidence: prev.insuranceConfidence.includes(conf)
        ? prev.insuranceConfidence.filter((c) => c !== conf)
        : [...prev.insuranceConfidence, conf],
    }));
  }

  const activeFilterCount =
    filters.capabilities.length + filters.insuranceConfidence.length + (filters.maxDistance < 5 ? 1 : 0);

  const FilterPanel = () => (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-1.5">
          <Activity className="h-3 w-3 text-primary" />
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("results.filter.capability")}</Label>
        </div>
        {capabilityOptions.map((cap) => (
          <label key={cap} className="flex cursor-pointer items-center gap-2.5">
            <Checkbox checked={filters.capabilities.includes(cap)} onCheckedChange={() => toggleCapability(cap)} />
            <span className="text-sm">{cap}</span>
          </label>
        ))}
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-1.5">
          <Shield className="h-3 w-3 text-primary" />
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("results.filter.insurance")}</Label>
        </div>
        {CONFIDENCE_OPTIONS.map((conf) => (
          <label key={conf} className="flex cursor-pointer items-center gap-2.5">
            <Checkbox checked={filters.insuranceConfidence.includes(conf)} onCheckedChange={() => toggleConfidence(conf)} />
            <span className="text-sm capitalize">{conf}</span>
          </label>
        ))}
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("results.filter.distance")}</Label>
          <span className="text-xs font-semibold tabular-nums text-primary">{filters.maxDistance} mi</span>
        </div>
        <Slider
          value={[filters.maxDistance]}
          min={0.5}
          max={5}
          step={0.5}
          onValueChange={([v]) => setFilters((prev) => ({ ...prev, maxDistance: v }))}
        />
        <div className="flex justify-between text-[11px] text-muted-foreground">
          <span>0.5 mi</span>
          <span>5 mi</span>
        </div>
      </div>
      {activeFilterCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="w-fit text-xs text-muted-foreground"
          onClick={() => setFilters({ capabilities: [], insuranceConfidence: ["unknown"], maxDistance: 5 })}
        >
          {t("results.filter.clear")}
        </Button>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-6 sm:p-2 lg:mx-auto lg:max-w-[1600px] lg:p-6 w-full">
      {/* 1. Top Section: Emergency Alert & Triage */}
      <section className="flex flex-col gap-4 w-full">
        {showEmergencyAlert && (
          <div className="flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 px-5 py-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <div>
              <p className="text-sm font-semibold text-destructive">{t("incident.emergency_alert")}</p>
              <p className="mt-0.5 text-xs text-destructive/80">
                {t("incident.emergency_action")}
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            See where you're insured
          </h1>
          <p className="mt-2 text-lg text-slate-600">
            Find the best care that accepts your insurance plan.
          </p>
        </div>
        {!insurance.provider && (
          <Button
            onClick={onChangeInsurance}
            size="lg"
            className="group relative overflow-hidden rounded-2xl bg-blue-600 px-8 font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02] hover:bg-blue-700 hover:shadow-blue-500/35 active:scale-[0.98]"
          >
            <span className="relative z-10 flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Add Insurance Info
            </span>
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          </Button>
        )}
      </div>

      {/* Voice Triage Callout - Prominent Top Location */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-white p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-md">
            <Mic className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold text-slate-900">Describe your situation</span>
            <span className="text-sm text-slate-600">Use Voice AI to triage your symptoms</span>
          </div>
        </div>
        <Button
          onClick={onChangeIncident}
          className="w-full sm:w-auto rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-blue-700"
        >
          Start Voice Triage
        </Button>
      </div>

      {/* 2. Main Layout - Map on Left, Results on Right */}
      <div className="flex flex-col lg:flex-row gap-5">
        {/* Left Column: Map (Sticky) */}
        <div className="h-[320px] shrink-0 md:h-[420px] lg:sticky lg:top-20 lg:h-[calc(100vh-240px)] lg:w-[48%] rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
          <HospitalMap
            hospitals={scoredHospitals}
            selectedHospitalId={selectedHospitalId}
            onSelectHospital={(hospital) => {
              setSelectedHospitalId(hospital.id);
              document.getElementById(`hospital-card-${hospital.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
            }}
            userLocation={userLocation}
          />
        </div>

        {/* Right Column: Results List */}
        <div className="flex-1 flex flex-col gap-4 lg:min-w-0">
          {/* Controls & Filters */}
          <div className="sticky top-16 z-10 bg-white/80 backdrop-blur-md py-2 px-1 border-b border-slate-100 flex items-center justify-between rounded-lg">
            <div className="flex items-center gap-3">
              <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
                <SelectTrigger className="h-9 w-[160px] rounded-xl text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="closest" disabled={!userLocation}>
                    {t("results.sort.closest")}{!userLocation && " (set location)"}
                  </SelectItem>
                  <SelectItem value="best-match">{t("results.sort.best_match")}</SelectItem>
                  <SelectItem value="lowest-cost">{t("results.sort.lowest_cost")}</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-xs tabular-nums text-muted-foreground hidden sm:inline">
                {scoredHospitals.length} result{scoredHospitals.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 gap-1.5 rounded-xl bg-transparent text-xs">
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    {t("results.filters")}
                    {activeFilterCount > 0 && (
                      <Badge variant="secondary" className="ml-0.5 h-4 w-4 rounded-full p-0 text-[10px]">{activeFilterCount}</Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px]">
                  <SheetHeader><SheetTitle>{t("results.filters")}</SheetTitle></SheetHeader>
                  <div className="mt-6"><FilterPanel /></div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Hospital List */}
          <div className="flex flex-col gap-3">
            {loading ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border bg-card py-20 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="mt-4 text-sm text-muted-foreground">{t("results.finding")}</p>
              </div>
            ) : scoredHospitals.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border bg-card py-20 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                  <Search className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="mt-4 text-base font-semibold">{t("results.no_results")}</p>
                <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
                  {t("results.no_results_hint")}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 rounded-xl bg-transparent text-xs"
                  onClick={() => setFilters({ capabilities: [], insuranceConfidence: ["unknown"], maxDistance: 5 })}
                >
                  {t("results.filter.clear")}
                </Button>
              </div>
            ) : (
              scoredHospitals.map((hospital, i) => (
                <div
                  key={hospital.id}
                  id={`hospital-card-${hospital.id}`}
                  className={cn(
                    "rounded-2xl transition-all duration-200",
                    selectedHospitalId === hospital.id && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                  )}
                  onClick={() => setSelectedHospitalId(hospital.id)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSelectedHospitalId(hospital.id); }}
                  role="button"
                  tabIndex={0}
                >
                  <HospitalCard
                    hospital={hospital}
                    rank={i + 1}
                    onViewDetails={onViewDetails}
                    onCallHospital={onCallHospital}
                    onBook={handleBook}
                  />
                </div>
              ))
            )}
          </div>

          {/* Debug Info */}
          {hospitals.length === 0 && !loading && debugUrl && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 text-xs font-mono break-all">
              <p>DEBUG: API URL used: {debugUrl}</p>
              {error && <p>Error: {error}</p>}
            </div>
          )}
        </div>
      </div>



      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        hospital={hospitalForPayment}
        onSuccess={() => {
          // Maybe show a toast or something
        }}
      />
    </div>
  );
}
