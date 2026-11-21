"use client";
import { createGlobalStyle } from "styled-components";
import { PALETTES } from "@/lib/format";

/**
 * Design tokens PolyBudget (--pb-*) : interface plate (zéro ombre), boutons pilule, titres en graisse 500.
 * Chaque thème de couleur teinte toute l’interface ; l’or reste réservé aux moments positifs.
 */
const semantic = {
  light: `--pb-gold:#F2B705; --pb-gold-soft:#FFF4CC; --pb-gold-ink:#7A5200;
  --pb-income:#0A7A50; --pb-danger:#D92D3D; --pb-danger-soft:#FDE8EA; --pb-warning:#B45F00;
  --pb-scrim:rgba(25,28,31,.42);
  --cat-l:92%; --cat-s:72%; --cat-fl:30%; --cat-fs:62%;
  color-scheme:light;`,
  dark: `--pb-gold:#FFC83D; --pb-gold-soft:#3A2F10; --pb-gold-ink:#FFD66B;
  --pb-income:#4ADE94; --pb-danger:#FF6B76; --pb-danger-soft:#3A1A1E; --pb-warning:#FFA23D;
  --pb-scrim:rgba(0,0,0,.6);
  --cat-l:22%; --cat-s:38%; --cat-fl:78%; --cat-fs:78%;
  color-scheme:dark;`,
};
/** Chaque thème teinte toute l’interface (fond, surfaces, lignes, accent) à partir d’une teinte. */
const tint = (h: number, s: number, l: number, dl: number) => ({
  light: `
  --pb-bg:hsl(${h} ${s * 0.45}% 98.6%); --pb-surface:hsl(${h} ${s * 0.34}% 95.2%); --pb-surface-2:hsl(${h} ${s * 0.3}% 91%);
  --pb-ink:hsl(${h} ${s * 0.2}% 10.5%); --pb-muted:hsl(${h} ${s * 0.1}% 40%); --pb-line:hsl(${h} ${s * 0.26}% 88.5%);
  --pb-accent:hsl(${h} ${s}% ${l}%); --pb-accent-soft:hsl(${h} ${s * 0.6}% 91.5%); --pb-on-accent:#FFFFFF;
  --pb-hero:linear-gradient(180deg,hsl(${h} ${s * 0.62}% 87%) 0%,hsl(${h} ${s * 0.5}% 94.5%) 50%,hsl(${h} ${s * 0.45}% 98.6%) 100%);
  --pb-glass:hsl(${h} ${s * 0.4}% 99.2% / .84);
  ${semantic.light}`,
  dark: `
  --pb-bg:hsl(${h} ${s * 0.22}% 6%); --pb-surface:hsl(${h} ${s * 0.18}% 10.5%); --pb-surface-2:hsl(${h} ${s * 0.16}% 15%);
  --pb-ink:hsl(${h} ${s * 0.12}% 95.5%); --pb-muted:hsl(${h} ${s * 0.08}% 64%); --pb-line:hsl(${h} ${s * 0.16}% 18%);
  --pb-accent:hsl(${h} ${Math.min(s, 72)}% ${dl}%); --pb-accent-soft:hsl(${h} ${s * 0.45}% 15.5%); --pb-on-accent:hsl(${h} ${s * 0.5}% 8%);
  --pb-hero:linear-gradient(180deg,hsl(${h} ${s * 0.5}% 16%) 0%,hsl(${h} ${s * 0.32}% 9%) 55%,hsl(${h} ${s * 0.22}% 6%) 100%);
  --pb-glass:hsl(${h} ${s * 0.2}% 8% / .84);
  ${semantic.dark}`,
});
const base = tint(PALETTES[0].h, PALETTES[0].s, PALETTES[0].l, PALETTES[0].dl);
const light = base.light, dark = base.dark;
const paletteCss = PALETTES.slice(1).map((p) => {
  const t = tint(p.h, p.s, p.l, p.dl);
  return `:root[data-palette="${p.id}"]{${t.light}}
  @media (prefers-color-scheme: dark){ :root[data-palette="${p.id}"]:not([data-theme="light"]){${t.dark}} }
  :root[data-palette="${p.id}"][data-theme="dark"]{${t.dark}}`;
}).join("\n");

/* ---------- Style « Pixel » (test) : matrice de points, noir et blanc, une seule touche de rouge ---------- */
const dots = (c: string, bg: string) =>
  `linear-gradient(180deg, transparent 35%, ${bg} 100%), radial-gradient(circle, ${c} 1.1px, transparent 1.6px) 0 0/9px 9px ${bg}`;
const pixelLight = `
  --pb-bg:#FFFFFF; --pb-surface:#F1F1F1; --pb-surface-2:#E2E2E2; --pb-ink:#0A0A0A; --pb-muted:#5C5C5C; --pb-line:#D9D9D9;
  --pb-accent:#D71921; --pb-accent-soft:#FBE4E6; --pb-on-accent:#FFFFFF; --pb-income:#0A0A0A;
  --pb-gold:#0A0A0A; --pb-gold-soft:#F1F1F1; --pb-gold-ink:#D71921; --pb-danger:#D71921; --pb-danger-soft:#FBE4E6;
  --pb-hero:${dots("#C4C4C4", "#FFFFFF")}; --pb-glass:rgba(255,255,255,.88); --pb-scrim:rgba(0,0,0,.5);
  --cat-l:92%; --cat-s:0%; --cat-fl:8%; --cat-fs:0%; color-scheme:light;`;
