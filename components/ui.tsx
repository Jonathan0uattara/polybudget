"use client";
import React, { useEffect, useRef, useState } from "react";
import styled, { css } from "styled-components";
import { animate, motion } from "framer-motion";
import {
  Utensils, Coffee, ShoppingCart, Bus, Car, Plane, House, Zap, PartyPopper, ShoppingBag, Shirt, HeartPulse,
  Dumbbell, GraduationCap, BookOpen, Repeat, Smartphone, Gift, Briefcase, PiggyBank, Sparkles, Tag, Wallet,
  Music, Gamepad2, Baby, Dog, Scissors, LucideIcon,
} from "lucide-react";
import { Category } from "@/lib/format";

/* ---------- Icônes de catégories ---------- */
export const ICONS: Record<string, LucideIcon> = {
  utensils: Utensils, coffee: Coffee, "shopping-cart": ShoppingCart, bus: Bus, car: Car, plane: Plane,
  home: House, zap: Zap, "party-popper": PartyPopper, "shopping-bag": ShoppingBag, shirt: Shirt,
  "heart-pulse": HeartPulse, dumbbell: Dumbbell, "graduation-cap": GraduationCap, "book-open": BookOpen,
  repeat: Repeat, smartphone: Smartphone, gift: Gift, briefcase: Briefcase, "piggy-bank": PiggyBank,
  sparkles: Sparkles, tag: Tag, wallet: Wallet, music: Music, "gamepad-2": Gamepad2, baby: Baby, dog: Dog,
  scissors: Scissors,
};
export const ICON_CHOICES = Object.keys(ICONS);

const CatBubble = styled.span<{ $h: number; $size: number }>`
  width:${(p) => p.$size}px; height:${(p) => p.$size}px; border-radius:50%; flex:none;
  display:grid; place-items:center;
  background:hsl(${(p) => p.$h} var(--cat-s) var(--cat-l));
  color:hsl(${(p) => p.$h} var(--cat-fs) var(--cat-fl));
`;
export function CatIcon({ cat, size = 44 }: { cat: Pick<Category, "h" | "icon">; size?: number }) {
  const I = ICONS[cat.icon] || Tag;
  return <CatBubble $h={cat.h} $size={size}><I size={Math.round(size * 0.46)} strokeWidth={2} /></CatBubble>;
}

/* ---------- Mise en page ---------- */
export const Screen = styled.div`
  width:100%; max-width:760px; margin:0 auto;
  padding:calc(16px + env(safe-area-inset-top,0px)) 16px calc(112px + env(safe-area-inset-bottom,0px));
  @media (min-width:900px){ padding:32px 32px 48px; }
`;
export const Title = styled.h1`
  font-family:var(--pb-font-display); font-weight:600; font-size:30px; letter-spacing:-.02em; line-height:1.1;
  margin:8px 4px 20px;
`;
export const SectionHead = styled.div`
  display:flex; align-items:baseline; justify-content:space-between; margin:28px 4px 10px;
  h2{ margin:0; font-family:var(--pb-font-display); font-weight:600; font-size:19px; letter-spacing:-.01em; }
`;
export const Card = styled.div<{ $pad?: number }>`
  background:var(--pb-surface); border-radius:var(--pb-r-md);
  padding:${(p) => (p.$pad ?? 6)}px;
`;
export const Muted = styled.span` color:var(--pb-muted); `;

/* ---------- Boutons ---------- */
export const PillButton = styled(motion.button).attrs({ whileTap: { scale: 0.97 } })<{ $variant?: "primary" | "accent" | "soft" | "danger" | "ghost"; $block?: boolean; $size?: "md" | "lg" }>`
  display:inline-flex; align-items:center; justify-content:center; gap:8px;
  height:${(p) => (p.$size === "lg" ? 56 : 48)}px; padding:0 ${(p) => (p.$size === "lg" ? 28 : 22)}px;
  border-radius:var(--pb-pill); font-weight:600; font-size:16px; white-space:nowrap;
  ${(p) => p.$block && css` width:100%; `}
  ${(p) => ({
    primary: css` background:var(--pb-ink); color:var(--pb-bg); `,
    accent: css` background:var(--pb-accent); color:var(--pb-on-accent); `,
    soft: css` background:var(--pb-surface-2); color:var(--pb-ink); `,
    danger: css` background:var(--pb-danger-soft); color:var(--pb-danger); `,
    ghost: css` background:transparent; color:var(--pb-accent); padding:0 8px; height:36px; `,
  }[p.$variant || "primary"])}
  &:disabled{ opacity:.45; cursor:not-allowed; }
`;
export const LinkButton = styled.button`
  color:var(--pb-accent); font-weight:600; font-size:15px; padding:4px 2px;
`;
export const RoundButton = styled(motion.button).attrs({ whileTap: { scale: 0.92 } })<{ $size?: number; $tone?: "ink" | "glass" | "soft" }>`
  width:${(p) => p.$size || 40}px; height:${(p) => p.$size || 40}px; border-radius:50%; flex:none;
  display:grid; place-items:center;
  ${(p) => ({
    ink: css` background:var(--pb-ink); color:var(--pb-bg); `,
    glass: css` background:var(--pb-glass); color:var(--pb-ink); backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px); `,
    soft: css` background:var(--pb-surface-2); color:var(--pb-ink); `,
  }[p.$tone || "soft"])}
`;

