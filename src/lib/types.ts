/**
 * Database types for Derby Digital Onboarding.
 * Maps to the Supabase tables: sessions, documents, submissions.
 */

export interface Session {
  id: string;
  token: string;
  current_step: number;
  status: "in_progress" | "complete";
  form_data: FormData;
  created_at: string;
  updated_at: string;
}

export interface FormData {
  // Step 2: Business Information
  business_name?: string;
  owner_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;

  // Step 3: Services and Trade
  service_categories?: string[];
  other_service?: string;
  service_area?: string;
  years_in_business?: number;
  employees?: string;

  // Step 5: Ad Preferences
  website_url?: string;
  google_account_email?: string;
  monthly_budget?: string;
  current_platforms?: string[];
  facebook_url?: string;
  instagram_url?: string;
}

export interface Document {
  id: string;
  session_id: string;
  doc_type: "business_license" | "insurance" | "government_id" | "utility_bill" | "utility_bill_1" | "utility_bill_2";
  file_name: string;
  storage_path: string;
  file_size: number;
  mime_type: string;
  created_at: string;
}

export interface Submission {
  id: string;
  session_id: string;
  business_name: string | null;
  business_phone: string | null;
  business_email: string | null;
  business_address: string | null;
  business_city: string | null;
  business_state: string | null;
  business_zip: string | null;
  service_categories: string[];
  service_area_miles: number | null;
  weekly_budget_cents: number | null;
  target_start_date: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  submitted_at: string;
  created_at: string;
  kickoff_booked_at: string | null;
  pipeline_status: "new" | "in_progress" | "active";
  notes: Record<string, unknown> | null;
}

/**
 * Column mapping: PRD field names → actual DB column names on submissions.
 * The wizard stores data in session.form_data using PRD field names.
 * On submit, map to the actual DB columns.
 */
export const SUBMISSION_FIELD_MAP = {
  business_name: "business_name",
  owner_name: "contact_name",
  phone: "business_phone",
  email: "business_email",
  address: "business_address",
  city: "business_city",
  state: "business_state",
  zip: "business_zip",
  service_categories: "service_categories",
} as const;
