"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { motion } from "framer-motion";
import { ChevronRight, FileText, LogOut, Minus, Plus, Search, Trash2, Upload } from "lucide-react";
import { applyStyle, currentStyle, useStore } from "@/lib/store";
import { Category, HUES, PALETTES, Tx, TxType, centsToInput, dayLabel, money, parseAmount, ratioTone, sortTx, totals, ymLabel, ymOf } from "@/lib/format";
import {
  AnimatedAmount, Card, CatIcon, Empty, FieldLabel, ICON_CHOICES, ICONS, Input, PillButton, Progress, Row, Screen,
  SectionHead, Segmented, Title,
} from "../ui";
import { TxRow } from "./Home";
import { GoalsView } from "./Goals";

const listVariants = { show: { transition: { staggerChildren: 0.03 } } };

/* ====================== HISTORIQUE ====================== */
const SearchBox = styled.label`
  position:relative; display:block;
  svg{ position:absolute; left:16px; top:50%; transform:translateY(-50%); color:var(--pb-muted); }
  input{ padding-left:44px; }
`;
const ChipRow = styled.div`
  display:flex; gap:8px; overflow-x:auto; margin:12px -16px 0; padding:0 16px 4px; scrollbar-width:none;
  &::-webkit-scrollbar{ display:none; }
`;
const FChip = styled.button<{ $on: boolean }>`
  flex:none; height:36px; padding:0 14px; border-radius:var(--pb-pill); font-size:14px; font-weight:500;
  background:${(p) => (p.$on ? "var(--pb-ink)" : "var(--pb-surface)")}; color:${(p) => (p.$on ? "var(--pb-bg)" : "var(--pb-ink)")};
`;
const Day = styled.div`
  font-size:14px; font-weight:600; color:var(--pb-muted); margin:22px 6px 8px; text-transform:capitalize;
  display:flex; justify-content:space-between; span{ font-weight:500; }
`;
const Summary = styled.div`
  display:flex; gap:18px; flex-wrap:wrap; margin:16px 6px 0; font-size:14px; color:var(--pb-muted);
  b{ color:var(--pb-ink); font-weight:600; font-variant-numeric:tabular-nums; }
`;

export function History({ onEdit }: { onEdit: (t: Tx) => void }) {
  const { txs, catById, cats } = useStore();
  const [q, setQ] = useState(""); const [type, setType] = useState<"all" | TxType>("all");
  const [month, setMonth] = useState("all"); const [cat, setCat] = useState("all");
  const months = useMemo(() => [...new Set(txs.map((t) => (t.date || "").slice(0, 7)))].filter(Boolean).sort().reverse(), [txs]);
  const filtered = useMemo(() => sortTx(txs.filter((t) =>
    (type === "all" || t.type === type) && (month === "all" || (t.date || "").startsWith(month)) && (cat === "all" || t.cat === cat) &&
    (!q || (t.note || "").toLowerCase().includes(q.toLowerCase()) || catById(t.cat).name.toLowerCase().includes(q.toLowerCase())))), [txs, type, month, cat, q, catById]);
  const groups = useMemo(() => {
    const g: { day: string; items: Tx[] }[] = [];
    for (const t of filtered) { const last = g[g.length - 1]; last && last.day === t.date ? last.items.push(t) : g.push({ day: t.date, items: [t] }); }
    return g;
  }, [filtered]);
  const sum = totals(filtered);
  const usedCats = cats.filter((c) => txs.some((t) => t.cat === c.id));

  return (
    <Screen>
      <Title>Historique</Title>
      <SearchBox><Search size={18} /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher" aria-label="Rechercher" type="search" /></SearchBox>
      <div style={{ marginTop: 12 }}>
        <Segmented id="htype" value={type} onChange={setType} options={[["all", "Tout"], ["out", "Dépenses"], ["in", "Revenus"]]} />
      </div>
      <ChipRow>
        <FChip $on={month === "all"} onClick={() => setMonth("all")}>Tous les mois</FChip>
        {months.map((m) => <FChip key={m} $on={month === m} onClick={() => setMonth(m)}>{ymLabel(m).replace(/^./, (c) => c.toUpperCase())}</FChip>)}
      </ChipRow>
      {usedCats.length > 1 && (
        <ChipRow>
          <FChip $on={cat === "all"} onClick={() => setCat("all")}>Toutes catégories</FChip>
          {usedCats.map((c) => <FChip key={c.id} $on={cat === c.id} onClick={() => setCat(c.id)}>{c.name}</FChip>)}
        </ChipRow>
      )}
      <Summary><span>Revenus <b>{money(sum.inc)}</b></span><span>Dépenses <b>{money(sum.out)}</b></span><span>Solde <b>{money(sum.bal)}</b></span></Summary>

      {groups.length ? groups.map((g) => {
        const dayOut = g.items.filter((t) => t.type !== "in").reduce((a, t) => a + t.amount, 0);
        return (
          <div key={g.day}>
            <Day>{dayLabel(g.day)}<span>{dayOut ? `−${money(dayOut)}` : ""}</span></Day>
            <Card>
              <motion.div variants={listVariants} initial="hidden" animate="show">
                {g.items.map((t) => <TxRow key={t.id} t={t} onClick={() => onEdit(t)} />)}
              </motion.div>
            </Card>
          </div>
        );
      }) : (
        <Card style={{ marginTop: 20 }}><Empty>
          <b>{txs.length ? "Aucun résultat" : "Ton historique est vide"}</b>
          {txs.length ? "Essaie d’élargir les filtres." : "Ajoute une transaction ou importe un fichier dans Réglages."}
        </Empty></Card>
      )}
    </Screen>
  );
}

