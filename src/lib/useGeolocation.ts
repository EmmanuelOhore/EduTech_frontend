import { useCallback, useState } from "react";

export type GeoState = {
  lat: number;
  lng: number;
  accuracyM?: number;
} | null;

export type GeoStatus = "idle" | "locating" | "granted" | "denied" | "error";

/**
 * Thin wrapper around the browser Geolocation API for the teacher GPS opt-in.
 * Returns a `request()` that resolves with coordinates (or null) and tracks
 * status so callers can show the right UI. Never throws.
 */
export function useGeolocation() {
  const [coords, setCoords] = useState<GeoState>(null);
  const [status, setStatus] = useState<GeoStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const request = useCallback((): Promise<GeoState> => {
    return new Promise((resolve) => {
      if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
        setStatus("error");
        setError("Location isn't supported on this device.");
        resolve(null);
        return;
      }

      setStatus("locating");
      setError(null);

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const next: GeoState = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracyM: pos.coords.accuracy,
          };
          setCoords(next);
          setStatus("granted");
          resolve(next);
        },
        (err) => {
          if (err.code === err.PERMISSION_DENIED) {
            setStatus("denied");
            setError("Location permission was denied.");
          } else {
            setStatus("error");
            setError("Couldn't get your location. Try again.");
          }
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
      );
    });
  }, []);

  return { coords, status, error, request };
}
