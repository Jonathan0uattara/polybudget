"use client";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, User,
  createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail, deleteUser,
} from "firebase/auth";
import {
  doc, collection, onSnapshot, query, orderBy, limit, setDoc, updateDoc, deleteDoc, writeBatch, serverTimestamp, increment,
  DocumentReference, CollectionReference, Firestore,
} from "firebase/firestore";
import { fb } from "./firebase";
import { Category, DEFAULT_CATS, Goal, HUES, Settings, Tx, TxType, defaultSettings, emptyProfile, goalSaved, todayISO, pad } from "./format";

type Status = "loading" | "auth" | "verify" | "ready" | "error" | "forbidden";
interface Toast { id: number; msg: string }

interface Store {
  status: Status; user: User | null; settings: Settings; txs: Tx[];
  toast: Toast | null; success: number; authError: string;
  signIn: () => void; logout: () => void;
  authBusy: boolean; setAuthError: (m: string) => void;
  signInEmail: (email: string, pw: string) => Promise<void>;
  signUpEmail: (email: string, pw: string, code: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  redeemCode: (code: string) => Promise<void>;
  checkVerified: () => Promise<void>; resendVerification: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  saveTx: (data: Omit<Tx, "id">, id?: string) => void; deleteTx: (id: string) => void;
  patchSettings: (patch: Partial<Settings>) => void; setBudget: (key: string, cents: number) => void;
  notify: (msg: string) => void; exportData: (f: "csv" | "json") => void;
  importFile: (file: File) => Promise<void>; wipeAll: () => Promise<void>;
  cats: Category[]; catById: (id: string) => Category;
  goals: Goal[]; goalsBlocked: boolean;
  saveGoal: (data: Omit<Goal, "id" | "deposits" | "createdAt">, id?: string) => void;
  deleteGoal: (id: string) => void; depositGoal: (id: string, cents: number) => void;
}

const Ctx = createContext<Store | null>(null);

/** Messages d’erreur de connexion compréhensibles. */
function authMessage(e: any): string {
  const c = String(e?.code || "");
  if (c === "invite") return "Code d’invitation invalide, ou toutes ses places sont déjà prises.";
  if (["auth/invalid-credential", "auth/wrong-password", "auth/user-not-found", "auth/invalid-login-credentials"].includes(c)) return "E-mail ou mot de passe incorrect.";
  if (c === "auth/email-already-in-use") return "Un compte existe déjà avec cet e-mail. Connecte-toi plutôt.";
  if (c === "auth/weak-password") return "Mot de passe trop court : 8 caractères minimum.";
  if (c === "auth/invalid-email") return "Cette adresse e-mail n’est pas valide.";
  if (c === "auth/too-many-requests") return "Trop de tentatives. Patiente quelques minutes.";
  if (c === "auth/network-request-failed") return "Pas de connexion internet.";
  if (c === "auth/operation-not-allowed") return "La connexion par e-mail n’est pas encore activée dans Firebase.";
  if (c === "auth/unauthorized-domain") return "Domaine non autorisé : ajoute cette adresse dans Firebase > Authentification > Paramètres.";
  return "Connexion impossible, réessaie.";
}
export const normCode = (c: string) => c.trim().toUpperCase().replace(/\s+/g, "");
const isPasswordUser = (u: User) => u.providerData.some((p) => p.providerId === "password");

/** Utilise une place du code d’invitation : crée la fiche membre et décompte la place en une seule opération. */
async function redeem(db: Firestore, uid: string, code: string) {
  const b = writeBatch(db);
  b.set(doc(db, "members", uid), { code, at: serverTimestamp() });
  b.update(doc(db, "invites", code), { remaining: increment(-1) });
  try { await b.commit(); } catch { throw { code: "invite" }; }
}
export const useStore = () => useContext(Ctx)!;

export function applyTheme(t: string) {
  if (typeof document === "undefined") return;
  const el = document.documentElement;
  if (t === "light" || t === "dark") el.dataset.theme = t; else delete el.dataset.theme;
  try { t === "auto" ? localStorage.removeItem("pb-theme") : localStorage.setItem("pb-theme", t); } catch {}
}

/** Style d’interface (test) : "pixel" = matrice de points. Réglage propre à l’appareil, non synchronisé. */
export function applyStyle(v: string) {
  if (typeof document === "undefined") return;
  if (v === "pixel") document.documentElement.dataset.style = "pixel"; else delete document.documentElement.dataset.style;
  try { localStorage.setItem("pb-style", v === "pixel" ? "pixel" : "classic"); } catch {}
}
/** Réapplique le style après le démarrage de l’app (au cas où la page aurait été réinitialisée au chargement). */
export function initStyle() {
  if (typeof document === "undefined") return;
  let v = process.env.NEXT_PUBLIC_STYLE === "pixel" ? "pixel" : "classic";
  try { const x = localStorage.getItem("pb-style"); if (x) v = x; } catch {}
  if (v === "pixel") document.documentElement.dataset.style = "pixel"; else delete document.documentElement.dataset.style;
}
export const currentStyle = () => (typeof document !== "undefined" && document.documentElement.dataset.style === "pixel" ? "pixel" : "classic");

export function applyPalette(p?: string) {
  if (typeof document === "undefined") return;
  const el = document.documentElement;
  if (p && p !== "emeraude") el.dataset.palette = p; else delete el.dataset.palette;
  try { p && p !== "emeraude" ? localStorage.setItem("pb-palette", p) : localStorage.removeItem("pb-palette"); } catch {}
}

function demoGoals(): Goal[] {
  const d = todayISO(); const m = d.slice(0, 8);
  return [
    { id: "g1", name: "Chaise gaming", price: 15000, cat: "achat", link: "https://www.example.com/chaise", rAmount: 5000, rPeriod: "month", deposits: [{ d: m + "02", a: 5000 }], createdAt: 3 },
    { id: "g2", name: "Écran 27 pouces", price: 22900, cat: "tech", rAmount: 1000, rPeriod: "day", deposits: [{ d: m + "01", a: 4000 }, { d: m + "05", a: 3000 }], createdAt: 2 },
    { id: "g3", name: "Stock kits Arduino", price: 80000, cat: "commerce", rAmount: 10000, rPeriod: "month", deposits: [{ d: "2026-09-10", a: 20000 }, { d: "2026-10-10", a: 12000 }], createdAt: 1 },
  ];
}

function demoTxs(): Tx[] {
  const d = new Date(); const iso = (k: number) => { const x = new Date(d); x.setDate(x.getDate() - k); return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`; };
  const rows: [TxType, number, string, number, string][] = [
    ["out", 4250, "alim", 0, "Courses Carrefour"], ["in", 85000, "salaire", 1, "Alternance"], ["out", 3000, "transport", 1, "Pass Sibra"],
    ["out", 32000, "logement", 2, "Loyer CROUS"], ["out", 1299, "abonnements", 3, "Spotify"], ["out", 2400, "loisirs", 4, "Ciné + resto"],
    ["in", 20000, "aides", 5, "CAF"], ["out", 1890, "etudes", 6, "Livre Python"], ["out", 860, "alim", 7, "Boulangerie"],
  ];
  const out: Tx[] = rows.map((r, i) => ({ id: "d" + i, type: r[0], amount: r[1], cat: r[2], date: iso(r[3]), note: r[4], createdAt: i }));
  for (let m = 1; m < 6; m++) { const x = new Date(d.getFullYear(), d.getMonth() - m, 12); out.push({ id: "m" + m, type: "out", amount: 38000 + ((m * 7919) % 30000), cat: "alim", date: `${x.getFullYear()}-${pad(x.getMonth() + 1)}-12`, note: "", createdAt: 0 }); }
  return out;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<Settings>(defaultSettings());
  const [txs, setTxs] = useState<Tx[]>([]);
  const [toast, setToast] = useState<Toast | null>(null);
  const [success, setSuccess] = useState(0);
  const [authError, setAuthError] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [nonce, setNonce] = useState(0);          // relance les abonnements (après un code validé ou un e-mail vérifié)
  const deleting = useRef(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalsBlocked, setGoalsBlocked] = useState(false);
  const refs = useRef<{ db?: Firestore; appRef?: DocumentReference; txCol?: CollectionReference; goalCol?: CollectionReference }>({});
  const toastTimer = useRef<any>();
  const budgetTimers = useRef<Record<string, any>>({});

  const notify = useCallback((msg: string) => {
    clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), msg });
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);
  const fail = useCallback((e: any) => {
    console.error(e);
    const c = String(e?.code || "");
    notify(c.includes("permission") ? "Accès refusé : vérifie les règles Firestore." :
      c.includes("resource-exhausted") ? "Quota gratuit atteint pour aujourd’hui." : "Enregistrement impossible pour le moment.");
  }, [notify]);

  /* ---------- Auth + abonnements temps réel ---------- */
  useEffect(() => {
    // Mode démo (NEXT_PUBLIC_DEMO=1) : fausses données, aucune connexion à Firebase.
    if (process.env.NEXT_PUBLIC_DEMO === "1") {
      setUser({ displayName: "Ouattara Démo", email: "demo@polybudget.app", photoURL: null } as any);
      setTxs(demoTxs()); setGoals(demoGoals()); setSettings({ ...defaultSettings(), profile: { ...emptyProfile(), firstName: "Ouattara", lastName: "Démo", birthDate: "2003-05-14", city: "Annecy", status: "etudiant", org: "Polytech Annecy-Chambéry" }, monthlyBudget: 90000, savingsGoal: 20000, budgets: { alim: 25000, loisirs: 8000 } });
      setStatus("ready"); return;
    }
    const { auth, db } = fb();
    getRedirectResult(auth).catch(() => {});
    let unsubs: (() => void)[] = [];
    const off = onAuthStateChanged(auth, (u) => {
      unsubs.forEach((f) => f()); unsubs = [];
      if (!u) { setUser(null); setTxs([]); setGoals([]); setStatus("auth"); return; }
      setUser(u);
      // Comptes e-mail : accès seulement après vérification de l’adresse.
      if (isPasswordUser(u) && !u.emailVerified) { setStatus("verify"); return; }
      setStatus("loading");
      const appRef = doc(db, "users", u.uid);
      const txCol = collection(db, "users", u.uid, "tx");
      const goalCol = collection(db, "users", u.uid, "goals");
      refs.current = { db, appRef, txCol, goalCol };
      let gotS = false, gotT = false, init = false;
      // Compte non autorisé par les règles Firestore → écran dédié
      const onSnapErr = (e: any) => { console.error(e); setStatus(String(e?.code || "").includes("permission") ? "forbidden" : "error"); };
      const ready = () => { if (gotS && gotT) setStatus("ready"); };
      unsubs.push(onSnapshot(appRef, (s: any) => {
        if (!s.exists()) {
          if (!init && !s.metadata.fromCache && !deleting.current) { init = true; setDoc(appRef, defaultSettings()).catch(fail); }
          setSettings(defaultSettings());
        } else {
          const d: any = s.data();
          setSettings({
            ...defaultSettings(), ...d, budgets: { ...(d.budgets || {}) }, profile: { ...emptyProfile(), ...(d.profile || {}) },
            categories: Array.isArray(d.categories) && d.categories.length ? d.categories : DEFAULT_CATS,
          });
        }
        gotS = true; ready();
      }, onSnapErr));
      unsubs.push(onSnapshot(query(txCol, orderBy("date", "desc"), limit(3000)), (qs) => {
        setTxs(qs.docs.map((d) => ({ id: d.id, ...(d.data() as any) })).filter((t) => typeof t.amount === "number"));
        gotT = true; ready();
      }, onSnapErr));
      // Les objectifs ne bloquent jamais l’app : si les règles Firestore ne les autorisent pas encore, on le signale seulement.
      unsubs.push(onSnapshot(goalCol, (qs) => {
        setGoalsBlocked(false);
        setGoals(qs.docs.map((d) => ({ deposits: [], ...(d.data() as any), id: d.id }))
          .filter((g) => typeof g.price === "number").sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
      }, (e) => { console.error(e); setGoalsBlocked(true); }));
    });
    return () => { off(); unsubs.forEach((f) => f()); };
  }, [fail, nonce]);

  useEffect(() => { applyTheme(settings.theme); }, [settings.theme]);
  useEffect(() => { if (status === "ready") applyPalette(settings.palette); }, [settings.palette, status]);

  /* ---------- Actions ---------- */
  const signIn = useCallback(async () => {
    const { auth } = fb(); setAuthError("");
    const provider = new GoogleAuthProvider();
    try { await signInWithPopup(auth, provider); }
    catch (e: any) {
      if (["auth/popup-blocked", "auth/operation-not-supported-in-this-environment", "auth/cancelled-popup-request"].includes(e.code))
        return signInWithRedirect(auth, provider);
      if (e.code !== "auth/popup-closed-by-user")
        setAuthError(e.code === "auth/unauthorized-domain"
          ? "Domaine non autorisé : ajoute cette adresse dans Firebase > Authentification > Paramètres."
          : "Connexion impossible, réessaie.");
    }
  }, []);
  const logout = useCallback(() => { setAuthError(""); signOut(fb().auth); }, []);

  const signInEmail = useCallback(async (email: string, pw: string) => {
    setAuthError(""); setAuthBusy(true);
    try { await signInWithEmailAndPassword(fb().auth, email.trim(), pw); }
    catch (e) { setAuthError(authMessage(e)); }
    setAuthBusy(false);
  }, []);

  const signUpEmail = useCallback(async (email: string, pw: string, rawCode: string) => {
    const code = normCode(rawCode); setAuthError("");
    if (!code) { setAuthError("Entre ton code d’invitation."); return; }
    if (pw.length < 8) { setAuthError(authMessage({ code: "auth/weak-password" })); return; }
    const { auth, db } = fb(); setAuthBusy(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), pw);
      try { await redeem(db, cred.user.uid, code); }
      catch (e) { await deleteUser(cred.user).catch(() => signOut(auth)); throw e; }   // pas de compte orphelin si le code est refusé
      await sendEmailVerification(cred.user).catch(() => {});
    } catch (e) { setAuthError(authMessage(e)); }
    setAuthBusy(false);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    setAuthError("");
    if (!email.trim()) { setAuthError("Entre d’abord ton adresse e-mail."); return; }
    try { await sendPasswordResetEmail(fb().auth, email.trim()); notify("E-mail de réinitialisation envoyé (pense à regarder les spams)."); }
    catch (e) { setAuthError(authMessage(e)); }
  }, [notify]);

  const redeemCode = useCallback(async (rawCode: string) => {
    const code = normCode(rawCode); const { auth, db } = fb(); const u = auth.currentUser;
    if (!u) return; if (!code) { setAuthError("Entre ton code d’invitation."); return; }
    setAuthError(""); setAuthBusy(true);
    try { await redeem(db, u.uid, code); notify("Bienvenue sur PolyBudget !"); setNonce((n) => n + 1); }
    catch (e) { setAuthError(authMessage(e)); }
    setAuthBusy(false);
  }, [notify]);

  const checkVerified = useCallback(async () => {
    const u = fb().auth.currentUser; if (!u) return;
    setAuthBusy(true); setAuthError("");
    try {
      await u.reload(); await u.getIdToken(true);
      if (u.emailVerified) setNonce((n) => n + 1);
      else setAuthError("Adresse pas encore vérifiée. Clique sur le lien reçu par e-mail, puis réessaie.");
    } catch (e) { setAuthError(authMessage(e)); }
    setAuthBusy(false);
  }, []);

  const resendVerification = useCallback(async () => {
    const u = fb().auth.currentUser; if (!u) return;
    try { await sendEmailVerification(u); notify("E-mail renvoyé (pense à regarder les spams)."); }
    catch (e) { setAuthError(authMessage(e)); }
  }, [notify]);

  // Firestore met les écritures en file d’attente hors ligne : on n’attend pas le serveur.
  const saveTx = useCallback((data: Omit<Tx, "id">, id?: string) => {
    const { txCol } = refs.current;
    if (!txCol) { // mode démo : écriture locale
      setTxs((l) => id ? l.map((t) => (t.id === id ? { ...t, ...data } : t)) : [{ ...data, id: "d" + Date.now(), createdAt: Date.now() } as Tx, ...l]);
      if (!id) setSuccess((n) => n + 1); notify(id ? "Modifications enregistrées" : "Ajouté (démo)"); return;
    }
    const ref = id ? doc(txCol, id) : doc(txCol);
    setDoc(ref, { ...data, createdAt: data.createdAt || Date.now(), ...(id ? { updatedAt: Date.now() } : {}) }).catch(fail);
    if (!id) setSuccess((n) => n + 1);
    notify(id ? "Modifications enregistrées" : data.type === "in" ? "Revenu ajouté, bien joué !" : "Dépense ajoutée");
  }, [fail, notify]);

  const deleteTx = useCallback((id: string) => {
    const { txCol } = refs.current; if (!txCol) return;
    deleteDoc(doc(txCol, id)).catch(fail); notify("Transaction supprimée");
  }, [fail, notify]);

  const persist = useCallback((patch: Record<string, any>) => {
    const { appRef } = refs.current; if (appRef) updateDoc(appRef, patch).catch(fail);
  }, [fail]);

  const patchSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((s) => ({ ...s, ...patch })); persist(patch);
  }, [persist]);

  const setBudget = useCallback((key: string, cents: number) => {
    cents = Math.max(0, Math.round(cents) || 0);
    setSettings((s) =>
      key === "__global" ? { ...s, monthlyBudget: cents } :
      key === "__save" ? { ...s, savingsGoal: cents } :
      { ...s, budgets: { ...s.budgets, [key]: cents } });
    clearTimeout(budgetTimers.current[key]);
    budgetTimers.current[key] = setTimeout(() => {
      persist(key === "__global" ? { monthlyBudget: cents } : key === "__save" ? { savingsGoal: cents } : { [`budgets.${key}`]: cents });
    }, 600);
  }, [persist]);

  /* ---------- Objectifs ---------- */
  const saveGoal = useCallback((data: Omit<Goal, "id" | "deposits" | "createdAt">, id?: string) => {
    const clean: any = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined && v !== ""));
    const { goalCol } = refs.current;
    if (!goalCol) { // mode démo
      setGoals((l) => id ? l.map((g) => (g.id === id ? { ...g, ...data } : g)) : [{ ...data, id: "g" + Date.now(), deposits: [], createdAt: Date.now() } as Goal, ...l]);
    } else if (id) {
      const prev = goals.find((g) => g.id === id);
      setDoc(doc(goalCol, id), { ...clean, deposits: prev?.deposits || [], createdAt: prev?.createdAt || Date.now() }).catch(fail);
    } else setDoc(doc(goalCol), { ...clean, deposits: [], createdAt: Date.now() }).catch(fail);
    notify(id ? "Objectif mis à jour" : "Objectif créé");
  }, [goals, fail, notify]);

  const deleteGoal = useCallback((id: string) => {
    const { goalCol } = refs.current;
    if (!goalCol) setGoals((l) => l.filter((g) => g.id !== id)); else deleteDoc(doc(goalCol, id)).catch(fail);
    notify("Objectif supprimé");
  }, [fail, notify]);

  const depositGoal = useCallback((id: string, cents: number) => {
    const g = goals.find((x) => x.id === id); if (!g || !cents) return;
    const saved = goalSaved(g);
    if (cents < 0) cents = -Math.min(saved, -cents);           // on ne retire pas plus que ce qui a été mis
    if (!cents) return;
    const deposits = [...(g.deposits || []), { d: todayISO(), a: cents }].slice(-300);
    const { goalCol } = refs.current;
    if (!goalCol) setGoals((l) => l.map((x) => (x.id === id ? { ...x, deposits } : x)));
    else updateDoc(doc(goalCol, id), { deposits }).catch(fail);
    const reached = cents > 0 && saved < g.price && saved + cents >= g.price;
    if (cents > 0) setSuccess((n) => n + 1);
    notify(reached ? `Objectif atteint : ${g.name} !` : cents > 0 ? "Versement ajouté" : "Retrait enregistré");
  }, [goals, fail, notify]);

  const cats = settings.categories;
  const catById = useCallback((id: string): Category =>
    cats.find((c) => c.id === id) || { id, name: "Sans catégorie", icon: "tag", h: 140, type: "out" }, [cats]);

  const commitInChunks = async (ops: ((b: ReturnType<typeof writeBatch>) => void)[]) => {
    const { db } = refs.current; if (!db) return;
    for (let i = 0; i < ops.length; i += 400) {
      const b = writeBatch(db); ops.slice(i, i + 400).forEach((op) => op(b)); await b.commit();
    }
  };

  const exportData = useCallback((f: "csv" | "json") => {
    const rows = [...txs].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    let data: string, name: string;
    if (f === "csv") {
      const q = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
      data = "\ufeffdate;type;categorie;montant;note\n" + rows.map((t) =>
        [t.date, t.type === "in" ? "revenu" : "depense", catById(t.cat).name, (t.amount / 100).toFixed(2).replace(".", ","), t.note]
          .map(q).join(";")).join("\n");
      name = `polybudget-${todayISO()}.csv`;
    } else {
      data = JSON.stringify({
        app: "polybudget", version: 2, exportedAt: new Date().toISOString(), categories: cats,
        transactions: rows.map(({ id, ...r }) => ({ ...r, amount: r.amount / 100 })),
      }, null, 2);
      name = `polybudget-${todayISO()}.json`;
    }
    const blob = new Blob([data], { type: f === "csv" ? "text/csv;charset=utf-8" : "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    notify("Sauvegarde exportée");
  }, [txs, cats, catById, notify]);

  const importFile = useCallback(async (file: File) => {
    const { txCol } = refs.current; if (!txCol) return;
    let j: any; try { j = JSON.parse(await file.text()); } catch { notify("Ce fichier n’est pas un JSON valide."); return; }
    const arr: any[] = (Array.isArray(j) ? j :
      ["transactions", "depenses", "expenses", "items", "data", "entries"].map((k) => j?.[k]).find(Array.isArray) ||
      Object.values(j || {}).find((v: any) => Array.isArray(v) && v.length && typeof v[0] === "object") || []) as any[];
    const norm = (s: any) => String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    const pick = (o: any, keys: string[]) => { for (const k of Object.keys(o)) if (keys.includes(k.toLowerCase())) return o[k]; };
    const normDate = (v: any) => {
      if (!v) return null;
      const s = String(v).trim(); let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/); if (m) return `${m[1]}-${m[2]}-${m[3]}`;
      m = s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})/); if (m) return `${m[3]}-${pad(+m[2])}-${pad(+m[1])}`;
      const d = new Date(typeof v === "number" ? v : s); return isNaN(+d) ? null : `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    };
    const newCats = [...cats]; const items: Omit<Tx, "id">[] = [];
    for (const o of arr) {
      if (!o || typeof o !== "object") continue;
      const raw = pick(o, ["amount", "montant", "value", "valeur", "prix", "price", "somme", "total"]);
      const amt = typeof raw === "number" ? raw : parseFloat(String(raw ?? "").replace(/\s/g, "").replace(",", "."));
      if (!isFinite(amt) || amt === 0) continue;
      const tRaw = norm(pick(o, ["type", "kind", "sens", "nature"]));
      const type: TxType = /rev|income|entree|credit|gain|^in$/.test(tRaw) ? "in" : "out";
      const catName = pick(o, ["category", "categorie", "catégorie", "cat"]);
      let cat: string | null = null;
      if (catName) {
        const label = typeof catName === "object" ? catName.name || catName.nom : catName; const n = norm(label);
        const found = newCats.find((c) => norm(c.name) === n || c.id === n);
        if (found) cat = found.id;
        else if (n) {
          const id = "c_" + n.replace(/[^a-z0-9]+/g, "_").slice(0, 30);
          if (!newCats.find((c) => c.id === id)) newCats.push({ id, name: String(label).trim(), icon: "tag", h: HUES[newCats.length % HUES.length], type });
          cat = id;
        }
      }
      items.push({
        type, amount: Math.round(Math.abs(amt) * 100), cat: cat || (type === "in" ? "autre_rev" : "autre"),
        date: normDate(pick(o, ["date", "jour", "day", "createdat", "created_at", "timestamp"])) || todayISO(),
        note: String(pick(o, ["note", "description", "desc", "label", "libelle", "libellé", "name", "nom", "titre", "title"]) || "").trim(),
      });
    }
    if (!items.length) { notify("Aucune transaction reconnue dans ce fichier."); return; }
    const key = (t: any) => `${t.date}|${t.type}|${t.amount}|${(t.note || "").toLowerCase()}`;
    const seen = new Set(txs.map(key));
    const fresh = items.filter((t) => { const k = key(t); if (seen.has(k)) return false; seen.add(k); return true; });
    if (!fresh.length) { notify("Tout est déjà là : aucun doublon ajouté."); return; }
    if (!confirm(`${fresh.length} transaction(s) à importer (${items.length - fresh.length} doublon(s) ignoré(s)). Continuer ?`)) return;
    if (newCats.length !== cats.length) patchSettings({ categories: newCats });
    notify("Import en cours…");
    try {
      await commitInChunks(fresh.map((t) => (b) => b.set(doc(txCol), { ...t, createdAt: Date.now(), imported: true })));
      notify(`${fresh.length} transaction(s) importée(s)`);
    } catch (e) { fail(e); }
  }, [cats, txs, notify, fail, patchSettings]);

  const wipeAll = useCallback(async () => {
    const { txCol } = refs.current; if (!txCol) return;
    if (!confirm("Effacer toutes les transactions ? Pense à exporter une sauvegarde avant.")) return;
    if (!confirm("Dernière confirmation : cette action est définitive.")) return;
    try { await commitInChunks(txs.map((t) => (b) => b.delete(doc(txCol, t.id)))); notify("Toutes les transactions ont été effacées"); }
    catch (e) { fail(e); }
  }, [txs, notify, fail]);

  /** Supprime toutes les données du compte puis le compte lui-même (RGPD). */
  const deleteAccount = useCallback(async () => {
    const { auth, db } = fb(); const u = auth.currentUser; const { txCol, goalCol, appRef } = refs.current;
    if (!u || !txCol || !goalCol || !appRef) return;
    const last = Date.parse(u.metadata.lastSignInTime || "");
    if (!last || Date.now() - last > 4 * 60 * 1000) {
      alert("Par sécurité, reconnecte-toi juste avant de supprimer ton compte. Tu vas être déconnecté : reconnecte-toi puis relance la suppression.");
      signOut(auth); return;
    }
    if (!confirm("Supprimer définitivement ton compte et toutes tes données (transactions, objectifs, profil) ?")) return;
    if (!confirm("Dernière confirmation : cette action est irréversible.")) return;
    deleting.current = true;
    try {
      await commitInChunks([
        ...txs.map((t) => (b: any) => b.delete(doc(txCol, t.id))),
        ...goals.map((g) => (b: any) => b.delete(doc(goalCol, g.id))),
        (b: any) => b.delete(appRef),
        (b: any) => b.delete(doc(db, "members", u.uid)),
      ]);
      await deleteUser(u);
      alert("Ton compte et tes données ont été supprimés.");
    } catch (e) { deleting.current = false; fail(e); }
  }, [txs, goals, fail]);

  const value = useMemo<Store>(() => ({
    status, user, settings, txs, toast, success, authError, signIn, logout, saveTx, deleteTx,
    patchSettings, setBudget, notify, exportData, importFile, wipeAll, cats, catById,
    goals, goalsBlocked, saveGoal, deleteGoal, depositGoal,
    authBusy, setAuthError, signInEmail, signUpEmail, resetPassword, redeemCode, checkVerified, resendVerification, deleteAccount,
  }), [authBusy, signInEmail, signUpEmail, resetPassword, redeemCode, checkVerified, resendVerification, deleteAccount, goals, goalsBlocked, saveGoal, deleteGoal, depositGoal, status, user, settings, txs, toast, success, authError, signIn, logout, saveTx, deleteTx,
    patchSettings, setBudget, notify, exportData, importFile, wipeAll, cats, catById]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
