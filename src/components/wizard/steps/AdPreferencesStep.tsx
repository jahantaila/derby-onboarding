"use client";

import { useState, useCallback, useRef } from "react";
import { useWizard } from "../WizardContext";

const BUDGET_OPTIONS = [
  { value: "500-1000", label: "$500 - $1,000", sublabel: "Starter" },
  { value: "1000-2000", label: "$1,000 - $2,000", sublabel: "Growth" },
  { value: "2000-3000", label: "$2,000 - $3,000", sublabel: "Accelerator" },
  { value: "3000+", label: "$3,000+", sublabel: "Dominator" },
] as const;

const PLATFORM_OPTIONS = [
  { id: "google_ads", label: "Google Ads", icon: "🔍" },
  { id: "angi", label: "Angi", icon: "🏠" },
  { id: "homeadvisor", label: "HomeAdvisor", icon: "🔧" },
  { id: "thumbtack", label: "Thumbtack", icon: "📌" },
  { id: "yelp", label: "Yelp", icon: "⭐" },
  { id: "facebook", label: "Facebook", icon: "📘" },
  { id: "none", label: "None", icon: "🚫" },
] as const;

interface FieldErrors {
  google_account_email?: string;
  monthly_budget?: string;
  website_url?: string;
}

export default function AdPreferencesStep() {
  const { formData, updateFormData, sessionToken, goNext, goBack } = useWizard();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedPlatforms: string[] = formData.current_platforms || [];

  const autoSave = useCallback(
    (fieldData: Record<string, unknown>) => {
      if (!sessionToken) return;
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(async () => {
        setSaving(true);
        try {
          await fetch(`/api/sessions/${sessionToken}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ form_data: fieldData, current_step: 5 }),
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

  function handleFieldChange(field: string, value: string) {
    updateFormData({ [field]: value });
    if (errors[field as keyof FieldErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  function handleFieldBlur(field: string) {
    const value = formData[field as keyof typeof formData] as string | undefined;

    if (field === "google_account_email") {
      if (!value?.trim()) {
        setErrors((prev) => ({ ...prev, google_account_email: "Google account email is required" }));
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        setErrors((prev) => ({ ...prev, google_account_email: "Please enter a valid email" }));
        return;
      }
    }

    if (field === "website_url" && value?.trim()) {
      // Optional field, only validate format if provided
      if (!/^https?:\/\/.+/.test(value) && !/^[a-zA-Z0-9]/.test(value)) {
        setErrors((prev) => ({ ...prev, website_url: "Please enter a valid URL" }));
        return;
      }
    }

    setErrors((prev) => ({ ...prev, [field]: undefined }));
    if (value?.trim()) {
      autoSave({ [field]: value.trim() });
    }
  }

  function selectBudget(value: string) {
    updateFormData({ monthly_budget: value });
    if (errors.monthly_budget) {
      setErrors((prev) => ({ ...prev, monthly_budget: undefined }));
    }
    autoSave({ monthly_budget: value });
  }

  function togglePlatform(id: string) {
    let updated: string[];

    if (id === "none") {
      // Selecting "None" clears all others
      updated = selectedPlatforms.includes("none") ? [] : ["none"];
    } else {
      // Selecting any platform removes "None"
      const withoutNone = selectedPlatforms.filter((p) => p !== "none");
      updated = withoutNone.includes(id)
        ? withoutNone.filter((p) => p !== id)
        : [...withoutNone, id];
    }

    updateFormData({ current_platforms: updated });
    autoSave({ current_platforms: updated });
  }

  function validateAll(): boolean {
    const newErrors: FieldErrors = {};

    if (!formData.google_account_email?.trim()) {
      newErrors.google_account_email = "Google account email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.google_account_email)) {
      newErrors.google_account_email = "Please enter a valid email";
    }

    if (!formData.monthly_budget) {
      newErrors.monthly_budget = "Please select a monthly budget";
    }

    setErrors(newErrors);
    return Object.values(newErrors).every((e) => !e);
  }

  function handleContinue() {
    if (validateAll()) {
      if (sessionToken) {
        fetch(`/api/sessions/${sessionToken}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            form_data: {
              website_url: formData.website_url?.trim() || undefined,
              google_account_email: formData.google_account_email?.trim(),
              monthly_budget: formData.monthly_budget,
              current_platforms: selectedPlatforms,
              facebook_url: formData.facebook_url?.trim() || undefined,
              instagram_url: formData.instagram_url?.trim() || undefined,
            },
            current_step: 6,
          }),
        });
      }
      goNext();
    }
  }

  function inputClasses(field?: keyof FieldErrors) {
    const hasError = field && errors[field];
    return `w-full bg-derby-dark border ${
      hasError ? "border-red-500" : "border-gray-700 focus:border-derby-blue"
    } rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none transition-all focus:ring-1 ${
      hasError ? "focus:ring-red-500" : "focus:ring-derby-blue"
    }`;
  }

  return (
    <div className="max-w-2xl mx-auto px-4">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Ad Preferences</h2>
        <p className="text-gray-400">Tell us about your online presence and advertising goals.</p>
      </div>

      {/* Website URL (optional) */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-300 mb-1.5">
          Website URL <span className="text-gray-500">(optional)</span>
        </label>
        <input
          type="url"
          value={formData.website_url || ""}
          onChange={(e) => handleFieldChange("website_url", e.target.value)}
          onBlur={() => handleFieldBlur("website_url")}
          placeholder="https://yourbusiness.com"
          className={inputClasses("website_url")}
        />
        {errors.website_url && (
          <p className="mt-1 text-sm text-red-400">{errors.website_url}</p>
        )}
      </div>

      {/* Google Account Email */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-300 mb-1.5">
          Google Account Email <span className="text-red-400">*</span>
        </label>
        <input
          type="email"
          value={formData.google_account_email || ""}
          onChange={(e) => handleFieldChange("google_account_email", e.target.value)}
          onBlur={() => handleFieldBlur("google_account_email")}
          placeholder="your.email@gmail.com"
          className={inputClasses("google_account_email")}
        />
        <p className="mt-1 text-xs text-gray-500">We&apos;ll use this to set up your Google Ads account</p>
        {errors.google_account_email && (
          <p className="mt-1 text-sm text-red-400">{errors.google_account_email}</p>
        )}
      </div>

      {/* Monthly Budget Radio Cards */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Monthly Ad Budget <span className="text-red-400">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          {BUDGET_OPTIONS.map((opt) => {
            const isSelected = formData.monthly_budget === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => selectBudget(opt.value)}
                className={`relative flex flex-col items-center justify-center gap-1 p-4 rounded-xl border-2 transition-all duration-200 ${
                  isSelected
                    ? "border-derby-blue bg-derby-blue/10 shadow-lg shadow-derby-blue/10"
                    : "border-gray-700 bg-derby-card hover:border-gray-500"
                }`}
              >
                <span className={`text-lg font-bold ${isSelected ? "text-white" : "text-gray-200"}`}>
                  {opt.label}
                </span>
                <span className={`text-xs ${isSelected ? "text-derby-blue" : "text-gray-500"}`}>
                  {opt.sublabel}
                </span>
                {isSelected && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-gradient-to-r from-derby-blue to-derby-blue-deep flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
        {errors.monthly_budget && (
          <p className="mt-2 text-sm text-red-400">{errors.monthly_budget}</p>
        )}
      </div>

      {/* Current Platforms */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Current Advertising Platforms
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {PLATFORM_OPTIONS.map((plat) => {
            const isSelected = selectedPlatforms.includes(plat.id);
            return (
              <button
                key={plat.id}
                type="button"
                onClick={() => togglePlatform(plat.id)}
                className={`relative flex items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 ${
                  isSelected
                    ? "border-derby-blue bg-derby-blue/10 shadow-lg shadow-derby-blue/10"
                    : "border-gray-700 bg-derby-card hover:border-gray-500"
                }`}
              >
                <span className="text-lg">{plat.icon}</span>
                <span className={`text-sm font-medium ${isSelected ? "text-white" : "text-gray-300"}`}>
                  {plat.label}
                </span>
                {isSelected && (
                  <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-gradient-to-r from-derby-blue to-derby-blue-deep flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Social Links */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Social Media <span className="text-gray-500">(optional)</span>
        </label>
        <div className="space-y-3">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-sm text-gray-400">Facebook</span>
            </div>
            <input
              type="url"
              value={formData.facebook_url || ""}
              onChange={(e) => handleFieldChange("facebook_url", e.target.value)}
              onBlur={() => {
                if (formData.facebook_url?.trim()) {
                  autoSave({ facebook_url: formData.facebook_url.trim() });
                }
              }}
              placeholder="https://facebook.com/yourbusiness"
              className={inputClasses()}
            />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-sm text-gray-400">Instagram</span>
            </div>
            <input
              type="url"
              value={formData.instagram_url || ""}
              onChange={(e) => handleFieldChange("instagram_url", e.target.value)}
              onBlur={() => {
                if (formData.instagram_url?.trim()) {
                  autoSave({ instagram_url: formData.instagram_url.trim() });
                }
              }}
              placeholder="https://instagram.com/yourbusiness"
              className={inputClasses()}
            />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-10">
        <button
          onClick={goBack}
          className="px-6 py-3 rounded-xl border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 transition-all"
        >
          Back
        </button>
        <div className="flex items-center gap-3">
          {saving && (
            <span className="text-xs text-gray-500">Saving...</span>
          )}
          <button
            onClick={handleContinue}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-derby-blue to-derby-blue-deep text-white font-semibold hover:shadow-lg hover:shadow-derby-blue/25 transition-all"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
