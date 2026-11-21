"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { motion } from "framer-motion";
import { Camera, ExternalLink, Pencil, Plus, Trash2, Trophy } from "lucide-react";
import { useStore } from "@/lib/store";
import {
  GOAL_CATS, Goal, PERIOD_LABEL, Period, centsToInput, goalCat, goalEta, goalLeft, goalSaved, goalScale, money,
  parseAmount, safeUrl, shortDate,
} from "@/lib/format";
import { compressImage } from "@/lib/image";
import { Card, Empty, FieldLabel, ICONS, Input, PillButton, Progress, Segmented } from "../ui";
import { Sheet } from "../overlays";

/* ---------- Vignette photo (ou icône de catégorie si pas de photo) ---------- */
const Thumb = styled.div<{ $size: number; $h: number; $r: number }>`
  width:${(p) => p.$size}px; height:${(p) => p.$size}px; border-radius:${(p) => p.$r}px; flex:none; overflow:hidden;
  display:grid; place-items:center;
  background:hsl(${(p) => p.$h} var(--cat-s) var(--cat-l)); color:hsl(${(p) => p.$h} var(--cat-fs) var(--cat-fl));
  img{ width:100%; height:100%; object-fit:cover; display:block; }
`;
export function GoalPhoto({ goal, size = 72, radius = 18 }: { goal: Pick<Goal, "photo" | "cat">; size?: number; radius?: number }) {
  const c = goalCat(goal.cat); const I = ICONS[c.icon] || ICONS.tag;
  return (
    <Thumb $size={size} $h={c.h} $r={radius}>
      {goal.photo ? <img src={goal.photo} alt="" /> : <I size={Math.round(size * 0.4)} strokeWidth={1.8} />}
    </Thumb>
  );
}

const Badge = styled.span<{ $gold?: boolean }>`
  display:inline-flex; align-items:center; gap:4px; height:22px; padding:0 9px; border-radius:var(--pb-pill);
  font-size:12px; font-weight:600; white-space:nowrap;
  background:${(p) => (p.$gold ? "var(--pb-gold-soft)" : "var(--pb-surface-2)")};
  color:${(p) => (p.$gold ? "var(--pb-gold-ink)" : "var(--pb-muted)")};
`;
const Totals = styled.div`
  display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:14px;
  > div{ background:var(--pb-surface); border-radius:var(--pb-r-md); padding:16px; min-width:0; }
  .l{ color:var(--pb-muted); font-size:13px; font-weight:500; }
  .v{ font-family:var(--pb-font-display); font-weight:500; font-size:22px; letter-spacing:-.02em; margin-top:4px; font-variant-numeric:tabular-nums; }
`;
const ChipRow = styled.div`
  display:flex; gap:8px; overflow-x:auto; margin:14px -16px 0; padding:0 16px 4px; scrollbar-width:none;
  &::-webkit-scrollbar{ display:none; }
`;
const FChip = styled.button<{ $on: boolean }>`
  flex:none; height:36px; padding:0 14px; border-radius:var(--pb-pill); font-size:14px; font-weight:500;
  background:${(p) => (p.$on ? "var(--pb-ink)" : "var(--pb-surface)")}; color:${(p) => (p.$on ? "var(--pb-bg)" : "var(--pb-ink)")};
`;
const GCard = styled(motion.button)`
  width:100%; display:flex; gap:14px; align-items:center; text-align:left; padding:12px; border-radius:var(--pb-r-md);
  background:var(--pb-surface); margin-top:10px;
  .main{ flex:1; min-width:0; }
  .n{ font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .tags{ display:flex; gap:6px; margin:5px 0 9px; flex-wrap:wrap; }
  .nums{ display:flex; justify-content:space-between; gap:8px; font-size:13px; color:var(--pb-muted); margin-top:7px; font-variant-numeric:tabular-nums; }
  .nums b{ color:var(--pb-ink); font-weight:600; }
`;
const Notice = styled.div`
  background:var(--pb-gold-soft); color:var(--pb-ink); border-radius:var(--pb-r-md); padding:14px 16px; font-size:14px; margin-top:14px;
`;

type Sort = "recent" | "big" | "progress";

