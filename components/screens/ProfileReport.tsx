"use client";
import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, FileDown } from "lucide-react";
import { useStore } from "@/lib/store";
import {
  Profile, STATUS_LABELS, ageOf, byCat, emptyProfile, money, shiftYM, shortDate, sortTx, totals, ymLabel, ymOf,
} from "@/lib/format";
import { Card, CatIcon, FieldLabel, Input, PillButton, RoundButton, Screen, SectionHead, Segmented } from "../ui";

/* ---------- En-tête avec retour ---------- */
const BackHead = styled.div`
  display:flex; align-items:center; gap:12px; margin:4px 0 20px;
  h1{ margin:0; font-family:var(--pb-font-display); font-weight:600; font-size:28px; letter-spacing:-.02em; }
`;
export function Back({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <BackHead className="no-print">
      <RoundButton onClick={onBack} aria-label="Retour"><ChevronLeft size={20} /></RoundButton>
      <h1>{title}</h1>
    </BackHead>
  );
}

/* ====================== MON PROFIL ====================== */
const Hero = styled.div`
  display:flex; flex-direction:column; align-items:center; gap:10px; margin-bottom:22px; text-align:center;
  .av{ width:88px; height:88px; border-radius:50%; overflow:hidden; background:var(--pb-ink); color:var(--pb-bg);
       display:grid; place-items:center; font-family:var(--pb-font-display); font-size:34px; font-weight:600; }
  .av img{ width:100%; height:100%; object-fit:cover; }
  .n{ font-family:var(--pb-font-display); font-weight:600; font-size:22px; }
  .m{ color:var(--pb-muted); font-size:14px; }
`;
const Grid = styled.div`
  display:grid; gap:14px; grid-template-columns:minmax(0,1fr);
  .two{ display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:10px; }
  > div, .two > div{ min-width:0; }
  input{ min-width:0; }
  [role="tablist"] button{ padding:0 6px; font-size:13px; }
`;

export function ProfileScreen({ onBack }: { onBack: () => void }) {
  const { settings, patchSettings, user, notify } = useStore();
  const [p, setP] = useState<Profile>({ ...emptyProfile(), ...settings.profile });
  useEffect(() => { setP({ ...emptyProfile(), ...settings.profile }); }, [settings.profile]);
  const set = (k: keyof Profile) => (e: React.ChangeEvent<HTMLInputElement>) => setP({ ...p, [k]: e.target.value });
  const dirty = JSON.stringify(p) !== JSON.stringify({ ...emptyProfile(), ...settings.profile });
  const full = [p.firstName, p.lastName].filter(Boolean).join(" ") || user?.displayName || "Mon profil";
  const age = ageOf(p.birthDate);

  const save = () => {
    const clean = Object.fromEntries(Object.entries(p).map(([k, v]) => [k, typeof v === "string" ? v.trim() : v])) as unknown as Profile;
    patchSettings({ profile: clean, name: clean.firstName || settings.name });
    notify("Profil enregistré");
  };

  return (
    <Screen>
      <Back title="Mon profil" onBack={onBack} />
      <Hero>
        <div className="av">{user?.photoURL ? <img src={user.photoURL} alt="" referrerPolicy="no-referrer" /> : (full[0] || "P").toUpperCase()}</div>
        <div className="n">{full}</div>
        <div className="m">{[age !== null ? `${age} ans` : "", p.status ? STATUS_LABELS[p.status] : "", p.city].filter(Boolean).join(" · ") || user?.email}</div>
      </Hero>

      <Card $pad={16}>
        <Grid>
          <div className="two">
            <div><FieldLabel htmlFor="fn">Prénom</FieldLabel><Input id="fn" value={p.firstName} onChange={set("firstName")} autoComplete="given-name" /></div>
            <div><FieldLabel htmlFor="ln">Nom</FieldLabel><Input id="ln" value={p.lastName} onChange={set("lastName")} autoComplete="family-name" /></div>
          </div>
          <div className="two">
            <div><FieldLabel htmlFor="bd">Date de naissance</FieldLabel><Input id="bd" type="date" value={p.birthDate} onChange={set("birthDate")} max={new Date().toISOString().slice(0, 10)} /></div>
            <div><FieldLabel htmlFor="ct">Ville</FieldLabel><Input id="ct" value={p.city} onChange={set("city")} autoComplete="address-level2" /></div>
          </div>
          <div>
            <FieldLabel>Situation</FieldLabel>
            <Segmented id="status" value={p.status || "autre"} onChange={(v) => setP({ ...p, status: v })}
              options={[["etudiant", "Étudiant"], ["alternant", "Alternant"], ["salarie", "Salarié"], ["autre", "Autre"]]} />
          </div>
          <div><FieldLabel htmlFor="org">École ou entreprise</FieldLabel><Input id="org" value={p.org} onChange={set("org")} placeholder="Ex. Polytech Annecy-Chambéry" /></div>
          <div><FieldLabel>E-mail du compte</FieldLabel><Input value={user?.email || ""} disabled style={{ opacity: 0.7 }} /></div>
        </Grid>
      </Card>

      <div style={{ marginTop: 16 }}>
        <PillButton $variant="accent" $block $size="lg" onClick={save} disabled={!dirty}>
          {dirty ? "Enregistrer le profil" : "Profil à jour"}
        </PillButton>
      </div>
      <p style={{ color: "var(--pb-muted)", fontSize: 13, textAlign: "center", marginTop: 14 }}>
        Ces informations restent privées et servent uniquement à personnaliser l’app et tes rapports.
      </p>
    </Screen>
  );
}

