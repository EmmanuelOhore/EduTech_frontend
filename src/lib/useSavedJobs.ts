import { useCallback, useEffect, useState } from "react";

const SAVED_JOBS_KEY = "edustaff-saved-jobs";
const SAVED_JOBS_EVENT = "edustaff:saved-jobs";

const readSavedJobs = () => {
  if (typeof window === "undefined") return [] as string[];
  try {
    const raw = window.localStorage.getItem(SAVED_JOBS_KEY);
    const parsed = raw ? (JSON.parse(raw) as string[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeSavedJobs = (jobIds: string[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SAVED_JOBS_KEY, JSON.stringify(jobIds));
  window.dispatchEvent(new CustomEvent(SAVED_JOBS_EVENT, { detail: jobIds }));
};

export const useSavedJobs = () => {
  const [savedJobs, setSavedJobs] = useState<string[]>(() => readSavedJobs());

  useEffect(() => {
    const sync = () => setSavedJobs(readSavedJobs());
    const syncFromStorage = (event: StorageEvent) => {
      if (event.key === SAVED_JOBS_KEY) sync();
    };

    window.addEventListener("storage", syncFromStorage);
    window.addEventListener(SAVED_JOBS_EVENT, sync as EventListener);
    return () => {
      window.removeEventListener("storage", syncFromStorage);
      window.removeEventListener(SAVED_JOBS_EVENT, sync as EventListener);
    };
  }, []);

  const toggleSavedJob = useCallback((jobId: string) => {
    setSavedJobs((current) => {
      const next = current.includes(jobId)
        ? current.filter((id) => id !== jobId)
        : [...current, jobId];
      writeSavedJobs(next);
      return next;
    });
  }, []);

  const isSavedJob = useCallback((jobId: string) => savedJobs.includes(jobId), [savedJobs]);

  return {
    savedJobs,
    savedJobsCount: savedJobs.length,
    toggleSavedJob,
    isSavedJob,
  };
};
