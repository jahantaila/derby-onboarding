export interface DocumentUpload {
  id: string;
  docType: string;
  fileName: string;
  storagePath: string;
  fileSize: number;
  mimeType: string;
}

export interface FormData {
  // Step 1 - Business Basics
  businessName?: string;
  yearsInBusiness?: string;
  // Step 2 - Owner Info
  ownerName?: string;
  ownerPhone?: string;
  ownerEmail?: string;
  // Step 3 - Location
  businessAddress?: string;
  businessCity?: string;
  businessState?: string;
  businessZip?: string;
  serviceAreas?: string[];
  // Step 4 - Services
  services?: string[];
  // Step 5 - Online Presence
  googleEmail?: string;
  websiteUrl?: string;
  monthlyBudget?: string;
}

export interface Session {
  id: string;
  token: string;
  current_step: number;
  form_data: FormData;
  status: "in_progress" | "completed" | "abandoned";
}

export const TOTAL_STEPS = 7; // Steps 0–6

export const DOCUMENT_TYPES = [
  { key: "business_license", label: "Business License" },
  { key: "insurance", label: "Insurance Certificate" },
  { key: "utility_bill", label: "Utility Bill" },
  { key: "gov_id", label: "Government ID" },
] as const;

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const SERVICE_OPTIONS = [
  "Plumbing",
  "Electrical",
  "HVAC",
  "Roofing",
  "Painting",
  "Landscaping",
  "Cleaning",
  "Pest Control",
  "Garage Doors",
  "Fencing",
  "Handyman",
  "Locksmith",
] as const;

export const BUDGET_OPTIONS = [
  { label: "$500 – $1,000 / month", value: "500-1000" },
  { label: "$1,000 – $2,500 / month", value: "1000-2500" },
  { label: "$2,500 – $5,000 / month", value: "2500-5000" },
  { label: "$5,000+ / month", value: "5000+" },
  { label: "Not sure yet", value: "unsure" },
] as const;
