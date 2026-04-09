"use client";

import { useState, useCallback, useRef } from "react";
import { useWizard } from "../WizardContext";

const SERVICE_CATEGORIES = [
  { id: "electrician", label: "Electrician", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
  { id: "plumber", label: "Plumber", icon: "M21.71 20.29l-1.42 1.42a1 1 0 01-1.41 0L15 17.83l-2.12 2.12a1 1 0 01-1.41 0l-1.42-1.42a1 1 0 010-1.41L12.17 15l-3.88-3.88a3 3 0 01-.29-3.83l-2.12-2.12L7.3 3.76l2.12 2.12a3 3 0 013.83.29L17.12 10l2.12-2.12a1 1 0 011.42 0l1.41 1.42a1 1 0 010 1.41L19.95 12.83l3.88 3.88a1 1 0 01-.12 1.58z" },
  { id: "hvac", label: "HVAC", icon: "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" },
  { id: "roofer", label: "Roofer", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { id: "painter", label: "Painter", icon: "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" },
  { id: "remodeler", label: "Remodeler", icon: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" },
  { id: "handyman", label: "Handyman", icon: "M11.42 15.17l-5.59-5.59a2 2 0 010-2.83l.88-.88a2 2 0 012.83 0l5.59 5.59m-7.71 7.71l5.59 5.59a2 2 0 002.83 0l.88-.88a2 2 0 000-2.83l-5.59-5.59m-4.24 4.24l2.83 2.83m7.07-7.07l2.83 2.83" },
  { id: "general_contractor", label: "General Contractor", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
  { id: "landscaper", label: "Landscaper", icon: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" },
  { id: "pest_control", label: "Pest Control", icon: "M12 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-5.5 3L3 14l1.5 1.5L7 13m10.5-2L21 14l-1.5 1.5L17 13M12 3v2m0 14v2m-4-9H6m12 0h-2" },
  { id: "garage_door", label: "Garage Door", icon: "M8 7h8m-8 4h8m-8 4h8M4 3h16a1 1 0 011 1v16a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1z" },
  { id: "locksmith", label: "Locksmith", icon: "M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" },
  { id: "other", label: "Other", icon: "M12 4v16m8-8H4" },
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
        <h2 className="text-3xl sm:text-4xl font-heading uppercase text-gray-900 mb-2 leading-tight">Services &amp; Trade</h2>
        <p className="text-gray-500 text-base">What services does your business offer?</p>
      </div>

      {/* Service Category Cards */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Select your services <span className="text-red-500">*</span>
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
                    ? "border-derby-blue bg-blue-50 shadow-lg shadow-derby-blue/10"
                    : "border-[#D1D9E6] bg-white hover:border-derby-blue hover:bg-blue-50/50"
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isSelected ? "bg-derby-blue/10" : "bg-gray-100"
                }`}>
                  <svg className={`w-5 h-5 ${isSelected ? "text-derby-blue" : "text-gray-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={cat.icon} />
                  </svg>
                </div>
                <span className={`text-sm font-medium ${isSelected ? "text-gray-900" : "text-gray-700"}`}>
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
        {errorMessage(errors.service_categories)}
      </div>

      {/* Other service text input */}
      {selectedCategories.includes("other") && (
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Specify your service <span className="text-red-500">*</span>
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
          {errorMessage(errors.other_service)}
        </div>
      )}

      {/* Service Area */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Service Area <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.service_area || ""}
          onChange={(e) => handleFieldChange("service_area", e.target.value)}
          onBlur={() => handleFieldBlur("service_area")}
          placeholder="e.g. Louisville metro area, 30-mile radius"
          className={inputClasses("service_area")}
        />
        {errorMessage(errors.service_area)}
      </div>

      {/* Years in Business + Employees row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Years in Business <span className="text-red-500">*</span>
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
          {errorMessage(errors.years_in_business)}
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Number of Employees <span className="text-red-500">*</span>
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
          {errorMessage(errors.employees)}
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
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-derby-blue to-derby-blue-deep text-white font-semibold hover:shadow-lg hover:shadow-derby-blue/25 transition-all"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