/* ====================== BUDGETS ====================== */
const BigCard = styled(Card)`
  padding:22px 20px; text-align:center;
  .lbl{ color:var(--pb-muted); font-weight:500; font-size:14px; }
  .hint{ color:var(--pb-muted); font-size:14px; margin-top:10px; }
`;
const StepRow = styled.div`
  display:flex; align-items:center; justify-content:center; gap:14px; margin-top:12px;
  input{ width:170px; text-align:center; border:0; background:transparent; font-family:var(--pb-font-display);
         font-weight:500; font-size:42px; letter-spacing:-.03em; color:var(--pb-ink); font-variant-numeric:tabular-nums; }
  input:focus{ box-shadow:inset 0 -2px 0 var(--pb-accent); }
`;
const Step = styled(motion.button).attrs({ whileTap: { scale: 0.88 } })<{ $sm?: boolean }>`
  width:${(p) => (p.$sm ? 34 : 46)}px; height:${(p) => (p.$sm ? 34 : 46)}px; border-radius:50%; flex:none;
  background:var(--pb-surface-2); display:grid; place-items:center; color:var(--pb-ink);
`;
const Pair = styled.div`
  display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:10px;
  > div{ background:var(--pb-surface); border-radius:var(--pb-r-md); padding:16px; }
  .l{ color:var(--pb-muted); font-size:13px; font-weight:500; }
  .v{ font-family:var(--pb-font-display); font-weight:500; font-size:22px; margin-top:4px; letter-spacing:-.02em; }
  .v.ok{ color:var(--pb-income); } .v.over{ color:var(--pb-danger); }
`;
const BRow = styled.div`
  padding:14px 12px;
  & + &{ border-top:1px solid var(--pb-line); }
  .top{ display:flex; align-items:center; gap:10px; }
  .main{ flex:1; min-width:0; }
  .t,.s{ white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .t{ font-weight:500; } .s{ font-size:13px; color:var(--pb-muted); }
  .mini{ display:flex; align-items:center; gap:6px; }
  .rest{ display:flex; justify-content:space-between; font-size:13px; color:var(--pb-muted); margin-top:7px; font-variant-numeric:tabular-nums; }
  .rest b{ color:var(--pb-ink); font-weight:600; } .rest .over, .rest .over b{ color:var(--pb-danger); }
  .mini{ flex:none; }
  .mini input{ width:64px; height:34px; text-align:center; border:0; border-radius:var(--pb-pill); background:var(--pb-bg);
               font-weight:600; font-variant-numeric:tabular-nums; color:var(--pb-ink); }
  .mini input:focus{ box-shadow:inset 0 0 0 2px var(--pb-accent); }
`;

