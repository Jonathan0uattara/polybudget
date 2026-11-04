"use client";
import React, { useMemo } from "react";
import styled from "styled-components";
import { motion } from "framer-motion";
import { ArrowDownLeft, ChevronLeft, ChevronRight, FileText, Plus, Search, Sparkles, Target } from "lucide-react";
import { useStore } from "@/lib/store";
import { Tx, byCat, money, moneyShort, ratioTone, shiftYM, shortDate, sortTx, totals, ymMonth, ymOf, ymShort } from "@/lib/format";
import { AnimatedAmount, Card, CatIcon, Empty, LinkButton, Progress, RoundButton, Row, Screen, SectionHead } from "../ui";

const Hero = styled.section`
  background:var(--pb-hero);
  padding:calc(14px + env(safe-area-inset-top,0px)) 16px 26px;
  @media (min-width:900px){ border-radius:0 0 32px 32px; padding-top:24px; }
`;
const Inner = styled.div` max-width:760px; margin:0 auto; `;
const Top = styled.div` display:flex; align-items:center; justify-content:space-between; gap:12px; `;
const Avatar = styled(motion.button)`
  width:40px; height:40px; border-radius:50%; overflow:hidden; flex:none;
  background:var(--pb-ink); color:var(--pb-bg); font-weight:600; display:grid; place-items:center;
  img{ width:100%; height:100%; object-fit:cover; }
`;
const Brand = styled.div`
  height:40px; padding:0 16px; border-radius:var(--pb-pill); background:var(--pb-glass);
  backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px);
  display:flex; align-items:center; gap:8px; font-family:var(--pb-font-display); font-weight:600; font-size:15px;
  i{ width:8px; height:8px; border-radius:50%; background:var(--pb-accent); display:block; }
`;
const BalanceZone = styled.div` text-align:center; margin-top:30px; `;
const MonthSwitch = styled.div`
  display:inline-flex; align-items:center; gap:2px; color:var(--pb-muted); font-size:15px; font-weight:500;
  button{ width:30px; height:30px; border-radius:50%; display:grid; place-items:center; color:var(--pb-ink); }
  button:disabled{ opacity:.25; }
  span{ min-width:132px; text-transform:capitalize; }
`;
const Flows = styled.div`
  display:inline-flex; gap:14px; margin-top:16px; padding:8px 16px; border-radius:var(--pb-pill);
  background:var(--pb-glass); backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px); font-size:14px; font-weight:500;
  .in{ color:var(--pb-income); } .sep{ color:var(--pb-line); }
`;
const Actions = styled.div`
  display:grid; grid-template-columns:repeat(4,1fr); gap:8px; margin:28px auto 0; max-width:400px;
`;
const Action = styled(motion.button)`
  display:flex; flex-direction:column; align-items:center; gap:8px; font-size:13px; font-weight:500;
  .c{ width:52px; height:52px; border-radius:50%; display:grid; place-items:center; background:var(--pb-glass);
      backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px); color:var(--pb-ink); }
  &.primary .c{ background:var(--pb-ink); color:var(--pb-bg); }
`;
const SpendCard = styled(Card)`
  padding:20px;
  .row{ display:flex; justify-content:space-between; align-items:flex-end; gap:12px; }
  .lbl{ color:var(--pb-muted); font-size:14px; font-weight:500; }
  .v{ font-family:var(--pb-font-display); font-weight:500; font-size:30px; letter-spacing:-.02em; margin-top:4px; }
  .meta{ font-size:13px; color:var(--pb-muted); text-align:right; }
`;
const Bars = styled.div`
  display:grid; grid-template-columns:repeat(6,1fr); gap:10px; align-items:end; height:96px; margin-top:20px;
  .col{ display:flex; flex-direction:column; align-items:center; gap:6px; height:100%; justify-content:flex-end; }
  .b{ width:100%; max-width:38px; border-radius:10px; background:var(--pb-surface-2); }
  .b.cur{ background:var(--pb-accent); }
  .m{ font-size:12px; color:var(--pb-muted); text-transform:capitalize; }
  .m.cur{ color:var(--pb-ink); font-weight:600; }
`;
const Insight = styled(motion.div)`
  display:flex; gap:12px; align-items:flex-start; margin-top:12px; padding:16px 18px; border-radius:var(--pb-r-md);
  background:var(--pb-gold-soft); color:var(--pb-ink); font-size:15px; line-height:1.4;
  svg{ color:var(--pb-gold-ink); flex:none; margin-top:1px; }
  b{ font-weight:600; }
`;

