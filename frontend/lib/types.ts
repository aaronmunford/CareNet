export type InsuranceProvider =
  | "aetna"
  | "anthem"
  | "cigna"
  | "united"
  | "medicare"
  | "medicaid"
  | "other";

export type PlanType =
  | "hmo"
  | "ppo"
  | "epo"
  | "medicaid-managed"
  | "medicare-advantage"
  | "original-medicare"
  | "unknown";

export type CareType = "emergency" | "urgent" | "not-sure";

export type Symptom =
  | "chest-pain"
  | "stroke"
  | "major-bleeding"
  | "broken-bone"
  | "severe-burn"
  | "allergic-reaction"
  | "high-fever"
  | "head-injury"
  | "other";

export type Severity = "mild" | "moderate" | "severe";

export type InsuranceConfidence = "verified" | "likely" | "unknown";
export type CostConfidence = "high" | "medium" | "low";

export interface Doctor {
  name: string;
  specialty: string;
  rating: number;
  yearsExperience: number;
  languages: string[];
  bio: string;
}

export interface InsuranceInfo {
  provider: InsuranceProvider | "";
  planType: PlanType | "";
  networkName: string;
  memberZip: string;
  preferInNetwork: boolean;
  patientName?: string;
  dateOfBirth?: string;
}

export interface IncidentInfo {
  description: string;
  careType: CareType | "";
  symptoms: Symptom[];
  severity: Severity;
}

export interface Hospital {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  distanceMiles: number;
  etaMinutes: number;
  capabilities: string[];
  doctors?: Doctor[];
  googleRating?: number | null;
  doctorAverageRating?: number | null;
  rating?: number | null;
  insuranceConfidence: InsuranceConfidence;
  costEstimateMin: number | null;
  costEstimateMax: number | null;
  costConfidence: CostConfidence;
  phone: string;
  website: string;
  type?: "hospital_er" | "urgent_care" | "primary_care" | "specialist" | "dentist" | "physical_therapist";
  networkStatus?: "in_network" | "out_of_network" | "unknown";
  estimatedCopay?: { min: number; max: number } | null;
  logo?: string; // URL to hospital logo image
}

export type SortOption = "closest" | "best-match" | "lowest-cost";

export interface FilterState {
  capabilities: string[];
  insuranceConfidence: InsuranceConfidence[];
  maxDistance: number;
}

export type TriageSeverity = "low" | "moderate" | "high" | "critical";

export type RecommendedCare =
  | "self-care"
  | "primary-care"
  | "specialist"
  | "urgent-care"
  | "emergency-room";

export interface TriageResult {
  injuryCategory: string;
  severity: TriageSeverity;
  recommendedCare: RecommendedCare;
  reasoning: string;
  suggestedSymptoms: Symptom[];
  suggestedCareType: CareType;
  suggestedSeverity: Severity;
  warningFlags: string[];
}

export const RECOMMENDED_CARE_LABELS: Record<RecommendedCare, string> = {
  "self-care": "Self-Care at Home",
  "primary-care": "Primary Care / Doctor Visit",
  specialist: "Specialist Referral",
  "urgent-care": "Urgent Care Center",
  "emergency-room": "Emergency Room (ER)",
};

export const TRIAGE_SEVERITY_LABELS: Record<TriageSeverity, string> = {
  low: "Low",
  moderate: "Moderate",
  high: "High",
  critical: "Critical",
};

export const PROVIDER_LABELS: Record<InsuranceProvider, string> = {
  aetna: "Aetna",
  anthem: "Anthem/BCBS",
  cigna: "Cigna",
  united: "UnitedHealthcare",
  medicare: "Medicare",
  medicaid: "Medicaid",
  other: "Other",
};

export const PLAN_TYPE_LABELS: Record<PlanType, string> = {
  hmo: "HMO",
  ppo: "PPO",
  epo: "EPO",
  "medicaid-managed": "Medicaid Managed Care",
  "medicare-advantage": "Medicare Advantage",
  "original-medicare": "Original Medicare",
  unknown: "Unknown",
};

export const CARE_TYPE_LABELS: Record<CareType, string> = {
  emergency: "Emergency (ER)",
  urgent: "Urgent (Urgent Care)",
  "not-sure": "Not sure",
};

export const SYMPTOM_LABELS: Record<Symptom, string> = {
  "chest-pain": "Chest pain / breathing trouble",
  stroke: "Stroke symptoms (face droop, arm weakness, speech trouble)",
  "major-bleeding": "Major bleeding",
  "broken-bone": "Broken bone / severe injury",
  "severe-burn": "Severe burn",
  "allergic-reaction": "Severe allergic reaction",
  "high-fever": "High fever / infection concern",
  "head-injury": "Head injury / concussion concern",
  other: "Other",
};

// Medical History Upload Types
export interface MedicalDocument {
  id: string;
  name: string;
  type: string; // MIME type
  size: number;
  uploadedAt: string;
  dataUrl: string; // Base64 encoded file for localStorage
}

export interface UserProfile {
  // Personal Info
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;

  // Emergency Contact
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;

  // Medical Info
  bloodType: string;
  allergies: string;
  medicalConditions: string;
  medications: string;
  medicalDocuments: MedicalDocument[];

  // Preferences
  preferredLanguage: string;
  notifyEmail: boolean;
  notifySms: boolean;
}

export const DEFAULT_USER_PROFILE: UserProfile = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  address: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  emergencyContactRelation: "",
  bloodType: "",
  allergies: "",
  medicalConditions: "",
  medications: "",
  medicalDocuments: [],
  preferredLanguage: "en",
  notifyEmail: true,
  notifySms: false,
};

export const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"] as const;

// Billing Center Types
export type PaymentMethodType = "credit_card" | "debit_card" | "bank_account" | "insurance";
export type BillStatus = "pending" | "paid" | "overdue" | "processing";

export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  lastFour: string;
  cardBrand?: "visa" | "mastercard" | "amex" | "discover"; // For cards
  expiryMonth?: string;
  expiryYear?: string;
  bankName?: string; // For bank accounts
  isDefault: boolean;
  billingAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
}

export interface Bill {
  id: string;
  hospitalId: string;
  hospitalName: string;
  date: string; // ISO date string
  dueDate: string; // ISO date string
  amount: number;
  status: BillStatus;
  description: string;
  serviceDate: string; // Date of service
  paymentMethodId?: string; // ID of payment method used
  paidDate?: string; // ISO date string when paid
  receiptUrl?: string;
  insuranceCovered?: number; // Amount covered by insurance
  notes?: string;
}

export interface BillingCenter {
  paymentMethods: PaymentMethod[];
  bills: Bill[];
  totalPaid: number;
  totalPending: number;
  autoPayEnabled: boolean;
}

