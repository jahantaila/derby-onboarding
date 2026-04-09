"use client";

import { useState, useCallback, useRef } from "react";
import { useWizard } from "../WizardContext";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC",
];

const STATE_NAMES: Record<string, string> = {
  AL:"Alabama",AK:"Alaska",AZ:"Arizona",AR:"Arkansas",CA:"California",
  CO:"Colorado",CT:"Connecticut",DE:"Delaware",FL:"Florida",GA:"Georgia",
  HI:"Hawaii",ID:"Idaho",IL:"Illinois",IN:"Indiana",IA:"Iowa",KS:"Kansas",
  KY:"Kentucky",LA:"Louisiana",ME:"Maine",MD:"Maryland",MA:"Massachusetts",
  MI:"Michigan",MN:"Minnesota",MS:"Mississippi",MO:"Missouri",MT:"Montana",
  NE:"Nebraska",NV:"Nevada",NH:"New Hampshire",NJ:"New Jersey",NM:"New Mexico",
  NY:"New York",NC:"North Carolina",ND:"North Dakota",OH:"Ohio",OK:"Oklahoma",
  OR:"Oregon",PA:"Pennsylvania",RI:"Rhode Island",SC:"South Carolina",
  SD:"South Dakota",TN:"Tennessee",TX:"Texas",UT:"Utah",VT:"Vermont",
  VA:"Virginia",WA:"Washington",WV:"West Virginia",WI:"Wisconsin",WY:"Wyoming",
  DC:"District of Columbia",
};

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateZip(zip: string): boolean {
  return /^\d{5}(-\d{4})?$/.test(zip);
}

interface FieldErrors {
  business_name?: string;
  owner_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
}