/* ---------- Contrôle segmenté (pilule) ---------- */
const SegWrap = styled.div`
  display:flex; gap:4px; padding:4px; background:var(--pb-surface-2); border-radius:var(--pb-pill); position:relative;
`;
const SegBtn = styled.button<{ $on: boolean }>`
  position:relative; flex:1; height:38px; padding:0 14px; border-radius:var(--pb-pill); font-weight:600; font-size:14px;
  color:${(p) => (p.$on ? "var(--pb-ink)" : "var(--pb-muted)")}; transition:color .2s; white-space:nowrap;
  span{ position:relative; z-index:1; }
`;
const SegThumb = styled(motion.div)`
  position:absolute; inset:0; background:var(--pb-bg); border-radius:var(--pb-pill);
`;
export function Segmented<T extends string>({ value, options, onChange, id }: {
  value: T; options: [string, string][]; onChange: (v: any) => void; id: string;
}) {
  return (
    <SegWrap role="tablist">
      {options.map(([v, l]) => (
        <SegBtn key={v} $on={v === value} onClick={() => onChange(v as T)} role="tab" aria-selected={v === value}>
          {v === value && <SegThumb layoutId={`seg-${id}`} transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
          <span>{l}</span>
        </SegBtn>
      ))}
    </SegWrap>
  );
}

/* ---------- Barre de progression animée ---------- */
const Track = styled.div` height:6px; border-radius:99px; background:var(--pb-surface-2); overflow:hidden; `;
const Fill = styled(motion.div)<{ $tone: string }>`
  height:100%; border-radius:99px;
  background:${(p) => (p.$tone === "over" ? "var(--pb-danger)" : p.$tone === "mid" ? "var(--pb-gold)" : p.$tone === "gold" ? "var(--pb-gold)" : "var(--pb-accent)")};
`;
export function Progress({ pct, tone = "ok" }: { pct: number; tone?: string }) {
  return (
    <Track className="pb-track">
      <Fill className="pb-fill" data-tone={tone} $tone={tone} initial={{ width: 0 }} animate={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
        transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }} />
    </Track>
  );
}

/* ---------- Montant animé (compteur) ---------- */
const fmtParts = (cents: number) => {
  const neg = cents < 0; const abs = Math.abs(Math.round(cents));
  const euros = new Intl.NumberFormat("fr-FR").format(Math.floor(abs / 100));
  return { neg, euros, cents: String(abs % 100).padStart(2, "0") };
};
const Big = styled.div<{ $size: number }>`
  font-family:var(--pb-font-display); font-weight:500; letter-spacing:-.035em; line-height:1;
  font-size:${(p) => p.$size}px; font-variant-numeric:tabular-nums; white-space:nowrap;
  small{ font-size:.5em; letter-spacing:-.01em; margin-left:1px; }
`;
export function AnimatedAmount({ cents, size = 56, signed = false }: { cents: number; size?: number; signed?: boolean }) {
  const [shown, setShown] = useState(cents);
  const prev = useRef(cents);
  useEffect(() => {
    const ctrl = animate(prev.current, cents, {
      duration: 0.8, ease: [0.2, 0.8, 0.2, 1], onUpdate: (v) => setShown(v),
    });
    prev.current = cents;
    return () => ctrl.stop();
  }, [cents]);
  const p = fmtParts(shown);
  return (
    <Big $size={size} aria-label={`${(cents / 100).toFixed(2)} euros`}>
      {p.neg ? "−" : signed && cents > 0 ? "+" : ""}{p.euros}<small>,{p.cents} €</small>
    </Big>
  );
}

/* ---------- Ligne de liste ---------- */
export const Row = styled(motion.button)`
  width:100%; display:flex; align-items:center; gap:14px; text-align:left;
  padding:12px 12px; border-radius:16px;
  @media (hover:hover){ &:hover{ background:var(--pb-surface-2); } }
  .main{ flex:1; min-width:0; }
  .t{ font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .s{ font-size:13px; color:var(--pb-muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-top:1px; }
  .amt{ font-weight:600; font-variant-numeric:tabular-nums; white-space:nowrap; }
  .amt.in{ color:var(--pb-income); }
`;

export const Empty = styled.div`
  padding:28px 20px; text-align:center; color:var(--pb-muted); font-size:15px;
  b{ display:block; color:var(--pb-ink); font-weight:600; font-size:16px; margin-bottom:4px; }
`;

export const Input = styled.input`
  width:100%; height:48px; padding:0 18px; border-radius:var(--pb-pill); border:0;
  background:var(--pb-surface-2); color:var(--pb-ink); font-size:16px;
  &::placeholder{ color:var(--pb-muted); }
  &:focus{ box-shadow:inset 0 0 0 2px var(--pb-accent); }
`;
export const FieldLabel = styled.label`
  display:block; font-size:13px; font-weight:500; color:var(--pb-muted); margin:0 6px 6px;
`;
