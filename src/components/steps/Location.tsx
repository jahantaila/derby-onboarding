"use client";

import { useState } from "react";
import Input from "@/components/ui/Input";
import StepNavigation from "@/components/wizard/StepNavigation";
import { useWizard } from "@/components/wizard/WizardProvider";

export default function Location() {
  const { formData, updateFields } = useWizard();
  const [areaInput, setAreaInput] = useState("");

  const areas = formData.serviceAreas ?? [];

  const addArea = () => {
    const trimmed = areaInput.trim();
    if (trimmed && !areas.includes(trimmed)) {
      updateFields({ serviceAreas: [...areas, trimmed] });
    }
    setAreaInput("");
  };

  const removeArea = (area: string) => {
    updateFields({ serviceAreas: areas.filter((a) => a !== area) });
  };

  const canAdvance = Boolean(formData.businessAddress?.trim());

  return (
    <div>
      <h2 className="font-heading text-2xl text-white mb-2">
        YOUR TERRITORY
      </h2>
      <p className="text-white/60 font-body text-sm mb-6">
        Let&apos;s map out where you&apos;re going to dominate.
      </p>
      <Input
        label="Street Address"
        placeholder="123 Main St"
        required
        value={formData.businessAddress ?? ""}
        onChange={(e) => updateFields({ businessAddress: e.target.value })}
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Input
          label="City"
          placeholder="Austin"
          value={formData.businessCity ?? ""}
          onChange={(e) => updateFields({ businessCity: e.target.value })}
        />
        <Input
          label="State"
          placeholder="TX"
          maxLength={2}
          value={formData.businessState ?? ""}
          onChange={(e) =>
            updateFields({ businessState: e.target.value.toUpperCase() })
          }
        />
        <Input
          label="ZIP Code"
          placeholder="78701"
          value={formData.businessZip ?? ""}
          onChange={(e) => updateFields({ businessZip: e.target.value })}
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm text-white/70 font-body mb-1">
          Service Areas
        </label>
        <div className="flex gap-2">
          <input
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white font-body placeholder:text-white/30 focus:outline-none focus:border-derby-blue-light focus:ring-1 focus:ring-derby-blue-light transition-colors"
            placeholder="e.g. North Austin"
            value={areaInput}
            onChange={(e) => setAreaInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addArea();
              }
            }}
          />
          <button
            type="button"
            onClick={addArea}
            className="bg-white/10 text-white px-4 py-3 rounded-lg hover:bg-white/20 transition-colors font-body"
          >
            Add
          </button>
        </div>
        {areas.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {areas.map((area) => (
              <span
                key={area}
                className="bg-derby-blue/20 text-derby-blue-light text-sm font-body px-3 py-1 rounded-full flex items-center gap-1"
              >
                {area}
                <button
                  type="button"
                  onClick={() => removeArea(area)}
                  className="hover:text-white ml-1"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <StepNavigation canAdvance={canAdvance} />
    </div>
  );
}