export default function BusinessInfoStep() {
  const { formData, updateFormData, sessionToken, goNext, goBack } = useWizard();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [isHomeAddress, setIsHomeAddress] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const autoSave = useCallback(
    (fieldData: Record<string, string>) => {
      if (!sessionToken) return;

      // Debounce saves
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(async () => {
        setSaving(true);
        try {
          await fetch(`/api/sessions/${sessionToken}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ form_data: fieldData, current_step: 2 }),
          });
        } catch {
          // Silent fail for auto-save
        } finally {
          setSaving(false);
        }
      }, 500);
    },
    [sessionToken]
  );

  function handleChange(field: keyof FieldErrors, value: string) {
    const processed = field === "phone" ? formatPhone(value) : value;
    updateFormData({ [field]: processed });
    // Clear error on change
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  function handleBlur(field: keyof FieldErrors) {
    const value = (formData[field] || "").toString().trim();

    // Validate on blur
    let error: string | undefined;
    if (!value) {
      error = "This field is required";
    } else if (field === "email" && !validateEmail(value)) {
      error = "Please enter a valid email";
    } else if (field === "zip" && !validateZip(value)) {
      error = "Please enter a valid ZIP code";
    } else if (field === "phone" && value.replace(/\D/g, "").length < 10) {
      error = "Please enter a 10-digit phone number";
    }

    if (error) {
      setErrors((prev) => ({ ...prev, [field]: error }));
    } else {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
      // Auto-save valid field
      autoSave({ [field]: value });
    }
  }

  function validateAll(): boolean {
    const newErrors: FieldErrors = {};
    const requiredFields: (keyof FieldErrors)[] = [
      "business_name", "owner_name", "phone", "email", "address", "city", "state", "zip",
    ];

    for (const field of requiredFields) {
      const value = (formData[field] || "").toString().trim();
      if (!value) {
        newErrors[field] = "This field is required";
      } else if (field === "email" && !validateEmail(value)) {
        newErrors[field] = "Please enter a valid email";
      } else if (field === "zip" && !validateZip(value)) {
        newErrors[field] = "Please enter a valid ZIP code";
      } else if (field === "phone" && value.replace(/\D/g, "").length < 10) {
        newErrors[field] = "Please enter a 10-digit phone number";
      }
    }

    setErrors(newErrors);
    return Object.values(newErrors).every((e) => !e);
  }

  function handleContinue() {
    if (validateAll()) {
      // Save all data before advancing
      if (sessionToken) {
        fetch(`/api/sessions/${sessionToken}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            form_data: {
              business_name: formData.business_name,
              owner_name: formData.owner_name,
              phone: formData.phone,
              email: formData.email,
              address: formData.address,
              city: formData.city,
              state: formData.state,
              zip: formData.zip,
            },
            current_step: 3,
          }),
        });
      }
      goNext();
    }
  }

  function inputClasses(field: keyof FieldErrors) {
    return `w-full bg-white border ${
      errors[field] ? "border-red-500" : "border-[#D1D9E6] focus:border-derby-blue"
    } rounded-xl h-12 px-4 text-base text-gray-900 placeholder-gray-400 outline-none transition-all focus:ring-1 focus:shadow-sm ${
      errors[field] ? "focus:ring-red-500" : "focus:ring-derby-blue"
    }`;
  }

  function errorMessage(msg?: string) {
    if (!msg) return null;
    return (
      <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1.5">
        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
        {msg}
      </p>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4">
      <div className="mb-10">
        <h2 className="text-3xl sm:text-4xl font-heading uppercase text-gray-900 mb-2 leading-tight">Business Information</h2>
        <p className="text-gray-500 text-base">Tell us about your business so we can get started.</p>
      </div>

      <div className="space-y-6 animate-field-stagger">
        {/* Business Name */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Business Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.business_name || ""}
            onChange={(e) => handleChange("business_name", e.target.value)}
            onBlur={() => handleBlur("business_name")}
            placeholder="e.g. Smith Plumbing LLC"
            className={inputClasses("business_name")}
          />
          {errorMessage(errors.business_name)}
          <p className="mt-1.5 text-xs text-gray-400 flex items-center gap-1"><svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>This must be your legal business name as it appears on your business license</p>
        </div>

        {/* Owner Name */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Owner Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.owner_name || ""}
            onChange={(e) => handleChange("owner_name", e.target.value)}
            onBlur={() => handleBlur("owner_name")}
            placeholder="e.g. John Smith"
            className={inputClasses("owner_name")}
          />
          {errorMessage(errors.owner_name)}
        </div>

        {/* Phone + Email row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Phone <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={formData.phone || ""}
              onChange={(e) => handleChange("phone", e.target.value)}
              onBlur={() => handleBlur("phone")}
              placeholder="(502) 555-0123"
              className={inputClasses("phone")}
            />
            {errorMessage(errors.phone)}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email || ""}
              onChange={(e) => handleChange("email", e.target.value)}
              onBlur={() => handleBlur("email")}
              placeholder="john@smithplumbing.com"
              className={inputClasses("email")}
            />
            {errorMessage(errors.email)}
            <p className="mt-1.5 text-xs text-gray-400 flex items-center gap-1"><svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>This must be the Google/Gmail account we'll use to set up your ads</p>
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Street Address <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.address || ""}
            onChange={(e) => handleChange("address", e.target.value)}
            onBlur={() => handleBlur("address")}
            placeholder="123 Main Street"
            className={inputClasses("address")}
          />
          {errorMessage(errors.address)}
        </div>

        {/* City, State, ZIP row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              City <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.city || ""}
              onChange={(e) => handleChange("city", e.target.value)}
              onBlur={() => handleBlur("city")}
              placeholder="Louisville"
              className={inputClasses("city")}
            />
            {errorMessage(errors.city)}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              State <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.state || ""}
              onChange={(e) => {
                handleChange("state", e.target.value);
                if (e.target.value) autoSave({ state: e.target.value });
              }}
              onBlur={() => handleBlur("state")}
              className={inputClasses("state")}
            >
              <option value="">Select</option>
              {US_STATES.map((s) => (
                <option key={s} value={s}>
                  {STATE_NAMES[s]}
                </option>
              ))}
            </select>
            {errorMessage(errors.state)}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              ZIP Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.zip || ""}
              onChange={(e) => handleChange("zip", e.target.value)}
              onBlur={() => handleBlur("zip")}
              placeholder="40202"
              maxLength={10}
              className={inputClasses("zip")}
            />
            {errorMessage(errors.zip)}
          </div>
        </div>

        {/* Home Address Toggle */}
        <div className="flex items-start gap-3 pt-1">
          <button
            type="button"
            role="switch"
            aria-checked={isHomeAddress}
            onClick={() => setIsHomeAddress((prev) => !prev)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-derby-blue focus:ring-offset-2 ${
              isHomeAddress ? "bg-derby-blue" : "bg-gray-200"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                isHomeAddress ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
          <div>
            <span className="text-sm font-medium text-gray-700">Is this your home address?</span>
            <p className="mt-0.5 text-xs text-gray-400 flex items-center gap-1"><svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>If this is a home address, it will be kept private on your Google Business Profile</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-10">
        <button
          onClick={goBack}
          className="px-6 py-3 rounded-xl border border-gray-300 text-gray-600 hover:text-gray-900 hover:border-gray-400 transition-all"
        >
          Back
        </button>
        <div className="flex items-center gap-3">
          {saving && (
            <span className="text-xs text-gray-500">Saving...</span>
          )}
          <button
            onClick={handleContinue}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-derby-blue to-derby-blue-deep text-white font-semibold hover:shadow-lg hover:shadow-derby-blue/25 transition-all btn-interactive"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