const pixelDark = `
  --pb-bg:#000000; --pb-surface:#121212; --pb-surface-2:#222222; --pb-ink:#FFFFFF; --pb-muted:#9C9C9C; --pb-line:#262626;
  --pb-accent:#FF3B45; --pb-accent-soft:#3A0D10; --pb-on-accent:#000000; --pb-income:#FFFFFF;
  --pb-gold:#FFFFFF; --pb-gold-soft:#121212; --pb-gold-ink:#FF3B45; --pb-danger:#FF3B45; --pb-danger-soft:#3A0D10;
  --pb-hero:${dots("#3A3A3A", "#000000")}; --pb-glass:rgba(0,0,0,.86); --pb-scrim:rgba(0,0,0,.7);
  --cat-l:15%; --cat-s:0%; --cat-fl:96%; --cat-fs:0%; color-scheme:dark;`;
const PX = ':root[data-style="pixel"]';
const pixelCss = `
  ${PX}[data-style]{ ${pixelLight}
    --pb-font-display:"Doto","Space Mono",ui-monospace,monospace;
    --pb-font-label:"Space Mono",ui-monospace,"SFMono-Regular",Menlo,monospace; }
  @media (prefers-color-scheme: dark){ ${PX}[data-style]:not([data-theme="light"]){ ${pixelDark} } }
  ${PX}[data-style][data-theme="dark"]{ ${pixelDark} }
  /* petites étiquettes en capitales mono */
  ${PX} :is(.l, .lbl, .m, label, nav button){ font-family:var(--pb-font-label); text-transform:uppercase; letter-spacing:.04em; font-size:11px; }
  ${PX} :is(h1, h2, h3){ text-transform:uppercase; letter-spacing:0; }
  /* les petits montants restent lisibles : mono gras plutôt que points */
  ${PX} .v{ font-family:var(--pb-font-label); font-weight:700; letter-spacing:-.02em; }
  /* barres de progression segmentées */
  ${PX} .pb-track{ height:8px; border-radius:0; background:repeating-linear-gradient(90deg, var(--pb-surface-2) 0 4px, transparent 4px 7px); }
  ${PX} .pb-fill{ border-radius:0; background:repeating-linear-gradient(90deg, var(--pb-ink) 0 4px, transparent 4px 7px); }
  ${PX} .pb-fill[data-tone="over"]{ background:repeating-linear-gradient(90deg, var(--pb-accent) 0 4px, transparent 4px 7px); }
  /* colonnes du graphique en points */
  ${PX} .col .b{ border-radius:0; max-width:36px; background:radial-gradient(circle, var(--pb-muted) 1.7px, transparent 2.1px) 0 100%/6px 6px; opacity:.55; }
  ${PX} .col .b.cur{ background:radial-gradient(circle, var(--pb-accent) 1.9px, transparent 2.3px) 0 100%/6px 6px; opacity:1; }
  ${PX} .pb-success{ background:var(--pb-ink); }
`;

export const GlobalStyle = createGlobalStyle`
  :root{
    ${light}
    --pb-font-display:"Manrope", "Inter", system-ui, -apple-system, "Segoe UI", sans-serif;
    --pb-font-ui:"Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    --pb-r-sm:12px; --pb-r-md:20px; --pb-r-lg:28px; --pb-pill:999px;
    --pb-ease:cubic-bezier(.2,.8,.2,1);
    --pb-font-label:var(--pb-font-ui);
  }
  @media (prefers-color-scheme: dark){ :root:not([data-theme="light"]){ ${dark} } }
  :root[data-theme="dark"]{ ${dark} }
  ${paletteCss}
  ${pixelCss}

  *,*::before,*::after{ box-sizing:border-box; }
  html{ -webkit-text-size-adjust:100%; }
  html,body{ margin:0; min-height:100%; background:var(--pb-bg); }
  body{
    color:var(--pb-ink); font-family:var(--pb-font-ui); font-size:16px; line-height:1.45;
    -webkit-font-smoothing:antialiased; -webkit-tap-highlight-color:transparent;
  }
  button,input,select{ font:inherit; color:inherit; }
  button{ cursor:pointer; background:none; border:0; padding:0; }
  input{ outline:none; }
  :focus-visible{ outline:2px solid var(--pb-accent); outline-offset:2px; border-radius:12px; }
  .num{ font-variant-numeric:tabular-nums; }
  /* Impression / PDF du rapport : uniquement le document, en clair */
  @media print{
    :root:root:root:root{ ${light} }
    html,body{ background:#fff !important; }
    *{ -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    .no-print{ display:none !important; }
    main > div{ padding:0 !important; max-width:none !important; }
    .report{ border:0 !important; padding:0 !important; }
    @page{ margin:14mm; }
    tr{ break-inside:avoid; }
  }
  @media (prefers-reduced-motion: reduce){ *{ animation:none !important; transition:none !important; } }
`;
