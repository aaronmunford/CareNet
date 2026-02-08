"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { InsuranceForm } from "@/components/insurance-form";
import { IncidentForm } from "@/components/incident-form";
import { ResultsScreen } from "@/components/results-screen";
import { HospitalDetails } from "@/components/hospital-details";
import { AgentCallStep } from "@/components/agent-call-step";
import { AuthDialog } from "@/components/auth-dialog";
import { BookingTimeDialog } from "@/components/booking-time-dialog";
import type { InsuranceInfo, IncidentInfo, Hospital } from "@/lib/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, HelpCircle, User, LogOut, ChevronDown, Save, Stethoscope, Check, Globe, Calendar as CalendarIcon, Bell, Heart, Activity, Smile, Dumbbell, Building2, CreditCard } from "lucide-react";
import { LanguageProvider, useTranslation } from "@/components/language-provider";
import { LANGUAGES } from "@/lib/languages";
import { useAuth } from "@/lib/auth-context";

// Use relative path '/api' which will be proxied by Next.js rewrites
const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

type AppStep = "landing" | "insurance" | "incident" | "results" | "agent-call";
type FacilityMode = "all" | "emergency" | "urgent-care" | "dentist" | "physical-therapy";

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  bloodType: string;
  allergies: string;
  medicalConditions: string;
  medications: string;
  preferredLanguage: string;
  notifyEmail: boolean;
  notifySms: boolean;
}

const DEFAULT_PROFILE: UserProfile = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  emergencyContactRelation: "",
  bloodType: "",
  allergies: "",
  medicalConditions: "",
  medications: "",
  preferredLanguage: "en",
  notifyEmail: true,
  notifySms: false,
};

const DEFAULT_INSURANCE: InsuranceInfo = {
  provider: "",
  planType: "",
  networkName: "",
  memberZip: "",
  preferInNetwork: true,
  patientName: undefined,
  dateOfBirth: undefined,
};

const DEFAULT_INCIDENT: IncidentInfo = {
  description: "",
  careType: "",
  symptoms: [],
  severity: "moderate",
};