export function GoalsView() {
  const { goals, goalsBlocked } = useStore();
  const [cat, setCat] = useState("all");
  const [sort, setSort] = useState<Sort>("recent");
  const [form, setForm] = useState<null | { goal?: Goal }>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const used = GOAL_CATS.filter((c) => goals.some((g) => g.cat === c.id));
  const list = useMemo(() => {
    const l = goals.filter((g) => cat === "all" || g.cat === cat);
    if (sort === "big") return [...l].sort((a, b) => b.price - a.price);
    if (sort === "progress") return [...l].sort((a, b) => goalSaved(b) / (b.price || 1) - goalSaved(a) / (a.price || 1));
    return l;
  }, [goals, cat, sort]);
  const saved = goals.reduce((a, g) => a + Math.min(goalSaved(g), g.price), 0);
  const left = goals.reduce((a, g) => a + goalLeft(g), 0);
  const open = goals.find((g) => g.id === openId) || null;

  return (
    <>
      {goalsBlocked && <Notice>Les objectifs ne sont pas encore autorisés par les règles de ta base. Publie les nouvelles règles Firestore fournies avec cette version.</Notice>}
      <Totals>
        <div><div className="l">Déjà mis de côté</div><div className="v">{money(saved)}</div></div>
        <div><div className="l">Reste à financer</div><div className="v">{money(left)}</div></div>
      </Totals>

      <div style={{ marginTop: 14 }}>
        <PillButton $variant="primary" $block onClick={() => setForm({})}><Plus size={18} />Nouvel objectif</PillButton>
      </div>

      {goals.length > 1 && (
        <>
          <ChipRow>
            <FChip $on={cat === "all"} onClick={() => setCat("all")}>Tous</FChip>
            {used.map((c) => <FChip key={c.id} $on={cat === c.id} onClick={() => setCat(c.id)}>{c.name}</FChip>)}
          </ChipRow>
          <div style={{ marginTop: 10 }}>
            <Segmented id="gsort" value={sort} onChange={setSort} options={[["recent", "Récents"], ["big", "Envergure"], ["progress", "Avancement"]]} />
          </div>
        </>
      )}

      {list.length ? list.map((g) => {
        const s = goalSaved(g); const done = s >= g.price;
        return (
          <GCard key={g.id} whileTap={{ scale: 0.985 }} onClick={() => setOpenId(g.id)}>
            <GoalPhoto goal={g} />
            <div className="main">
              <div className="n">{g.name}</div>
              <div className="tags">
                {done ? <Badge $gold><Trophy size={12} />Atteint</Badge> : <Badge>{goalScale(g.price)}</Badge>}
                <Badge>{goalCat(g.cat).name}</Badge>
              </div>
              <Progress pct={(s / (g.price || 1)) * 100} tone={done ? "gold" : "ok"} />
              <div className="nums"><span><b>{money(s)}</b> mis</span><span>{done ? `sur ${money(g.price)}` : <>reste <b>{money(g.price - s)}</b></>}</span></div>
            </div>
          </GCard>
        );
      }) : (
        <Card style={{ marginTop: 14 }}><Empty>
          <b>{goals.length ? "Aucun objectif dans cette catégorie" : "Aucun objectif pour l’instant"}</b>
          {goals.length ? "Change de filtre pour voir les autres." : "Ajoute ce que tu veux t’offrir ou financer, puis verse un peu à ton rythme."}
        </Empty></Card>
      )}

      <GoalForm state={form} onClose={() => setForm(null)} />
      <GoalDetail goal={open} onClose={() => setOpenId(null)} onEdit={(g) => { setOpenId(null); setForm({ goal: g }); }} />
    </>
  );
}

/* ====================== Création / modification ====================== */
const PhotoPick = styled.button`
  width:100%; height:150px; border-radius:var(--pb-r-md); background:var(--pb-surface); overflow:hidden; position:relative;
  display:grid; place-items:center; color:var(--pb-muted); font-size:14px; font-weight:500;
  img{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
  .ov{ position:relative; display:flex; flex-direction:column; align-items:center; gap:6px; }
  .ov.has{ background:var(--pb-glass); color:var(--pb-ink); padding:8px 14px; border-radius:var(--pb-pill); flex-direction:row; }
`;
const Stack = styled.div` display:grid; gap:14px; grid-template-columns:minmax(0,1fr); `;
const Two = styled.div` display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1.3fr); gap:10px; align-items:end; `;
const CatChips = styled.div` display:flex; gap:8px; flex-wrap:wrap; `;