/* ====================== RAPPORT MENSUEL ====================== */
const Paper = styled(Card)`
  padding:24px 20px; background:var(--pb-bg); border:1px solid var(--pb-line);
  @media (min-width:700px){ padding:36px 40px; }
  h2{ font-family:var(--pb-font-display); font-weight:600; font-size:18px; margin:28px 0 12px; }
  table{ width:100%; border-collapse:collapse; font-size:14px; }
  th{ text-align:left; color:var(--pb-muted); font-weight:500; font-size:12px; text-transform:uppercase; letter-spacing:.04em; padding:6px 4px; border-bottom:1px solid var(--pb-line); }
  td{ padding:9px 4px; border-bottom:1px solid var(--pb-line); vertical-align:middle; }
  td.r, th.r{ text-align:right; font-variant-numeric:tabular-nums; white-space:nowrap; }
  .in{ color:var(--pb-income); }
`;
const RHead = styled.div`
  display:flex; justify-content:space-between; gap:16px; flex-wrap:wrap; padding-bottom:18px; border-bottom:2px solid var(--pb-ink);
  .brand{ display:flex; align-items:center; gap:10px; font-family:var(--pb-font-display); font-weight:600; font-size:18px; }
  .logo{ width:30px; height:30px; border-radius:9px; background:var(--pb-ink); display:flex; align-items:flex-end; justify-content:center; gap:3px; padding:7px; }
  .logo i{ width:4px; border-radius:2px; background:var(--pb-accent); display:block; }
  .logo i:last-child{ background:var(--pb-gold); }
  .t{ font-family:var(--pb-font-display); font-weight:500; font-size:28px; letter-spacing:-.02em; margin-top:14px; text-transform:capitalize; }
  .who{ text-align:right; font-size:14px; color:var(--pb-muted); line-height:1.6; }
  .who b{ color:var(--pb-ink); font-size:16px; font-weight:600; }
`;
const Kpis = styled.div`
  display:grid; grid-template-columns:repeat(2,1fr); gap:10px; margin-top:20px;
  @media (min-width:700px){ grid-template-columns:repeat(4,1fr); }
  div{ background:var(--pb-surface); border-radius:16px; padding:14px; }
  .l{ font-size:12px; color:var(--pb-muted); font-weight:500; }
  .v{ font-family:var(--pb-font-display); font-weight:500; font-size:20px; margin-top:4px; letter-spacing:-.02em; font-variant-numeric:tabular-nums; }
`;
const Bar = styled.div<{ $w: number }>`
  height:6px; border-radius:6px; background:var(--pb-surface-2); overflow:hidden; min-width:60px;
  &::after{ content:""; display:block; height:100%; width:${(p) => p.$w}%; background:var(--pb-accent); border-radius:6px; }
`;
const Toolbar = styled.div`
  display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:14px; flex-wrap:wrap;
  .mn{ display:flex; align-items:center; gap:6px; font-weight:600; text-transform:capitalize; }
`;