function BudgetInput({ value, onCommit, className }: { value: number; onCommit: (c: number) => void; className?: string }) {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <input className={className} inputMode="decimal" aria-label="Montant en euros"
      value={draft ?? (centsToInput(value) || "0")}
      onFocus={(e) => { setDraft(centsToInput(value)); setTimeout(() => e.target.select(), 0); }}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => { if (draft !== null) { const c = parseAmount(draft || "0"); if (isFinite(c)) onCommit(c); } setDraft(null); }}
      onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()} />
  );
}

export function Budgets({ view, go }: { view: "month" | "goals"; go: (t: string) => void }) {
  const { settings, txs, cats, setBudget } = useStore();
  const ym = ymOf(new Date());
  const list = txs.filter((t) => (t.date || "").startsWith(ym));
  const t = totals(list);
  const spent: Record<string, number> = {};
  list.forEach((x) => { if (x.type !== "in") spent[x.cat] = (spent[x.cat] || 0) + x.amount; });
  const remain = settings.monthlyBudget - t.out;

  const head = (
    <>
      <Title>Budgets</Title>
      <Segmented id="bview" value={view} onChange={(v) => go(v === "goals" ? "goals" : "budgets")} options={[["month", "Mensuel"], ["goals", "Objectifs"]]} />
    </>
  );
  if (view === "goals") return <Screen>{head}<GoalsView /></Screen>;

  return (
    <Screen>
      {head}
      <BigCard style={{ marginTop: 14 }}>
        <div className="lbl">Budget mensuel · {ymLabel(ym)}</div>
        <StepRow>
          <Step onClick={() => setBudget("__global", settings.monthlyBudget - 5000)} aria-label="Moins 50 €"><Minus size={20} /></Step>
          <BudgetInput value={settings.monthlyBudget} onCommit={(c) => setBudget("__global", c)} />
          <Step onClick={() => setBudget("__global", settings.monthlyBudget + 5000)} aria-label="Plus 50 €"><Plus size={20} /></Step>
        </StepRow>
        {settings.monthlyBudget > 0 && <div style={{ marginTop: 16 }}><Progress pct={(t.out / settings.monthlyBudget) * 100} tone={ratioTone(t.out, settings.monthlyBudget)} /></div>}
        <div className="hint">Les boutons ajoutent ou retirent 50 €</div>
      </BigCard>
      <Pair>
        <div><div className="l">Reste à dépenser</div><div className={`v ${settings.monthlyBudget ? (remain >= 0 ? "ok" : "over") : ""}`}>{settings.monthlyBudget ? money(remain) : "—"}</div></div>
        <div><div className="l">Déjà dépensé</div><div className="v">{money(t.out)}</div></div>
      </Pair>

      <BigCard style={{ marginTop: 10 }}>
        <div className="lbl">Objectif d’épargne mensuel</div>
        <StepRow>
          <Step onClick={() => setBudget("__save", settings.savingsGoal - 5000)} aria-label="Moins 50 €"><Minus size={20} /></Step>
          <BudgetInput value={settings.savingsGoal} onCommit={(c) => setBudget("__save", c)} />
          <Step onClick={() => setBudget("__save", settings.savingsGoal + 5000)} aria-label="Plus 50 €"><Plus size={20} /></Step>
        </StepRow>
        {settings.savingsGoal > 0 && <div style={{ marginTop: 16 }}><Progress pct={(Math.max(0, t.bal) / settings.savingsGoal) * 100} tone="gold" /></div>}
        <div className="hint">Mis de côté ce mois-ci : {money(Math.max(0, t.bal))}</div>
      </BigCard>

      <SectionHead><h2>Par catégorie</h2></SectionHead>
      <Card $pad={4}>
        {cats.filter((c) => c.type !== "in").map((c) => {
          const b = settings.budgets?.[c.id] || 0; const v = spent[c.id] || 0;
          return (
            <BRow key={c.id}>
              <div className="top">
                <CatIcon cat={c} size={40} />
                <div className="main"><div className="t">{c.name}</div><div className="s">{money(v)}{b ? ` sur ${money(b)}` : " dépensés"}</div></div>
                <div className="mini">
                  <Step $sm onClick={() => setBudget(c.id, b - 1000)} aria-label="Moins 10 €"><Minus size={15} /></Step>
                  <BudgetInput value={b} onCommit={(x) => setBudget(c.id, x)} />
                  <Step $sm onClick={() => setBudget(c.id, b + 1000)} aria-label="Plus 10 €"><Plus size={15} /></Step>
                </div>
              </div>
              {b > 0 && (
                <>
                  <div style={{ marginTop: 10 }}><Progress pct={(v / b) * 100} tone={ratioTone(v, b)} /></div>
                  <div className="rest">
                    {v <= b ? <span>Reste <b>{money(b - v)}</b></span> : <span className="over">Dépassé de <b>{money(v - b)}</b></span>}
                    <span>{Math.round((v / b) * 100)} %</span>
                  </div>
                </>
              )}
            </BRow>
          );
        })}
      </Card>
    </Screen>
  );
}