function GoalForm({ state, onClose }: { state: null | { goal?: Goal }; onClose: () => void }) {
  const { saveGoal, notify } = useStore();
  const editing = state?.goal;
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(""); const [price, setPrice] = useState(""); const [cat, setCat] = useState("achat");
  const [link, setLink] = useState(""); const [photo, setPhoto] = useState(""); const [rAmount, setRAmount] = useState("");
  const [rPeriod, setRPeriod] = useState<Period>("month"); const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!state) return; const g = state.goal;
    setName(g?.name || ""); setPrice(g ? centsToInput(g.price) : ""); setCat(g?.cat || "achat"); setLink(g?.link || "");
    setPhoto(g?.photo || ""); setRAmount(g?.rAmount ? centsToInput(g.rAmount) : ""); setRPeriod(g?.rPeriod || "month");
  }, [state]);

  const pick = async (f?: File) => {
    if (!f) return; setBusy(true);
    try { setPhoto(await compressImage(f)); } catch { notify("Impossible de lire cette image."); }
    setBusy(false);
  };
  const submit = () => {
    const cents = parseAmount(price); const r = parseAmount(rAmount || "0");
    if (!name.trim()) { notify("Donne un nom à ton objectif."); return; }
    if (!(cents > 0)) { notify("Indique le prix à atteindre."); return; }
    if (link.trim() && !safeUrl(link)) { notify("Le lien doit commencer par https://"); return; }
    saveGoal({
      name: name.trim().slice(0, 80), price: cents, cat, link: safeUrl(link) || undefined, photo: photo || undefined,
      rAmount: r > 0 ? r : undefined, rPeriod: r > 0 ? rPeriod : undefined,
    }, editing?.id);
    onClose();
  };

  return (
    <Sheet open={!!state} onClose={onClose} title={editing ? "Modifier l’objectif" : "Nouvel objectif"}>
      <Stack>
        <PhotoPick type="button" onClick={() => fileRef.current?.click()} aria-label="Choisir une photo">
          {photo && <img src={photo} alt="" />}
          <span className={`ov ${photo ? "has" : ""}`}><Camera size={photo ? 16 : 24} />{busy ? "Préparation…" : photo ? "Changer la photo" : "Ajouter une photo"}</span>
        </PhotoPick>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />

        <div><FieldLabel htmlFor="gname">Nom</FieldLabel><Input id="gname" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. Chaise gaming" maxLength={80} /></div>
        <div><FieldLabel htmlFor="gprice">Prix à atteindre (€)</FieldLabel><Input id="gprice" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="150" /></div>
        <div>
          <FieldLabel>Catégorie</FieldLabel>
          <CatChips>{GOAL_CATS.map((c) => <FChip key={c.id} type="button" $on={cat === c.id} onClick={() => setCat(c.id)}>{c.name}</FChip>)}</CatChips>
        </div>
        <div><FieldLabel htmlFor="glink">Lien de l’article (facultatif)</FieldLabel><Input id="glink" inputMode="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://…" /></div>
        <div>
          <FieldLabel htmlFor="gr">Mon rythme (facultatif)</FieldLabel>
          <Two>
            <Input id="gr" inputMode="decimal" value={rAmount} onChange={(e) => setRAmount(e.target.value)} placeholder="10 €" />
            <Segmented id="gperiod" value={rPeriod} onChange={setRPeriod} options={[["day", "Jour"], ["week", "Sem."], ["month", "Mois"]]} />
          </Two>
        </div>
        <PillButton $variant="accent" $block $size="lg" onClick={submit} disabled={busy}>{editing ? "Enregistrer" : "Créer l’objectif"}</PillButton>
      </Stack>
    </Sheet>
  );
}

/* ====================== Détail et versements ====================== */
const Hero = styled.div`
  display:flex; gap:14px; align-items:center;
  .n{ font-family:var(--pb-font-display); font-weight:600; font-size:20px; letter-spacing:-.01em; line-height:1.2; }
  .tags{ display:flex; gap:6px; margin-top:8px; flex-wrap:wrap; }
`;
const Split = styled.div`
  display:grid; grid-template-columns:1fr 1fr; gap:10px; margin:16px 0 12px;
  > div{ background:var(--pb-surface); border-radius:16px; padding:14px; min-width:0; }
  .l{ color:var(--pb-muted); font-size:13px; font-weight:500; }
  .v{ font-family:var(--pb-font-display); font-weight:500; font-size:24px; letter-spacing:-.02em; margin-top:2px; font-variant-numeric:tabular-nums; }
  .v.acc{ color:var(--pb-accent); }
`;
const Eta = styled.p` color:var(--pb-muted); font-size:14px; margin:10px 2px 0; b{ color:var(--pb-ink); font-weight:600; } `;
const Quick = styled.div` display:flex; gap:8px; flex-wrap:wrap; margin:10px 0 12px; `;
const Hist = styled.div`
  margin-top:18px;
  h4{ margin:0 2px 6px; font-size:14px; font-weight:600; color:var(--pb-muted); }
  .r{ display:flex; justify-content:space-between; padding:9px 2px; border-top:1px solid var(--pb-line); font-size:14px; font-variant-numeric:tabular-nums; }
  .r span:last-child{ font-weight:600; } .neg{ color:var(--pb-muted); }
`;
const Foot = styled.div` display:flex; gap:8px; margin-top:16px; flex-wrap:wrap; > *{ flex:1; } `;

