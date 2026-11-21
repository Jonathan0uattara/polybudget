"use client";
import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { AnimatePresence, motion } from "framer-motion";
import { House, List, Plus, Settings2, Target } from "lucide-react";
import { GlobalStyle } from "@/styles/GlobalStyle";
import { StoreProvider, initStyle, useStore } from "@/lib/store";
import { Tx, ymOf } from "@/lib/format";
import Home from "./screens/Home";
import { Budgets, History, SettingsScreen } from "./screens/Others";
import { InviteGate, Login, VerifyEmail } from "./screens/Access";
import { ProfileScreen, ReportScreen } from "./screens/ProfileReport";
import TxSheet, { SheetState } from "./TxSheet";
import { Success, Toast, handleBack } from "./overlays";
import { DRAFT_TX, NAV_KEY, loadDraft, saveDraft } from "@/lib/persist";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

export default function App() {
  useEffect(() => { initStyle(); }, []);
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production")
      navigator.serviceWorker.register(`${BASE}/sw.js`, { scope: `${BASE}/` }).catch(() => {});
  }, []);
  return (
    <StoreProvider>
      <GlobalStyle />
      <Shell />
    </StoreProvider>
  );
}

/* ---------- Navigation ---------- */
const TABS = [
  { id: "home", label: "Accueil", icon: House },
  { id: "history", label: "Historique", icon: List },
  { id: "budgets", label: "Budgets", icon: Target },
  { id: "settings", label: "Réglages", icon: Settings2 },
];

const Layout = styled.div`
  min-height:100dvh;
  @media (min-width:900px){ padding-left:248px; }
`;
const BottomBar = styled.nav`
  position:fixed; left:0; right:0; bottom:0; z-index:40;
  background:var(--pb-glass); backdrop-filter:blur(20px) saturate(1.6); -webkit-backdrop-filter:blur(20px) saturate(1.6);
  border-top:1px solid var(--pb-line);
  padding:6px 8px calc(6px + env(safe-area-inset-bottom,0px));
  display:grid; grid-template-columns:1fr 1fr auto 1fr 1fr; align-items:center; gap:4px;
  @media (min-width:900px){ display:none; }
`;
const Tab = styled.button<{ $on: boolean }>`
  position:relative; display:flex; flex-direction:column; align-items:center; gap:3px; padding:6px 0;
  font-size:11px; font-weight:500; color:${(p) => (p.$on ? "var(--pb-ink)" : "var(--pb-muted)")}; transition:color .2s;
  .dot{ position:absolute; top:-6px; width:20px; height:3px; border-radius:3px; background:var(--pb-accent); }
`;
const Fab = styled(motion.button)`
  width:52px; height:52px; border-radius:50%; background:var(--pb-ink); color:var(--pb-bg);
  display:grid; place-items:center; margin:0 6px;
`;
const Side = styled.aside`
  display:none;
  @media (min-width:900px){
    display:flex; flex-direction:column; gap:4px; position:fixed; top:0; bottom:0; left:0; width:248px; z-index:40;
    padding:28px 16px; border-right:1px solid var(--pb-line); background:var(--pb-bg);
  }
  .brand{ display:flex; align-items:center; gap:10px; font-family:var(--pb-font-display); font-weight:600; font-size:20px; margin:0 10px 28px; }
  .logo{ width:34px; height:34px; border-radius:11px; background:var(--pb-ink); display:flex; align-items:flex-end; justify-content:center; gap:3px; padding:8px; }
  .logo i{ width:5px; border-radius:2px; background:var(--pb-accent); display:block; }
  .logo i:last-child{ background:var(--pb-gold); }
  .add{ margin-top:auto; }
`;
const SideItem = styled.button<{ $on: boolean }>`
  position:relative; display:flex; align-items:center; gap:12px; height:46px; padding:0 14px; border-radius:var(--pb-pill);
  font-weight:500; font-size:15px; color:${(p) => (p.$on ? "var(--pb-ink)" : "var(--pb-muted)")};
  span,svg{ position:relative; z-index:1; }
  .bg{ position:absolute; inset:0; border-radius:var(--pb-pill); background:var(--pb-surface); }
`;
const AddPill = styled(motion.button)`
  display:flex; align-items:center; justify-content:center; gap:8px; height:50px; border-radius:var(--pb-pill);
  background:var(--pb-ink); color:var(--pb-bg); font-weight:600; font-size:15px; white-space:nowrap; padding:0 16px;
`;
const Splash = styled.div`
  min-height:100dvh; display:grid; place-items:center; background:var(--pb-bg);
  .logo{ width:56px; height:56px; border-radius:18px; background:var(--pb-ink); display:flex; align-items:flex-end; justify-content:center; gap:4px; padding:13px; }
  .logo i{ width:7px; border-radius:2px; background:var(--pb-accent); display:block; }
  .logo i:last-child{ background:var(--pb-gold); }
`;