/* ====================== RÉGLAGES ====================== */
const SetRow = styled.div`
  display:flex; align-items:center; justify-content:space-between; gap:12px; padding:14px 14px;
  & + &{ border-top:1px solid var(--pb-line); }
  .t{ font-weight:500; } .d{ font-size:13px; color:var(--pb-muted); margin-top:1px; }
  .btns{ display:flex; gap:8px; flex:none; }
`;
const Profile = styled(Card)`
  display:flex; align-items:center; gap:14px; padding:16px;
  img,.ph{ width:56px; height:56px; border-radius:50%; object-fit:cover; flex:none; }
  .ph{ background:var(--pb-ink); color:var(--pb-bg); display:grid; place-items:center; font-weight:600; font-size:22px; }
  .n{ font-family:var(--pb-font-display); font-weight:600; font-size:18px; }
  .e{ font-size:14px; color:var(--pb-muted); overflow:hidden; text-overflow:ellipsis; }
`;
const IconGrid = styled.div`
  display:grid; grid-template-columns:repeat(auto-fill,minmax(44px,1fr)); gap:6px;
  button{ height:44px; border-radius:14px; display:grid; place-items:center; background:var(--pb-bg); }
  button.on{ background:var(--pb-ink); color:var(--pb-bg); }
`;
const Hues = styled.div`
  display:flex; gap:8px; flex-wrap:wrap;
  button{ width:32px; height:32px; border-radius:50%; }
  button.on{ box-shadow:0 0 0 2px var(--pb-bg), 0 0 0 4px var(--pb-ink); }
`;

const Swatches = styled.div`
  display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px;
  button{ display:flex; flex-direction:column; align-items:center; gap:8px; padding:12px 4px 10px; border-radius:16px;
    font-size:13px; font-weight:500; color:var(--pb-muted); background:var(--pb-bg); }
  button.on{ color:var(--pb-ink); box-shadow:inset 0 0 0 2px var(--pb-accent); }
  i{ width:40px; height:40px; border-radius:50%; display:block; }
`;