export function ReportScreen({ onBack }: { onBack: () => void }) {
  const { settings, txs, catById, user } = useStore();
  const [month, setMonth] = useState(ymOf(new Date()));
  const p = settings.profile || emptyProfile();
  const list = useMemo(() => sortTx(txs.filter((t) => (t.date || "").startsWith(month))), [txs, month]);
  const t = totals(list);
  const prev = totals(txs.filter((x) => (x.date || "").startsWith(shiftYM(month, -1))));
  const cats = Object.entries(byCat(list)).sort((a, b) => b[1] - a[1]);
  const top = [...list].filter((x) => x.type !== "in").sort((a, b) => b.amount - a.amount).slice(0, 5);
  const savingRate = t.inc ? Math.round((t.bal / t.inc) * 100) : null;
  const age = ageOf(p.birthDate);
  const name = [p.firstName, p.lastName].filter(Boolean).join(" ") || user?.displayName || "";
  const isNow = month === ymOf(new Date());
  const diff = prev.out ? Math.round(((t.out - prev.out) / prev.out) * 100) : null;

  return (
    <Screen>
      <Back title="Rapport" onBack={onBack} />
      <Toolbar className="no-print">
        <div className="mn">
          <RoundButton $size={36} onClick={() => setMonth(shiftYM(month, -1))} aria-label="Mois précédent"><ChevronLeft size={18} /></RoundButton>
          <span style={{ minWidth: 130, textAlign: "center" }}>{ymLabel(month)}</span>
          <RoundButton $size={36} onClick={() => setMonth(shiftYM(month, 1))} disabled={isNow} style={{ opacity: isNow ? 0.3 : 1 }} aria-label="Mois suivant"><ChevronRight size={18} /></RoundButton>
        </div>
        <PillButton $variant="primary" onClick={() => window.print()}><FileDown size={18} />Télécharger en PDF</PillButton>
      </Toolbar>

      <motion.div key={month} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <Paper className="report">
          <RHead>
            <div>
              <div className="brand"><div className="logo">{[6, 10, 16].map((h, i) => <i key={i} style={{ height: h }} />)}</div>PolyBudget</div>
              <div className="t">Rapport · {ymLabel(month)}</div>
            </div>
            <div className="who">
              {name && <><b>{name}</b><br /></>}
              {[age !== null ? `${age} ans` : "", p.status ? STATUS_LABELS[p.status] : ""].filter(Boolean).join(" · ")}{(age !== null || p.status) && <br />}
              {[p.org, p.city].filter(Boolean).join(" · ")}{(p.org || p.city) && <br />}
              Édité le {new Date().toLocaleDateString("fr-FR")}
            </div>
          </RHead>

          <Kpis>
            <div><div className="l">Revenus</div><div className="v in" style={{ color: "var(--pb-income)" }}>{money(t.inc)}</div></div>
            <div><div className="l">Dépenses</div><div className="v">{money(t.out)}</div></div>
            <div><div className="l">Solde</div><div className="v">{money(t.bal)}</div></div>
            <div><div className="l">Taux d’épargne</div><div className="v">{savingRate !== null ? `${savingRate} %` : "—"}</div></div>
          </Kpis>

          <p style={{ fontSize: 14, color: "var(--pb-muted)", marginTop: 14 }}>
            {list.length} transaction{list.length > 1 ? "s" : ""} ce mois-ci.
            {diff !== null && (diff === 0 ? <> Dépenses stables par rapport au mois précédent.</> : <> Dépenses {diff < 0 ? "en baisse" : "en hausse"} de {Math.abs(diff)} % par rapport au mois précédent.</>)}
            {settings.monthlyBudget > 0 && <> Budget prévu : {money(settings.monthlyBudget)} ({t.out <= settings.monthlyBudget ? `respecté, ${money(settings.monthlyBudget - t.out)} restants` : `dépassé de ${money(t.out - settings.monthlyBudget)}`}).</>}
          </p>

          <h2>Dépenses par catégorie</h2>
          {cats.length ? (
            <table>
              <thead><tr><th>Catégorie</th><th style={{ width: "34%" }}>Part</th><th className="r">Budget</th><th className="r">Montant</th></tr></thead>
              <tbody>{cats.map(([id, v]) => { const c = catById(id); const b = settings.budgets?.[id] || 0; const pct = Math.round((v / (t.out || 1)) * 100); return (
                <tr key={id}>
                  <td><span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}><CatIcon cat={c} size={28} />{c.name}</span></td>
                  <td><span style={{ display: "flex", alignItems: "center", gap: 8 }}><Bar $w={pct} style={{ flex: 1 }} /><span style={{ fontSize: 12, color: "var(--pb-muted)", width: 34 }}>{pct} %</span></span></td>
                  <td className="r" style={{ color: "var(--pb-muted)" }}>{b ? money(b) : "—"}</td>
                  <td className="r">{money(v)}</td>
                </tr>); })}</tbody>
            </table>
          ) : <p style={{ color: "var(--pb-muted)" }}>Aucune dépense ce mois-ci.</p>}

          {top.length > 0 && <>
            <h2>Plus grosses dépenses</h2>
            <table><tbody>{top.map((x) => (
              <tr key={x.id}><td>{x.note || catById(x.cat).name}</td><td style={{ color: "var(--pb-muted)" }}>{catById(x.cat).name}</td><td className="r">{shortDate(x.date)}</td><td className="r">{money(x.amount)}</td></tr>
            ))}</tbody></table>
          </>}

          <h2>Toutes les transactions</h2>
          {list.length ? (
            <table>
              <thead><tr><th>Date</th><th>Libellé</th><th>Catégorie</th><th className="r">Montant</th></tr></thead>
              <tbody>{list.map((x) => (
                <tr key={x.id}>
                  <td style={{ whiteSpace: "nowrap" }}>{shortDate(x.date)}</td><td>{x.note || "—"}</td>
                  <td style={{ color: "var(--pb-muted)" }}>{catById(x.cat).name}</td>
                  <td className={`r ${x.type === "in" ? "in" : ""}`}>{x.type === "in" ? "+" : "−"}{money(x.amount)}</td>
                </tr>))}</tbody>
            </table>
          ) : <p style={{ color: "var(--pb-muted)" }}>Aucune transaction.</p>}

          <p style={{ fontSize: 12, color: "var(--pb-muted)", marginTop: 28, textAlign: "center" }}>Généré par PolyBudget · document personnel</p>
        </Paper>
      </motion.div>
    </Screen>
  );
}