function Shell() {
  const { status, toast, success, txs, notify } = useStore();
  const [tab, setTab] = useState("home");
  const navTab = tab === "profile" ? "settings" : tab === "report" ? "home" : tab === "goals" ? "budgets" : tab;
  const [month, setMonth] = useState(ymOf(new Date()));
  const [sheet, setSheet] = useState<SheetState>(null);

  const tabRef = useRef(tab); tabRef.current = tab;
  const go = (t: string) => {
    if (t !== tabRef.current) history.pushState({ pbTab: t }, "");   // le geste retour revient à l’écran précédent
    setTab(t); window.scrollTo({ top: 0 });
  };

  /* Au démarrage : reprendre là où on en était, préparer le geste retour, rouvrir une saisie interrompue. */
  const armed = useRef(false);
  useEffect(() => {
    if (status !== "ready" || armed.current) return;
    armed.current = true;
    const nav = loadDraft<{ tab: string; month: string }>(NAV_KEY, 30 * 60 * 1000);
    const start = nav?.tab && nav.tab !== "profile" ? nav.tab : "home";
    if (nav?.month) setMonth(nav.month);
    setTab(start);
    history.replaceState({ pbTab: "home", root: true }, "");
    history.pushState({ pbTab: start }, "");
    const d = loadDraft(DRAFT_TX);
    if (d) { setSheet({ tx: d.txId ? txs.find((x) => x.id === d.txId) : undefined, type: d.type, draft: d }); notify("Saisie en cours restaurée"); }

    let rearm: any;
    const onPop = (e: PopStateEvent) => {
      if (handleBack()) return;                         // une feuille ouverte a été fermée
      const st = e.state || {};
      setTab(st.pbTab || "home"); window.scrollTo({ top: 0 });
      if (st.root) {                                    // dernier écran : un second retour quitte l’app
        notify("Fais encore retour pour quitter PolyBudget");
        clearTimeout(rearm);
        rearm = setTimeout(() => { if (history.state?.root) history.pushState({ pbTab: "home" }, ""); }, 2500);
      }
    };
    window.addEventListener("popstate", onPop);
    return () => { window.removeEventListener("popstate", onPop); clearTimeout(rearm); };
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (status === "ready") saveDraft(NAV_KEY, { tab, month }); }, [tab, month, status]);
  const openTx = (type?: "in" | "out") => setSheet({ type: type || "out" });
  const onEdit = (tx: Tx) => setSheet({ tx });

  if (status === "loading") return (
    <Splash>
      <motion.div className="logo" animate={{ scale: [1, 1.06, 1] }} transition={{ repeat: Infinity, duration: 1.2 }}>
        {[10, 16, 26].map((h, i) => <i key={i} style={{ height: h }} />)}
      </motion.div>
    </Splash>
  );
  if (status === "auth") return <><Login /><Toast toast={toast} /></>;
  if (status === "verify") return <><VerifyEmail /><Toast toast={toast} /></>;
  if (status === "forbidden") return <><InviteGate /><Toast toast={toast} /></>;
  if (status === "error") return (
    <Splash><div style={{ textAlign: "center", padding: 24, maxWidth: 360 }}>
      <b>Connexion à la base impossible.</b>
      <p style={{ color: "var(--pb-muted)" }}>Vérifie ta connexion internet et les règles Firestore, puis recharge la page.</p>
    </div></Splash>
  );

  const screen =
    tab === "history" ? <History onEdit={onEdit} /> :
    tab === "budgets" || tab === "goals" ? <Budgets view={tab === "goals" ? "goals" : "month"} go={go} /> :
    tab === "settings" ? <SettingsScreen go={go} /> :
    tab === "profile" ? <ProfileScreen onBack={() => go("settings")} /> :
    tab === "report" ? <ReportScreen onBack={() => go("home")} /> :
    <Home month={month} setMonth={setMonth} openTx={openTx} onEdit={onEdit} go={go} />;

  return (
    <Layout>
      <Side aria-label="Navigation" className="no-print">
        <div className="brand"><div className="logo">{[7, 11, 18].map((h, i) => <i key={i} style={{ height: h }} />)}</div>PolyBudget</div>
        {TABS.map(({ id, label, icon: I }) => (
          <SideItem key={id} $on={navTab === id} onClick={() => go(id)} aria-current={navTab === id ? "page" : undefined}>
            {navTab === id && <motion.div className="bg" layoutId="side-active" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
            <I size={20} /><span>{label}</span>
          </SideItem>
        ))}
        <AddPill className="add" whileTap={{ scale: 0.96 }} onClick={() => openTx("out")}><Plus size={20} />Ajouter</AddPill>
      </Side>

      <AnimatePresence mode="wait" initial={false}>
        <motion.main key={navTab === "budgets" ? "budgets" : tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}>
          {screen}
        </motion.main>
      </AnimatePresence>

      <BottomBar aria-label="Navigation" className="no-print">
        {TABS.slice(0, 2).map(({ id, label, icon: I }) => (
          <Tab key={id} $on={navTab === id} onClick={() => go(id)}>
            {navTab === id && <motion.span className="dot" layoutId="tab-dot" />}<I size={22} />{label}
          </Tab>
        ))}
        <Fab whileTap={{ scale: 0.9 }} onClick={() => openTx("out")} aria-label="Ajouter une transaction"><Plus size={26} /></Fab>
        {TABS.slice(2).map(({ id, label, icon: I }) => (
          <Tab key={id} $on={navTab === id} onClick={() => go(id)}>
            {navTab === id && <motion.span className="dot" layoutId="tab-dot" />}<I size={22} />{label}
          </Tab>
        ))}
      </BottomBar>

      <TxSheet state={sheet} onClose={() => setSheet(null)} />
      <Toast toast={toast} />
      <Success tick={success} />
    </Layout>
  );
}