export function SettingsScreen({ go }: { go: (t: string) => void }) {
  const [uiStyle, setUiStyle] = useState("classic");
  useEffect(() => { setUiStyle(currentStyle()); }, []);
  const { user, settings, cats, patchSettings, logout, exportData, importFile, wipeAll, notify, txs } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [nc, setNc] = useState<{ name: string; type: TxType; icon: string; h: number }>({ name: "", type: "out", icon: "tag", h: 38 });
  const display = [settings.profile?.firstName, settings.profile?.lastName].filter(Boolean).join(" ") || settings.name || user?.displayName || "";

  const addCat = () => {
    const name = nc.name.trim(); if (!name) { notify("Donne un nom à la catégorie."); return; }
    const c: Category = { id: "c_" + Date.now().toString(36), name, icon: nc.icon, h: nc.h, type: nc.type };
    patchSettings({ categories: [...cats, c] }); setNc({ ...nc, name: "" }); notify("Catégorie ajoutée");
  };
  const delCat = (c: Category) => {
    const used = txs.filter((t) => t.cat === c.id).length;
    if (!confirm(used ? `« ${c.name} » est utilisée par ${used} transaction(s), qui passeront en « Sans catégorie ». Supprimer ?` : `Supprimer « ${c.name} » ?`)) return;
    patchSettings({ categories: cats.filter((x) => x.id !== c.id) });
  };

  return (
    <Screen>
      <Title>Réglages</Title>
      <Profile as={motion.button} whileTap={{ scale: 0.98 }} onClick={() => go("profile")} style={{ width: "100%", textAlign: "left" }}>
        {user?.photoURL ? <img src={user.photoURL} alt="" referrerPolicy="no-referrer" /> : <div className="ph">{(display[0] || "P").toUpperCase()}</div>}
        <div style={{ flex: 1, minWidth: 0 }}><div className="n">{display || "Mon compte"}</div><div className="e">Modifier mon profil</div></div>
        <ChevronRight size={20} color="var(--pb-muted)" />
      </Profile>

      <SectionHead><h2>Apparence</h2></SectionHead>
      <Card $pad={14}>
        <FieldLabel>Couleur</FieldLabel>
        <Swatches>
          {PALETTES.map((p) => (
            <button key={p.id} className={(settings.palette || "emeraude") === p.id ? "on" : ""} onClick={() => patchSettings({ palette: p.id })} aria-pressed={(settings.palette || "emeraude") === p.id}>
              <i style={{ background: `linear-gradient(135deg, hsl(${p.h} ${p.s * 0.62}% 87%) 0 50%, hsl(${p.h} ${p.s}% ${p.l}%) 50% 100%)` }} />
              {p.name}
            </button>
          ))}
        </Swatches>
        <FieldLabel style={{ marginTop: 16 }}>Style (test)</FieldLabel>
        <Segmented id="uistyle" value={uiStyle} onChange={(v) => { applyStyle(v); setUiStyle(v); }}
          options={[["classic", "Classique"], ["pixel", "Pixel"]]} />
        <FieldLabel style={{ marginTop: 16 }}>Mode</FieldLabel>
        <Segmented id="theme" value={settings.theme || "auto"} onChange={(v) => patchSettings({ theme: v })}
          options={[["auto", "Automatique"], ["light", "Clair"], ["dark", "Sombre"]]} />
      </Card>

      <SectionHead><h2>Données</h2></SectionHead>
      <Card $pad={0}>
        <SetRow><div><div className="t">Rapport mensuel</div><div className="d">Bilan du mois avec ton profil, téléchargeable en PDF</div></div>
          <PillButton $variant="primary" onClick={() => go("report")}><FileText size={17} />Ouvrir</PillButton></SetRow>
        <SetRow><div><div className="t">Exporter une sauvegarde</div><div className="d">Copie de secours de toutes tes transactions</div></div>
          <div className="btns"><PillButton $variant="soft" onClick={() => exportData("csv")}>CSV</PillButton><PillButton $variant="soft" onClick={() => exportData("json")}>JSON</PillButton></div></SetRow>
        <SetRow><div><div className="t">Importer</div><div className="d">Fichier JSON (ancienne version ou sauvegarde). Doublons ignorés.</div></div>
          <PillButton $variant="primary" onClick={() => fileRef.current?.click()}><Upload size={17} />Importer</PillButton>
          <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) importFile(f); e.target.value = ""; }} /></SetRow>
        <SetRow><div><div className="t">Tout effacer</div><div className="d">Supprime toutes les transactions</div></div>
          <PillButton $variant="danger" onClick={wipeAll}>Effacer</PillButton></SetRow>
      </Card>

      <SectionHead><h2>Catégories</h2></SectionHead>
      <Card>
        {cats.map((c) => (
          <Row as="div" key={c.id}>
            <CatIcon cat={c} size={40} />
            <div className="main"><div className="t">{c.name}</div><div className="s">{c.type === "in" ? "Revenu" : "Dépense"}</div></div>
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => delCat(c)} aria-label={`Supprimer ${c.name}`}
              style={{ width: 38, height: 38, borderRadius: "50%", display: "grid", placeItems: "center", color: "var(--pb-muted)" }}>
              <Trash2 size={18} />
            </motion.button>
          </Row>
        ))}
      </Card>

      <SectionHead><h2>Nouvelle catégorie</h2></SectionHead>
      <Card $pad={16} style={{ display: "grid", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <CatIcon cat={{ icon: nc.icon, h: nc.h }} size={48} />
          <Input value={nc.name} onChange={(e) => setNc({ ...nc, name: e.target.value })} placeholder="Ex. Club Polybot" aria-label="Nom" />
        </div>
        <Segmented id="nctype" value={nc.type} onChange={(v) => setNc({ ...nc, type: v })} options={[["out", "Dépense"], ["in", "Revenu"]]} />
        <div><FieldLabel>Icône</FieldLabel>
          <IconGrid>{ICON_CHOICES.map((k) => { const I = ICONS[k]; return <button key={k} className={nc.icon === k ? "on" : ""} onClick={() => setNc({ ...nc, icon: k })} aria-label={k}><I size={19} /></button>; })}</IconGrid>
        </div>
        <div><FieldLabel>Couleur</FieldLabel>
          <Hues>{HUES.map((h) => <button key={h} className={nc.h === h ? "on" : ""} onClick={() => setNc({ ...nc, h })} style={{ background: `hsl(${h} 70% 55%)` }} aria-label={`Teinte ${h}`} />)}</Hues>
        </div>
        <PillButton $variant="primary" $block onClick={addCat}><Plus size={18} />Ajouter la catégorie</PillButton>
      </Card>
      <div style={{ marginTop: 28 }}>
        <PillButton $variant="soft" $block onClick={() => confirm("Te déconnecter de cet appareil ?") && logout()}><LogOut size={18} />Se déconnecter</PillButton>
      </div>
      <p style={{ textAlign: "center", color: "var(--pb-muted)", fontSize: 13, marginTop: 16 }}>PolyBudget v2 · {user?.email}</p>
    </Screen>
  );
}

