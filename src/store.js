import { create } from "zustand";

const DRAFT_KEY = "eld_trip_draft";

export const useTripStore = create((set) => ({
  result: null,
  activeDay: 0,
  loading: false,
  error: null,
  setResult: (result) => set({ result, activeDay: 0 }),
  setActiveDay: (activeDay) => set({ activeDay }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  reset: () => set({ result: null, activeDay: 0, error: null }),
}));

// Draft helpers (localStorage)
export function saveDraft(data) {
  try {
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ ...data, _savedAt: new Date().toISOString() }),
    );
  } catch {}
}

export function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {}
}
