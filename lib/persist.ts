/**
 * Brouillons et position dans l’app, gardés sur l’appareil.
 * Si le téléphone ferme l’app en arrière-plan, on retrouve la saisie en cours au retour.
 */
const MAX_AGE = 2 * 60 * 60 * 1000;   // 2 h

export function saveDraft(key: string, data: any) {
  try { localStorage.setItem(key, JSON.stringify({ t: Date.now(), data })); } catch {}
}
export function loadDraft<T = any>(key: string, maxAge = MAX_AGE): T | null {
  try {
    const raw = localStorage.getItem(key); if (!raw) return null;
    const { t, data } = JSON.parse(raw);
    if (!t || Date.now() - t > maxAge) { localStorage.removeItem(key); return null; }
    return data as T;
  } catch { return null; }
}
export function clearDraft(key: string) {
  try { localStorage.removeItem(key); } catch {}
}
export const DRAFT_TX = "pb-draft-tx";
export const DRAFT_GOAL = "pb-draft-goal";
export const NAV_KEY = "pb-nav";
