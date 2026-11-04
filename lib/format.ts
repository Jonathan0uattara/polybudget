export type TxType = "in" | "out";
export interface Category { id: string; name: string; icon: string; h: number; type: TxType }
export interface Tx { id: string; type: TxType; amount: number; cat: string; date: string; note?: string; createdAt?: number }
export interface Profile {
  firstName: string; lastName: string; birthDate: string; city: string;
  status: "etudiant" | "alternant" | "salarie" | "autre" | ""; org: string; currency: "EUR";
}
export const emptyProfile = (): Profile => ({ firstName: "", lastName: "", birthDate: "", city: "", status: "", org: "", currency: "EUR" });
export const STATUS_LABELS: Record<string, string> = { etudiant: "Étudiant·e", alternant: "Alternant·e", salarie: "Salarié·e", autre: "Autre" };
export const ageOf = (iso: string) => {
  if (!iso) return null; const [y, m, d] = iso.split("-").map(Number); const now = new Date();
  let a = now.getFullYear() - y; if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)) a--; return a;
};
export interface Settings {
  profile: Profile;
  name: string; theme: "auto" | "light" | "dark"; categories: Category[];
  budgets: Record<string, number>; monthlyBudget: number; savingsGoal: number; v?: number;
}

export const DEFAULT_CATS: Category[] = [
  { id: "alim", name: "Alimentation", icon: "utensils", h: 38, type: "out" },
  { id: "transport", name: "Transport", icon: "bus", h: 205, type: "out" },
  { id: "logement", name: "Logement", icon: "home", h: 160, type: "out" },
  { id: "loisirs", name: "Sorties & loisirs", icon: "party-popper", h: 320, type: "out" },
  { id: "shopping", name: "Shopping", icon: "shopping-bag", h: 275, type: "out" },
  { id: "sante", name: "Santé", icon: "heart-pulse", h: 350, type: "out" },
  { id: "etudes", name: "Études", icon: "graduation-cap", h: 230, type: "out" },
  { id: "abonnements", name: "Abonnements", icon: "repeat", h: 255, type: "out" },
  { id: "autre", name: "Autres dépenses", icon: "tag", h: 140, type: "out" },
  { id: "salaire", name: "Salaire & alternance", icon: "briefcase", h: 150, type: "in" },
  { id: "aides", name: "Bourse & aides", icon: "piggy-bank", h: 45, type: "in" },
  { id: "cadeaux", name: "Cadeaux", icon: "gift", h: 330, type: "in" },
  { id: "autre_rev", name: "Autres revenus", icon: "sparkles", h: 190, type: "in" },
];
export const HUES = [38, 0, 20, 140, 160, 190, 205, 230, 255, 275, 320, 350];

export const defaultSettings = (): Settings => ({
  profile: emptyProfile(), name: "", theme: "auto", categories: DEFAULT_CATS, budgets: {}, monthlyBudget: 0, savingsGoal: 0, v: 2,
});

const eur = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
const eur0 = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
export const money = (c: number) => eur.format((c || 0) / 100);
export const moneyShort = (c: number) => eur0.format(Math.round((c || 0) / 100));
export const pad = (n: number) => String(n).padStart(2, "0");
export const isoOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayISO = () => isoOf(new Date());
export const ymOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
export const shiftYM = (ym: string, k: number) => { const [y, m] = ym.split("-").map(Number); return ymOf(new Date(y, m - 1 + k, 1)); };
export const ymLabel = (ym: string) => { const [y, m] = ym.split("-").map(Number); return new Date(y, m - 1, 1).toLocaleDateString("fr-FR", { month: "long", year: "numeric" }); };
export const ymMonth = (ym: string) => { const [y, m] = ym.split("-").map(Number); return new Date(y, m - 1, 1).toLocaleDateString("fr-FR", { month: "long" }); };
export const ymShort = (ym: string) => { const [y, m] = ym.split("-").map(Number); return new Date(y, m - 1, 1).toLocaleDateString("fr-FR", { month: "short" }).replace(".", ""); };
export const parseAmount = (s: string) => { const v = parseFloat(String(s).replace(/\s/g, "").replace(",", ".")); return isFinite(v) ? Math.round(v * 100) : NaN; };
export const centsToInput = (c: number) => (c ? (c / 100).toFixed(2).replace(".", ",").replace(/,00$/, "") : "");
export const shortDate = (iso: string) => { const [a, b, c] = iso.split("-").map(Number); return new Date(a, b - 1, c).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }); };
export const dayLabel = (iso: string) => {
  const y = new Date(); y.setDate(y.getDate() - 1);
  if (iso === todayISO()) return "Aujourd’hui";
  if (iso === isoOf(y)) return "Hier";
  const [a, b, c] = iso.split("-").map(Number);
  return new Date(a, b - 1, c).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
};

export const totals = (list: Tx[]) => {
  let inc = 0, out = 0;
  for (const t of list) t.type === "in" ? (inc += t.amount) : (out += t.amount);
  return { inc, out, bal: inc - out };
};
export const byCat = (list: Tx[]) => {
  const m: Record<string, number> = {};
  for (const t of list) if (t.type !== "in") m[t.cat] = (m[t.cat] || 0) + t.amount;
  return m;
};
export const sortTx = (list: Tx[]) =>
  [...list].sort((a, b) => (b.date || "").localeCompare(a.date || "") || (b.createdAt || 0) - (a.createdAt || 0));
export const ratioTone = (v: number, b: number) => (!b ? "ok" : v / b > 1 ? "over" : v / b > 0.8 ? "mid" : "ok");