const listVariants = { show: { transition: { staggerChildren: 0.04 } } };
const itemVariants = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

export default function Home({ month, setMonth, openTx, onEdit, go }: {
  month: string; setMonth: (m: string) => void; openTx: (type?: "in" | "out") => void; onEdit: (t: Tx) => void; go: (tab: string) => void;
}) {
  const { user, settings, txs, catById } = useStore();
  const isNow = month === ymOf(new Date());
  const list = useMemo(() => txs.filter((t) => (t.date || "").startsWith(month)), [txs, month]);
  const t = totals(list);
  const prevOut = useMemo(() => totals(txs.filter((x) => (x.date || "").startsWith(shiftYM(month, -1)))).out, [txs, month]);
  const months = useMemo(() => Array.from({ length: 6 }, (_, i) => shiftYM(month, i - 5)), [month]);
  const monthOut = months.map((m) => totals(txs.filter((x) => (x.date || "").startsWith(m))).out);
  const max = Math.max(...monthOut, 1);
  const cats = Object.entries(byCat(list)).sort((a, b) => b[1] - a[1]);
  const recent = sortTx(list).slice(0, 5);
  const first = (settings.profile?.firstName || settings.name || user?.displayName || "").trim().split(" ")[0];

  let insight: React.ReactNode;
  if (!txs.length) insight = <>Ajoute ta première dépense avec le bouton <b>+</b> : ton tableau de bord prendra vie tout de suite.</>;
  else if (settings.monthlyBudget > 0) {
    const r = settings.monthlyBudget - t.out;
    insight = r >= 0 ? <>Il te reste <b>{money(r)}</b> sur ton budget de {ymMonth(month)}. Belle maîtrise{first ? `, ${first}` : ""} !</>
      : <>Budget dépassé de <b>{money(-r)}</b>. Pas de panique : on ajuste et on rebondit le mois prochain.</>;
  } else if (prevOut > 0 && t.out < prevOut) insight = <><b>{money(prevOut - t.out)}</b> de dépenses en moins que le mois dernier. Bravo !</>;
  else if (t.bal > 0) insight = <>Solde positif : tu mets <b>{money(t.bal)}</b> de côté ce mois-ci. Continue comme ça !</>;
  else insight = <>Fixe un budget mensuel pour suivre ce qu’il te reste à dépenser.</>;

  return (
    <>
      <Hero>
        <Inner>
          <Top>
            <Avatar whileTap={{ scale: 0.92 }} onClick={() => go("settings")} aria-label="Réglages du compte">
              {user?.photoURL ? <img src={user.photoURL} alt="" referrerPolicy="no-referrer" /> : (first[0] || "P").toUpperCase()}
            </Avatar>
            <Brand><i />PolyBudget</Brand>
            <RoundButton $tone="glass" onClick={() => go("history")} aria-label="Rechercher"><Search size={19} /></RoundButton>
          </Top>

          <BalanceZone>
            <MonthSwitch>
              <button onClick={() => setMonth(shiftYM(month, -1))} aria-label="Mois précédent"><ChevronLeft size={18} /></button>
              <span>Solde · {ymMonth(month)}</span>
              <button onClick={() => setMonth(shiftYM(month, 1))} disabled={isNow} aria-label="Mois suivant"><ChevronRight size={18} /></button>
            </MonthSwitch>
            <div style={{ marginTop: 10 }}><AnimatedAmount cents={t.bal} size={58} /></div>
            <Flows>
              <span className="in">+{money(t.inc)}</span><span className="sep">|</span><span>−{money(t.out)}</span>
            </Flows>
          </BalanceZone>

          <Actions>
            <Action className="primary" whileTap={{ scale: 0.92 }} onClick={() => openTx("out")}><span className="c"><Plus size={24} /></span>Dépense</Action>
            <Action whileTap={{ scale: 0.92 }} onClick={() => openTx("in")}><span className="c"><ArrowDownLeft size={22} /></span>Revenu</Action>
            <Action whileTap={{ scale: 0.92 }} onClick={() => go("budgets")}><span className="c"><Target size={22} /></span>Budgets</Action>
            <Action whileTap={{ scale: 0.92 }} onClick={() => go("report")}><span className="c"><FileText size={22} /></span>Rapport</Action>
          </Actions>
        </Inner>
      </Hero>

      <Screen style={{ paddingTop: 16 }}>
        <SpendCard>
          <div className="row">
            <div><div className="lbl">Dépensé en {ymMonth(month)}</div><div className="v">{money(t.out)}</div></div>
            <div className="meta">{settings.monthlyBudget ? <>sur {moneyShort(settings.monthlyBudget)}</> : <LinkButton onClick={() => go("budgets")}>Fixer un budget</LinkButton>}</div>
          </div>
          {settings.monthlyBudget > 0 && <div style={{ marginTop: 12 }}><Progress pct={(t.out / settings.monthlyBudget) * 100} tone={ratioTone(t.out, settings.monthlyBudget)} /></div>}
          <Bars aria-label="Dépenses des six derniers mois">
            {months.map((m, i) => (
              <button className="col" key={m} onClick={() => setMonth(m)} title={`${ymMonth(m)} : ${money(monthOut[i])}`}>
                <motion.div className={`b ${m === month ? "cur" : ""}`} initial={{ height: 4 }}
                  animate={{ height: Math.max(4, (monthOut[i] / max) * 70) }} transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1], delay: i * 0.04 }} />
                <span className={`m ${m === month ? "cur" : ""}`}>{ymShort(m)}</span>
              </button>
            ))}
          </Bars>
        </SpendCard>

        <Insight initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Sparkles size={20} /><div>{insight}</div>
        </Insight>

        <SectionHead><h2>Transactions</h2><LinkButton onClick={() => go("history")}>Tout voir</LinkButton></SectionHead>
        <Card>
          {recent.length ? (
            <motion.div variants={listVariants} initial="hidden" animate="show">
              {recent.map((x) => <TxRow key={x.id} t={x} onClick={() => onEdit(x)} />)}
            </motion.div>
          ) : <Empty><b>Rien pour l’instant</b>Appuie sur « Dépense » pour commencer.</Empty>}
        </Card>

        <SectionHead><h2>Où va ton argent</h2></SectionHead>
        <Card>
          {cats.length ? cats.map(([id, v]) => {
            const c = catById(id); const b = settings.budgets?.[id] || 0;
            return (
              <Row as="div" key={id}>
                <CatIcon cat={c} />
                <div className="main">
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <span className="t">{c.name}</span><span className="amt">{money(v)}</span>
                  </div>
                  <div className="s" style={{ marginBottom: 8 }}>{b ? `sur ${money(b)} prévus` : `${Math.round((v / (t.out || 1)) * 100)} % des dépenses`}</div>
                  <Progress pct={(v / (b || t.out || 1)) * 100} tone={b ? ratioTone(v, b) : "ok"} />
                </div>
              </Row>
            );
          }) : <Empty><b>Aucune dépense ce mois-ci</b>Tes catégories apparaîtront ici.</Empty>}
        </Card>
      </Screen>
    </>
  );
}

export function TxRow({ t, onClick }: { t: Tx; onClick: () => void }) {
  const { catById } = useStore();
  const c = catById(t.cat); const inc = t.type === "in";
  return (
    <Row variants={itemVariants} whileTap={{ scale: 0.985 }} onClick={onClick}>
      <CatIcon cat={c} />
      <div className="main">
        <div className="t">{t.note || c.name}</div>
        <div className="s">{t.note ? `${c.name} · ` : ""}{shortDate(t.date)}</div>
      </div>
      <div className={`amt ${inc ? "in" : ""}`}>{inc ? "+" : "−"}{money(t.amount)}</div>
    </Row>
  );
}