/* ====================== CONNEXION ====================== */
const LoginWrap = styled.div`
  min-height:100dvh; display:flex; flex-direction:column; background:var(--pb-hero);
  padding:calc(24px + env(safe-area-inset-top,0px)) 24px calc(28px + env(safe-area-inset-bottom,0px));
  .center{ flex:1; display:flex; flex-direction:column; justify-content:center; max-width:420px; width:100%; margin:0 auto; }
  h1{ font-family:var(--pb-font-display); font-weight:500; font-size:44px; letter-spacing:-.035em; line-height:1.02; margin:28px 0 14px; }
  p{ color:var(--pb-muted); font-size:17px; margin:0; }
  .err{ color:var(--pb-danger); font-size:14px; margin-top:14px; text-align:center; }
  .foot{ max-width:420px; width:100%; margin:0 auto; }
`;
const Logo = styled(motion.div)`
  width:64px; height:64px; border-radius:20px; background:var(--pb-ink); display:flex; align-items:flex-end; justify-content:center; gap:5px; padding:14px;
  i{ width:9px; border-radius:3px; background:var(--pb-accent); display:block; }
  i:last-child{ background:var(--pb-gold); }
`;
export function Login() {
  const { signIn, authError } = useStore();
  return (
    <LoginWrap>
      <div className="center">
        <Logo initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
          {[14, 22, 34].map((h, i) => <motion.i key={i} initial={{ height: 0 }} animate={{ height: h }} transition={{ delay: 0.2 + i * 0.1, type: "spring", stiffness: 260, damping: 18 }} />)}
        </Logo>
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>Ton argent,<br />enfin clair.</motion.h1>
        <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          PolyBudget suit tes dépenses et tes revenus, synchronisés entre ton téléphone et ton ordinateur.
        </motion.p>
      </div>
      <motion.div className="foot" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <PillButton $variant="primary" $block $size="lg" onClick={signIn}>
          <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
          Continuer avec Google
        </PillButton>
        {authError && <div className="err">{authError}</div>}
      </motion.div>
    </LoginWrap>
  );
}