function LanguageSelector() {
  const { language, setLanguage } = useTranslation();
  const currentLang = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 hover:bg-slate-50">
          <Globe className="h-4 w-4 text-slate-500" />
          <span className="text-sm font-medium text-slate-700 hidden sm:inline">{currentLang.nativeName}</span>
          <ChevronDown className="h-3 w-3 text-slate-400" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[150px]">
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            className="justify-between"
            onClick={() => setLanguage(lang.code)}
          >
            <span className={language === lang.code ? "font-semibold" : ""}>{lang.nativeName}</span>
            {language === lang.code && <Check className="h-3 w-3 text-blue-600" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function PageContent() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [step, setStep] = useState<AppStep>("results");
  const [facilityMode, setFacilityMode] = useState<FacilityMode>("all");

  const [insurance, setInsurance] = useState<InsuranceInfo>(DEFAULT_INSURANCE);
  const [incident, setIncident] = useState<IncidentInfo>(DEFAULT_INCIDENT);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [hospitalToCall, setHospitalToCall] = useState<Hospital | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Auth State
  const [authDialogOpen, setAuthDialogOpen] = useState(false);

  // Booking State
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [hospitalToBook, setHospitalToBook] = useState<Hospital | null>(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  // User Profile State
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<UserProfile>(DEFAULT_PROFILE);

  // Load profile from localStorage on mount
  useEffect(() => {
    const savedProfile = localStorage.getItem("caremap-user-profile");
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        setUserProfile(parsed);
        setEditingProfile(parsed);
      } catch (e) {
        console.error("Failed to parse saved profile");
      }
    }
  }, []);

  // Fetch providers when entering results step or changing facility mode
  useEffect(() => {
    if (step !== "results") return;

    const fetchProviders = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const params = new URLSearchParams();
        // Filter by facility type if not "all"
        if (facilityMode !== "all") {
          let typeParam = "";
          if (facilityMode === "emergency") typeParam = "hospital_er";
          else if (facilityMode === "urgent-care") typeParam = "urgent_care";
          else if (facilityMode === "dentist") typeParam = "dentist";
          else if (facilityMode === "physical-therapy") typeParam = "physical_therapist";

          if (typeParam) params.append("type", typeParam);
        }

        if (insurance.provider) {
          params.append("provider", insurance.provider);
        }
        if (insurance.preferInNetwork) {
          params.append("in_network_only", "true");
        }

        // Try proxy first
        let response = await fetch(`${API_URL}/hospitals?${params}`);

        // If 404/failure, try direct backend as fallback
        if (!response.ok) {
          console.warn("Proxy failed, trying direct backend...");
          response = await fetch(`/api/python/providers?${params}`);
        }

        if (response.ok) {
          const data = await response.json();
          setHospitals(data);
        } else {
          const text = await response.text();
          setFetchError(`Server Error: ${response.status} ${response.statusText} - ${text.substring(0, 100)}`);
          setHospitals([]);
        }
      } catch (error) {
        console.error("Error fetching providers:", error);
        console.log("API URL used:", API_URL);
        setFetchError(`Network Error: ${error instanceof Error ? error.message : String(error)}`);
        setHospitals([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, [step, insurance.provider, insurance.preferInNetwork, facilityMode]);

  // Request user location on mount
  useEffect(() => {
    if (!userLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            label: "Current location",
          });
        },
        (err) => {
          console.warn("Location access denied or failed", err);
        }
      );
    }
  }, []); // Run once on mount

  // Profile Helpers
  const getUserInitials = () => {
    if (userProfile.firstName || userProfile.lastName) {
      const first = userProfile.firstName.charAt(0).toUpperCase();
      const last = userProfile.lastName.charAt(0).toUpperCase();
      return `${first}${last}` || first || "?";
    }
    return "?";
  };

  const getDisplayName = () => {
    if (userProfile.firstName || userProfile.lastName) {
      return `${userProfile.firstName} ${userProfile.lastName}`.trim();
    }
    return t("nav.profile").split(" ")[0] || "Guest";
  };

  const handleSaveProfile = () => {
    setUserProfile(editingProfile);
    localStorage.setItem("caremap-user-profile", JSON.stringify(editingProfile));
    setProfileDialogOpen(false);
  };

  const handleOpenProfileDialog = () => {
    setEditingProfile(userProfile);
    setProfileDialogOpen(true);
  };

  const handleViewDetails = useCallback((hospital: Hospital) => {
    setSelectedHospital(hospital);
    setDetailsOpen(true);
  }, []);

  const handleCallHospital = useCallback((hospital: Hospital) => {
    setHospitalToBook(hospital);
    setBookingDialogOpen(true);
  }, []);

  const handleBookingConfirm = useCallback((timePreference: "asap" | "today" | "tomorrow" | "this-week") => {
    // Always hardcode to ASAP regardless of selection
    setHospitalToCall(hospitalToBook);
    setBookingDialogOpen(false);
    setStep("agent-call");
  }, [hospitalToBook]);

  // Navigation Logic
  const isResults = step === "results";

  // Search Logic
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const searchResults = normalizedQuery
    ? hospitals
      .filter((h) => h.name.toLowerCase().includes(normalizedQuery))
      .slice(0, 8)
    : [];

  const handleSelectHospitalFromSearch = (hospital: Hospital) => {
    if (step !== "results") {
      setStep("results");
    }
    setSelectedHospital(hospital);
    setDetailsOpen(true);
    setSearchQuery("");
    setSearchOpen(false);
  };


  return (
    <div className="flex min-h-screen flex-col mesh-gradient">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-16 items-center gap-4">
            {/* Logo */}
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <Image
                src="/carenet-logo.svg"
                alt="CareNet Logo"
                width={180}
                height={50}
                className="h-12 w-auto"
                priority
              />
            </button>

            {/* Language Selector (Mobile/Desktop) */}
            <div className="ml-2">
              <LanguageSelector />
            </div>

            {/* Search Bar - Desktop */}
            <div className="hidden max-w-md flex-1 md:block ml-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder={t("search.placeholder")}
                  className="h-9 w-full rounded-2xl border-slate-200 bg-slate-50 pl-9 text-sm focus:bg-white focus:ring-2 focus:ring-blue-600/20"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSearchOpen(true);
                  }}
                  onFocus={() => setSearchOpen(true)}
                  onBlur={() => setTimeout(() => setSearchOpen(false), 120)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && searchResults.length > 0) {
                      e.preventDefault();
                      handleSelectHospitalFromSearch(searchResults[0]);
                    }
                  }}
                />
                {searchOpen && searchResults.length > 0 && (
                  <div className="absolute z-40 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
                    <ul className="max-h-64 overflow-y-auto py-1 text-sm">
                      {searchResults.map((hospital) => (
                        <li key={hospital.id}>
                          <button
                            type="button"
                            className="flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-slate-50"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => handleSelectHospitalFromSearch(hospital)}
                          >
                            <Stethoscope className="mt-0.5 h-4 w-4 text-slate-400" />
                            <span className="flex flex-col">
                              <span className="font-medium text-slate-900">{hospital.name}</span>
                              <span className="text-xs text-slate-500">{hospital.address}</span>
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Spacer */}
            <div className="flex-1 md:hidden" />

            {/* Mode Toggle (Dropdown for better space) */}
            <div className="hidden sm:flex mr-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 hover:bg-slate-50 transition-colors">
                    {facilityMode === "all" && <Building2 className="h-4 w-4 text-blue-600" />}
                    {facilityMode === "emergency" && <Heart className="h-4 w-4 text-red-600" />}
                    {facilityMode === "urgent-care" && <Activity className="h-4 w-4 text-orange-600" />}
                    {facilityMode === "dentist" && <Image src="/icon-dentist.png" alt="Dentist" width={16} height={16} className="rounded-sm" />}
                    {facilityMode === "physical-therapy" && <Dumbbell className="h-4 w-4 text-green-600" />}

                    <span className="text-sm font-medium text-slate-700">
                      {facilityMode === "all" && t("mode.all")}
                      {facilityMode === "emergency" && t("mode.emergency")}
                      {facilityMode === "urgent-care" && t("mode.urgent_care")}
                      {facilityMode === "dentist" && "Dentist"}
                      {facilityMode === "physical-therapy" && "Physical Therapy"}
                    </span>
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Select Facility Type</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setFacilityMode("all")}>
                    <Building2 className="mr-2 h-4 w-4 text-blue-600" /> {t("mode.all")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFacilityMode("emergency")}>
                    <Heart className="mr-2 h-4 w-4 text-red-600" /> {t("mode.emergency")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFacilityMode("urgent-care")}>
                    <Activity className="mr-2 h-4 w-4 text-orange-600" /> {t("mode.urgent_care")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFacilityMode("dentist")} className="gap-2">
                    <Image src="/icon-dentist.png" alt="Dentist" width={16} height={16} className="rounded-sm" /> Dentist
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFacilityMode("physical-therapy")}>
                    <Dumbbell className="mr-2 h-4 w-4 text-green-600" /> Physical Therapy
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2">
              {/* Calendar Icon Button */}
              <Link href="/calendar">
                <button className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors">
                  <CalendarIcon className="h-5 w-5" />
                </button>
              </Link>

              {/* Notification Bell */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors relative">
                    <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 border border-white" />
                    <Bell className="h-5 w-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel className="font-semibold">Notifications</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="max-h-96 overflow-y-auto">
                    <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 cursor-pointer">
                      <div className="flex w-full justify-between items-center">
                        <span className="font-medium text-sm">Appointment Confirmed</span>
                        <span className="text-[10px] text-slate-400">2m ago</span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2">
                        Your appointment at Mount Sinai Hospital has been confirmed for tomorrow at 10:00 AM.
                      </p>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 cursor-pointer">
                      <div className="flex w-full justify-between items-center">
                        <span className="font-medium text-sm">Welcome to CareNet</span>
                        <span className="text-[10px] text-slate-400">1h ago</span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2">
                        Thanks for joining! Update your profile to get better recommendations.
                      </p>
                    </DropdownMenuItem>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="justify-center text-xs text-blue-600 font-medium cursor-pointer">
                    View all notifications
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Help Dialog */}
              <Dialog>
                <DialogTrigger asChild>
                  <button className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700">
                    <HelpCircle className="h-5 w-5" />
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <HelpCircle className="h-5 w-5 text-blue-500" />
                      {t("triage.title")}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <p className="text-sm text-slate-600">
                      {t("triage.subtitle")}
                    </p>
                    <div className="space-y-2">
                      <h4 className="font-medium text-slate-900">{t("triage.step1_title")}</h4>
                      <p className="text-sm text-slate-600">{t("triage.step1_description")}</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium text-slate-900">{t("triage.step2_title")}</h4>
                      <p className="text-sm text-slate-600">{t("triage.step2_description")}</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium text-slate-900">{t("triage.step3_title")}</h4>
                      <p className="text-sm text-slate-600">{t("triage.step3_description")}</p>
                    </div>
                    <div className="mt-4 rounded-lg bg-red-50 p-3">
                      <p className="text-sm font-medium text-red-800">{t("triage.emergency_disclaimer")}</p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* User Profile Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1.5 pl-1.5 pr-3 hover:bg-slate-50">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium text-white ${user ? "bg-gradient-to-br from-blue-500 to-blue-600" : "bg-slate-400"
                      }`}>
                      {user ? (user.profile.firstName.charAt(0) + user.profile.lastName.charAt(0)) : "?"}
                    </div>
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {user ? (
                    <>
                      <DropdownMenuLabel>
                        <div className="flex flex-col">
                          <span className="font-medium">{user.profile.firstName} {user.profile.lastName}</span>
                          <span className="text-xs font-normal text-slate-500">
                            {user.email}
                          </span>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="cursor-pointer" asChild>
                        <Link href="/calendar" className="flex w-full items-center">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {t("nav.calendar") || "My Appointments"}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer" asChild>
                        <Link href="/billing" className="flex w-full items-center">
                          <CreditCard className="mr-2 h-4 w-4" />
                          Billing Center
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="cursor-pointer" asChild>
                        <Link href="/profile" className="flex w-full items-center">
                          <User className="mr-2 h-4 w-4" />
                          {t("nav.profile")}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="cursor-pointer text-red-600"
                        onClick={() => {
                          logout();
                          setUserProfile(DEFAULT_PROFILE);
                          setEditingProfile(DEFAULT_PROFILE);
                          localStorage.removeItem("caremap-user-profile");
                        }}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        {t("nav.signout")}
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuLabel>Account</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => setAuthDialogOpen(true)}
                      >
                        <User className="mr-2 h-4 w-4" />
                        Sign In / Sign Up
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Profile Settings Dialog */}
      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-500" />
              Account Settings
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 border-b pb-2">👤 Personal Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    value={editingProfile.firstName}
                    onChange={(e) => setEditingProfile({ ...editingProfile, firstName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    value={editingProfile.lastName}
                    onChange={(e) => setEditingProfile({ ...editingProfile, lastName: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={editingProfile.email}
                  onChange={(e) => setEditingProfile({ ...editingProfile, email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 border-b pb-2">🏥 Medical Information</h3>
              <div className="space-y-2">
                <Label htmlFor="conditions">Medical Conditions</Label>
                <Input
                  id="conditions"
                  placeholder="Diabetes, Hypertension, etc."
                  value={editingProfile.medicalConditions}
                  onChange={(e) => setEditingProfile({ ...editingProfile, medicalConditions: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="allergies">Allergies</Label>
                <Input
                  id="allergies"
                  placeholder="Peanuts, Penicillin, etc."
                  value={editingProfile.allergies}
                  onChange={(e) => setEditingProfile({ ...editingProfile, allergies: e.target.value })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setProfileDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveProfile} className="gap-2">
              <Save className="h-4 w-4" />
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main Content */}
      <main className={`mx-auto w-full flex-1 px-6 py-8 ${isResults ? "max-w-7xl" : step === "insurance" ? "max-w-2xl" : "max-w-xl"}`}>
        {step === "incident" && (
          <IncidentForm
            data={incident}
            onChange={setIncident}
            // onBack={() => { }} // Removed back button as requested
            onSubmit={() => setStep("results")}
          />
        )}
        {step === "insurance" && (
          <InsuranceForm
            data={insurance}
            onChange={setInsurance}
            onBack={() => setStep("results")}
            onContinue={() => setStep("results")}
          />
        )}
        {step === "results" && (
          <ResultsScreen
            hospitals={hospitals}
            insurance={insurance}
            incident={incident}
            loading={loading}
            onViewDetails={handleViewDetails}
            onCallHospital={handleCallHospital}
            onChangeInsurance={() => setStep("insurance")}
            onChangeIncident={() => setStep("incident")}
            userLocation={userLocation}
            onUserLocationChange={setUserLocation}
            facilityMode={facilityMode}
            debugUrl={API_URL}
            error={fetchError}
          />
        )}
        {step === "agent-call" && hospitalToCall && (
          <AgentCallStep
            hospital={hospitalToCall}
            incident={incident}
            insurance={insurance}
            onBack={() => setStep("results")}
            onStartOver={() => {
              setStep("incident");
              setInsurance(DEFAULT_INSURANCE);
              setIncident(DEFAULT_INCIDENT);
              setHospitalToCall(null);
            }}
          />
        )}
      </main>

      <footer className="border-t border-slate-200/60 bg-white/50 px-6 py-4 backdrop-blur-sm">
        <p className="text-center text-xs text-slate-400">
          {t("footer.disclaimer")}
        </p>
      </footer>

      <HospitalDetails
        hospital={selectedHospital}
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
      />

      {/* Auth Dialog */}
      <AuthDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
      />

      {/* Booking Time Dialog */}
      {hospitalToBook && (
        <BookingTimeDialog
          open={bookingDialogOpen}
          onOpenChange={setBookingDialogOpen}
          hospital={hospitalToBook}
          onConfirm={handleBookingConfirm}
        />
      )}
    </div>
  );
}

export default function Page() {
  return (
    <LanguageProvider>
      <PageContent />
    </LanguageProvider>
  );
}
