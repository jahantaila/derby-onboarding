"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

let configured = false;

function ensureConfigured() {
  if (!configured) {
    setOptions({ key: API_KEY, libraries: ["places"] });
    configured = true;
  }
}

export interface ParsedAddress {
  businessAddress: string;
  businessCity: string;
  businessState: string;
  businessZip: string;
}

interface UsePlacesAutocompleteOptions {
  types?: string[];
}

export function usePlacesAutocomplete(
  input: string,
  options?: UsePlacesAutocompleteOptions
) {
  const [predictions, setPredictions] = useState<
    google.maps.places.AutocompletePrediction[]
  >([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const autocompleteService =
    useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!API_KEY) return;

    ensureConfigured();
    importLibrary("places")
      .then(() => {
        autocompleteService.current =
          new google.maps.places.AutocompleteService();
        const div = document.createElement("div");
        placesService.current = new google.maps.places.PlacesService(div);
        setIsLoaded(true);
      })
      .catch(() => {
        // API load failed — fall back to plain inputs
      });
  }, []);

  useEffect(() => {
    if (!isLoaded || !autocompleteService.current || !input.trim()) {
      setPredictions([]);
      return;
    }

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(() => {
      autocompleteService.current!.getPlacePredictions(
        {
          input,
          componentRestrictions: { country: "us" },
          ...(options?.types ? { types: options.types } : {}),
        },
        (results, status) => {
          if (
            status === google.maps.places.PlacesServiceStatus.OK &&
            results
          ) {
            setPredictions(results);
          } else {
            setPredictions([]);
          }
        }
      );
    }, 300);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [input, isLoaded, options?.types]);

  const getPlaceDetails = useCallback(
    (placeId: string): Promise<ParsedAddress | null> => {
      if (!placesService.current) return Promise.resolve(null);

      return new Promise((resolve) => {
        placesService.current!.getDetails(
          { placeId, fields: ["address_components"] },
          (place, status) => {
            if (
              status !== google.maps.places.PlacesServiceStatus.OK ||
              !place?.address_components
            ) {
              resolve(null);
              return;
            }

            let streetNumber = "";
            let route = "";
            let city = "";
            let state = "";
            let zip = "";

            for (const comp of place.address_components) {
              const type = comp.types[0];
              if (type === "street_number") streetNumber = comp.long_name;
              else if (type === "route") route = comp.long_name;
              else if (type === "locality") city = comp.long_name;
              else if (type === "administrative_area_level_1")
                state = comp.short_name;
              else if (type === "postal_code") zip = comp.long_name;
            }

            resolve({
              businessAddress: [streetNumber, route]
                .filter(Boolean)
                .join(" "),
              businessCity: city,
              businessState: state,
              businessZip: zip,
            });
          }
        );
      });
    },
    []
  );

  return { predictions, getPlaceDetails, isLoaded };
}
