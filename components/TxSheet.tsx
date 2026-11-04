"use client";
import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { motion } from "framer-motion";
import { CalendarDays, PenLine } from "lucide-react";
import { useStore } from "@/lib/store";
import { Tx, TxType, centsToInput, parseAmount, todayISO } from "@/lib/format";
import { Sheet, Keypad, pushKey } from "./overlays";
import { CatIcon, PillButton, Segmented } from "./ui";

export type SheetState = null | { tx?: Tx; type?: TxType };

const AmountBox = styled.div`
  text-align:center; margin:22px 0 4px;
  .v{ font-family:var(--pb-font-display); font-weight:500; font-size:56px; letter-spacing:-.035em; line-height:1;
      font-variant-numeric:tabular-nums; display:inline-flex; align-items:baseline; gap:6px; }
  .v.empty{ color:var(--pb-muted); }
  .cur{ font-size:30px; color:var(--pb-muted); }
  .caret{ width:2px; height:44px; background:var(--pb-accent); align-self:center; border-radius:2px; }
`;
const Chips = styled.div`
  display:flex; gap:8px; overflow-x:auto; padding:4px 2px 8px; margin:14px -20px 0; padding-left:20px; padding-right:20px;
  scrollbar-width:none; &::-webkit-scrollbar{ display:none; }
`;
const Chip = styled(motion.button)<{ $on: boolean }>`
  flex:none; display:flex; align-items:center; gap:8px; height:44px; padding:0 14px 0 5px; border-radius:var(--pb-pill);
  font-size:14px; font-weight:500; white-space:nowrap;
  background:${(p) => (p.$on ? "var(--pb-ink)" : "var(--pb-surface)")};
  color:${(p) => (p.$on ? "var(--pb-bg)" : "var(--pb-ink)")};
  transition:background .2s,color .2s;
`;
const Fields = styled.div`
  display:grid; grid-template-columns:1fr 1fr; gap:8px; margin:8px 0 4px;
  label{ position:relative; display:block; }
  svg{ position:absolute; left:14px; top:50%; transform:translateY(-50%); color:var(--pb-muted); pointer-events:none; }
  input{ width:100%; height:46px; border:0; border-radius:var(--pb-pill); background:var(--pb-surface);
         padding:0 14px 0 40px; font-size:15px; color:var(--pb-ink); }
  input:focus{ box-shadow:inset 0 0 0 2px var(--pb-accent); }
  input[type="date"]{ padding-right:10px; }
`;

export default function TxSheet({ state, onClose }: { state: SheetState; onClose: () => void }) {
  const { cats, saveTx, deleteTx, notify } = useStore();
  const editing = state?.tx;
  const [type, setType] = useState<TxType>("out");
  const [amount, setAmount] = useState("");
  const [cat, setCat] = useState("alim");
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!state) return;
    const t = state.tx;
    setType(t?.type || state.type || "out");
    setAmount(t ? centsToInput(t.amount) : "");
    setCat(t?.cat || (state.type === "in" ? "salaire" : "alim"));
    setDate(t?.date || todayISO());
    setNote(t?.note || "");
  }, [state]);

  const list = useMemo(() => cats.filter((c) => (c.type || "out") === type), [cats, type]);
  useEffect(() => { if (list.length && !list.find((c) => c.id === cat)) setCat(list[0].id); }, [list, cat]);

  // Saisie au clavier physique (ordinateur)
  useEffect(() => {
    if (!state) return;
    const k = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT") { if (e.key === "Enter") submit(); return; }
      if (/^[0-9]$/.test(e.key)) setAmount((v) => pushKey(v, e.key));
      else if (e.key === "," || e.key === ".") setAmount((v) => pushKey(v, ","));
      else if (e.key === "Backspace") setAmount((v) => pushKey(v, "back"));
      else if (e.key === "Enter") submit();
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  });

  const submit = () => {
    const cents = parseAmount(amount);
    if (!(cents > 0)) { notify("Indique un montant supérieur à zéro."); return; }
    saveTx({ type, amount: cents, cat, date: date || todayISO(), note: note.trim(), createdAt: editing?.createdAt }, editing?.id);
    onClose();
  };

  return (
    <Sheet open={!!state} onClose={onClose} title={editing ? "Modifier" : type === "in" ? "Nouveau revenu" : "Nouvelle dépense"}>
      <Segmented id="txtype" value={type} onChange={setType} options={[["out", "Dépense"], ["in", "Revenu"]]} />

      <AmountBox aria-live="polite">
        <motion.span className={`v ${amount ? "" : "empty"}`} key={amount.length}
          initial={{ scale: 0.98 }} animate={{ scale: 1 }} transition={{ duration: 0.12 }}>
          {type === "in" && amount ? "+" : ""}{amount || "0"}
          <motion.span className="caret" animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 1.1 }} />
          <span className="cur">€</span>
        </motion.span>
      </AmountBox>

      <Chips role="listbox" aria-label="Catégorie">
        {list.map((c) => (
          <Chip key={c.id} $on={c.id === cat} whileTap={{ scale: 0.95 }} onClick={() => setCat(c.id)} role="option" aria-selected={c.id === cat}>
            <CatIcon cat={c} size={34} />{c.name}
          </Chip>
        ))}
      </Chips>

      <Fields>
        <label><PenLine size={17} /><input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note" aria-label="Note" /></label>
        <label><CalendarDays size={17} /><input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Date" /></label>
      </Fields>

      <Keypad onKey={(k) => setAmount((v) => pushKey(v, k))} />

      <PillButton $variant="accent" $block $size="lg" onClick={submit}>
        {editing ? "Enregistrer" : type === "in" ? "Ajouter le revenu" : "Ajouter la dépense"}
      </PillButton>
      {editing && (
        <PillButton $variant="danger" $block style={{ marginTop: 8 }}
          onClick={() => { if (confirm("Supprimer cette transaction ?")) { deleteTx(editing.id); onClose(); } }}>
          Supprimer
        </PillButton>
      )}
    </Sheet>
  );
}
