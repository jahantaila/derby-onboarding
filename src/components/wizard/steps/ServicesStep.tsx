"use client";

import { useState, useCallback, useRef } from "react";
import { useWizard } from "../WizardContext";

const SERVICE_CATEGORIES = [
  { id: "electrician", label: "Electrician", icon: "⚡" },
  { id: "plumber", label: "Plumber", icon: "🔧" },
  { id: "hvac", label: "HVAC", icon: "❄️" },
  { id: "roofer", label: "Roofer", icon: "🏠" },
  { id: "painter", label: "Painter", icon: "🎨" },
  { id: "remodeler", label: "Remodeler", icon: "🔨" },
  { id: "handyman", label: "Handyman", icon: "🛠️" },
  { id: "general_contractor", label: "General Contractor", icon: "🏗️" },
  { id: "landscaper", label: "Landscaper", icon: "🌿" },
  { id: "pest_control", label: "Pest Control", icon: "🐛" },
  { id: "garage_door", label: "Garage Door", icon: "🚗" },
  { id: "locksmith", label: "Locksmith", icon: "🔑" },
  { id: "other", label: "Other", icon: "➕" },
] as const;

const EMPLOYEE_OPTIONS = [
  "Just me",
  "2-5",
  "6-10",
  "11-25",
  "26-50",
  "50+",
];

interface FieldErrors {
  service_categories?: string;
  service_area?: string;
  years_in_business?: string;
  employees?: string;
  other_service?: string;
}

export default function ServicesStep() {
  const { formData, updateFormData, sessionToken, goNext, goBack } = useWizard();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [otherService, setOtherService] = useState(formData.other_service || "");
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedCategories: string[] = formData.service_categories || [];

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
            body: JSON.stringify({ form_data: fieldData, current_step: 3 }),
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

  function toggleCategory(id: string) {
    const updated = selectedCategories.includes(id)
      ? selectedCategories.filter((c) => c !== id)
      : [...selectedCategories, id];

    updateFormData({ service_categories: updated });
    if (errors.service_categories) {
      setErrors((prev) => ({ ...prev, service_categories: undefined }));
    }

    // If deselecting "other", clear the other service text
    if (id === "other" && selectedCategories.includes("other")) {
      setOtherService("");
      updateFormData({ service_categories: updated, other_service: undefined });
      autoSave({ service_categories: updated, other_service: "" });
    } else {
      autoSave({ service_categories: updated });
    }
  }

  function handleFieldChange(field: "service_area" | "years_in_business" | "employees", value: string) {
    if (field === "years_in_business") {
      const num = value === "" ? undefined : parseInt(value, 10);
      updateFormData({ [field]: num });
    } else {
      updateFormData({ [field]: value });
    }
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  function handleFieldBlur(field: "service_area" | "years_in_business" | "employees") {
    const value = formData[field];
    if (!value && value !== 0) {
      setErrors((prev) => ({ ...prev, [field]: "This field is required" }));
    } else {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
      autoSave({ [field]: value });
    }
  }

  function handleOtherBlur() {
    if (selectedCategories.includes("other") && !otherService.trim()) {
      setErrors((prev) => ({ ...prev, other_service: "Please specify your service" }));
    } else {
      setErrors((prev) => ({ ...prev, other_service: undefined }));
      updateFormData({ other_service: otherService.trim() });
      autoSave({ other_service: otherService.trim() });
    }
  }

  function validateAll(): boolean {
    const newErrors: FieldErrors = {};

    if (selectedCategories.length === 0) {
      newErrors.service_categories = "Please select at least one service";
    }
    if (selectedCategories.includes("other") && !otherService.trim()) {
      newErrors.other_service = "Please specify your service";
    }
    if (!formData.service_area?.toString().trim()) {
      newErrors.service_area = "This field is required";
    }
    if (formData.years_in_business === undefined || formData.years_in_business === null) {
      newErrors.years_in_business = "This field is required";
    }
    if (!formData.employees) {
      newErrors.employees = "This field is required";
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
              service_categories: selectedCategories,
              other_service: otherService.trim() || undefined,
              service_area: formData.service_area,
              years_in_business: formData.years_in_business,
              employees: formData.employees,
            },
            current_step: 4,
          }),
        });
      }
      goNext();
    }
  }

  function inputClasses(field: keyof FieldErrors) {
    return `w-full bg-derby-dark border ${
      errors[field] ? "border-red-500" : "border-gray-700 focus:border-derby-blue"
    } rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none transition-all focus:ring-1 ${
      errors[field] ? "focus:ring-red-500" : "focus:ring-derby-blue"
    }`;
  }

  return (
    <div className="max-w-2xl mx-auto px-4">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Services &amp; Trade</h2>
        <p className="text-gray-400">What services does your business offer?</p>
      </div>

      {/* Service Category Cards */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Select your services <span className="text-red-400">*</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {SERVICE_CATEGORIES.map((cat) => {
            const isSelected = selectedCategories.includes(cat.id);
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => toggleCategory(cat.id)}
                className={`relative flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                  isSelected
                    ? "border-derby-blue bg-derby-blue/10 shadow-lg shadow-derby-blue/10"
                    : "border-gray-700 bg-derby-card hover:border-gray-500"
                }`}
              >
                <span className="text-2xl">{cat.icon}</span>
                <span className={`text-sm font-medium ${isSelected ? "text-white" : "text-gray-300"}`}>
                  {cat.label}
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
        {errors.service_categories && (
          <p className="mt-2 text-sm text-red-400">{errors.service_categories}</p>
        )}
      </div>

      {/* Other service text input */}
      {selectedCategories.includes("other") && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Specify your service <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={otherService}
            onChange={(e) => {
              setOtherService(e.target.value);
              if (errors.other_service) setErrors((prev) => ({ ...prev, other_service: undefined }));
            }}
            onBlur={handleOtherBlur}
            placeholder="e.g. Chimney Sweep"
            className={inputClasses("other_service")}
          />
          {errors.other_service && (
            <p className="mt-1 text-sm text-red-400">{errors.other_service}</p>
          )}
        </div>
      )}

      {/* Service Area */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-300 mb-1.5">
          Service Area <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={formData.service_area || ""}
          onChange={(e) => handleFieldChange("service_area", e.target.value)}
          onBlur={() => handleFieldBlur("service_area")}
          placeholder="e.g. Louisville metro area, 30-mile radius"
          className={inputClasses("service_area")}
        />
        {errors.service_area && (
          <p className="mt-1 text-sm text-red-400">{errors.service_area}</p>
        )}
      </div>

      {/* Years in Business + Employees row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Years in Business <span className="text-red-400">*</span>
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={formData.years_in_business ?? ""}
            onChange={(e) => handleFieldChange("years_in_business", e.target.value)}
            onBlur={() => handleFieldBlur("years_in_business")}
            placeholder="e.g. 5"
            className={inputClasses("years_in_business")}
          />
          {errors.years_in_business && (
            <p className="mt-1 text-sm text-red-400">{errors.years_in_business}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Number of Employees <span className="text-red-400">*</span>
          </label>
          <select
            value={formData.employees || ""}
            onChange={(e) => {
              handleFieldChange("employees", e.target.value);
              if (e.target.value) autoSave({ employees: e.target.value });
            }}
            onBlur={() => handleFieldBlur("employees")}
            className={inputClasses("employees")}
          >
            <option value="">Select</option>
            {EMPLOYEE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          {errors.employees && (
            <p className="mt-1 text-sm text-red-400">{errors.employees}</p>
          )}
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
