"use client";

import { useCallback, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Input from "@/components/ui/Input";
import AddressAutocomplete from "@/components/ui/AddressAutocomplete";
import ServiceAreaPicker from "@/components/ui/ServiceAreaPicker";
import StepNavigation from "@/components/wizard/StepNavigation";
import { useWizard } from "@/components/wizard/WizardProvider";
import { staggerContainer, staggerItem } from "@/lib/animations";
import type { ParsedAddress } from "@/lib/hooks/usePlacesAutocomplete";

export default function Location() {
  const { formData, updateFields } = useWizard();
  const prefersReduced = useReducedMotion();

  const areas = useMemo(
    () => formData.serviceAreas ?? [],
    [formData.serviceAreas]
  );

  const handleAddressSelect = useCallback(
    (parsed: ParsedAddress) => {
      updateFields({
        businessAddress: parsed.businessAddress,
        businessCity: parsed.businessCity,
        businessState: parsed.businessState,
        businessZip: parsed.businessZip,
      });
    },
    [updateFields]
  );

  const addArea = useCallback(
    (area: string) => {
      updateFields({ serviceAreas: [...areas, area] });
    },
    [areas, updateFields]
  );

  const removeArea = useCallback(
    (area: string) => {
      updateFields({ serviceAreas: areas.filter((a) => a !== area) });
    },
    [areas, updateFields]
  );

  const addressOk = Boolean(formData.businessAddress?.trim());
  const canAdvance = addressOk;

  const subtitle = formData.businessName?.trim()
    ? `Let\u2019s map out where ${formData.businessName} is going to dominate.`
    : "Let\u2019s map out where you\u2019re going to dominate.";

  return (
    <div>
      <motion.div
        variants={prefersReduced ? undefined : staggerContainer}
        initial="hidden"
        animate="show"
      >
        <motion.h2
          className="font-heading text-2xl text-white mb-2"
          variants={prefersReduced ? undefined : staggerItem}
        >
          YOUR TERRITORY
        </motion.h2>
        <motion.p
          className="text-white/60 font-body text-sm mb-6"
          variants={prefersReduced ? undefined : staggerItem}
        >
          {subtitle}
        </motion.p>
        <motion.div variants={prefersReduced ? undefined : staggerItem}>
          <AddressAutocomplete
            value={formData.businessAddress ?? ""}
            onChange={(v) => updateFields({ businessAddress: v })}
            onSelect={handleAddressSelect}
            valid={addressOk}
            required
          />
        </motion.div>
        <motion.div className="grid grid-cols-2 sm:grid-cols-3 gap-4" variants={prefersReduced ? undefined : staggerItem}>
          <Input
            label="City"
            placeholder="Austin"
            value={formData.businessCity ?? ""}
            onChange={(e) => updateFields({ businessCity: e.target.value })}
            valid={Boolean(formData.businessCity?.trim())}
          />
          <Input
            label="State"
            placeholder="TX"
            maxLength={2}
            value={formData.businessState ?? ""}
            onChange={(e) =>
              updateFields({ businessState: e.target.value.toUpperCase() })
            }
            valid={Boolean(formData.businessState?.trim())}
          />
          <Input
            label="ZIP Code"
            placeholder="78701"
            value={formData.businessZip ?? ""}
            onChange={(e) => updateFields({ businessZip: e.target.value })}
            valid={Boolean(formData.businessZip?.trim())}
          />
        </motion.div>

        <motion.div variants={prefersReduced ? undefined : staggerItem}>
          <ServiceAreaPicker
            areas={areas}
            onAdd={addArea}
            onRemove={removeArea}
          />
        </motion.div>
      </motion.div>

      <StepNavigation canAdvance={canAdvance} />
    </div>
  );
}