function GoalDetail({ goal, onClose, onEdit }: { goal: Goal | null; onClose: () => void; onEdit: (g: Goal) => void }) {
  const { depositGoal, deleteGoal, notify } = useStore();
  const [amount, setAmount] = useState("");
  const last = useRef<Goal | null>(null);
  if (goal) last.current = goal;
  const g = goal || last.current;                 // garde le contenu pendant l’animation de fermeture
  useEffect(() => { setAmount(""); }, [goal?.id]);
  if (!g) return null;

  const saved = goalSaved(g); const left = goalLeft(g); const done = saved >= g.price;
  const eta = goalEta(g); const url = safeUrl(g.link);
  const act = (sign: 1 | -1) => {
    const c = parseAmount(amount);
    if (!(c > 0)) { notify("Indique un montant."); return; }
    depositGoal(g.id, sign * c); setAmount("");
  };
  const hist = [...(g.deposits || [])].reverse().slice(0, 6);

  return (
    <Sheet open={!!goal} onClose={onClose} title="Objectif">
      <Hero>
        <GoalPhoto goal={g} size={96} radius={22} />
        <div style={{ minWidth: 0 }}>
          <div className="n">{g.name}</div>
          <div className="tags">
            {done ? <Badge $gold><Trophy size={12} />Atteint</Badge> : <Badge>{goalScale(g.price)}</Badge>}
            <Badge>{goalCat(g.cat).name}</Badge><Badge>{money(g.price)}</Badge>
          </div>
        </div>
      </Hero>

      <Split>
        <div><div className="l">Déjà mis</div><div className="v acc">{money(saved)}</div></div>
        <div><div className="l">Reste à mettre</div><div className="v">{money(left)}</div></div>
      </Split>
      <Progress pct={(saved / (g.price || 1)) * 100} tone={done ? "gold" : "ok"} />
      {done ? <Eta><b>Objectif atteint.</b> Tu as réuni la somme, tu peux te l’offrir.</Eta>
        : eta && g.rAmount && g.rPeriod ? <Eta>À {money(g.rAmount)} par {PERIOD_LABEL[g.rPeriod]}, atteint vers le <b>{eta.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</b>.</Eta>
        : <Eta>Ajoute un rythme pour estimer la date d’atteinte.</Eta>}

      <div style={{ marginTop: 18 }}>
        <FieldLabel htmlFor="gdep">Verser sur cet objectif (€)</FieldLabel>
        <Input id="gdep" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="50"
          onKeyDown={(e) => e.key === "Enter" && act(1)} />
        <Quick>
          {[1000, 2000, 5000].filter((v) => v < left).map((v) => <FChip key={v} type="button" $on={false} onClick={() => setAmount(centsToInput(v))}>{money(v).replace(",00", "")}</FChip>)}
          {left > 0 && <FChip type="button" $on={false} onClick={() => setAmount(centsToInput(left))}>Tout le reste</FChip>}
        </Quick>
        <Foot style={{ marginTop: 0 }}>
          <PillButton $variant="accent" onClick={() => act(1)}>Verser</PillButton>
          {saved > 0 && <PillButton $variant="soft" onClick={() => act(-1)}>Retirer</PillButton>}
        </Foot>
      </div>

      {hist.length > 0 && (
        <Hist>
          <h4>Derniers mouvements</h4>
          {hist.map((x, i) => <div className="r" key={i}><span>{shortDate(x.d)}</span><span className={x.a < 0 ? "neg" : ""}>{x.a > 0 ? "+" : "−"}{money(Math.abs(x.a))}</span></div>)}
        </Hist>
      )}

      <Foot>
        {url && <PillButton as="a" href={url} target="_blank" rel="noopener noreferrer" $variant="soft" style={{ textDecoration: "none" }}><ExternalLink size={17} />Voir l’article</PillButton>}
        <PillButton $variant="soft" onClick={() => onEdit(g)}><Pencil size={17} />Modifier</PillButton>
        <PillButton $variant="danger" onClick={() => { if (confirm(`Supprimer « ${g.name} » et son historique ?`)) { deleteGoal(g.id); onClose(); } }}><Trash2 size={17} />Supprimer</PillButton>
      </Foot>
    </Sheet>
  );
}
