"use client";
import { createGlobalStyle } from "styled-components";

/**
 * Design tokens PolyBudget (--pb-*), inspirés de la grammaire Revolut :
 * interface monochrome et plate (zéro ombre), boutons pilule, titres en graisse 500,
 * et une seule couleur d’accent : le vert PolyBudget, avec l’or pour les moments positifs.
 */
const light = `
  --pb-bg:#FFFFFF; --pb-surface:#F4F6F5; --pb-surface-2:#E9EDEB; --pb-ink:#191C1F; --pb-muted:#6B7270; --pb-line:#E3E7E5;
  --pb-accent:#0A7A50; --pb-accent-strong:#06603E; --pb-accent-soft:#E2F4EA; --pb-on-accent:#FFFFFF;
  --pb-gold:#F2B705; --pb-gold-soft:#FFF4CC; --pb-gold-ink:#7A5200;
  --pb-income:#0A7A50; --pb-danger:#E23B4A; --pb-danger-soft:#FDE8EA; --pb-warning:#EC7E00;
  --pb-hero:linear-gradient(180deg,#D7F1E3 0%,#EDF9F2 48%,#FFFFFF 100%);
  --pb-scrim:rgba(25,28,31,.42); --pb-glass:rgba(255,255,255,.82);
  --cat-l:92%; --cat-s:72%; --cat-fl:30%; --cat-fs:62%;
  color-scheme:light;
`;
const dark = `
  --pb-bg:#0E1013; --pb-surface:#191C1F; --pb-surface-2:#23272B; --pb-ink:#F3F5F4; --pb-muted:#9BA29F; --pb-line:#2A2F33;
  --pb-accent:#3DD68C; --pb-accent-strong:#62E3A4; --pb-accent-soft:#143526; --pb-on-accent:#052114;
  --pb-gold:#FFC83D; --pb-gold-soft:#3A2F10; --pb-gold-ink:#FFD66B;
  --pb-income:#4ADE94; --pb-danger:#FF6B76; --pb-danger-soft:#3A1A1E; --pb-warning:#FFA23D;
  --pb-hero:linear-gradient(180deg,#11382A 0%,#0F1B16 55%,#0E1013 100%);
  --pb-scrim:rgba(0,0,0,.6); --pb-glass:rgba(14,16,19,.82);
  --cat-l:22%; --cat-s:38%; --cat-fl:78%; --cat-fs:78%;
  color-scheme:dark;
`;

export const GlobalStyle = createGlobalStyle`
  :root{
    ${light}
    --pb-font-display:"Manrope", "Inter", system-ui, -apple-system, "Segoe UI", sans-serif;
    --pb-font-ui:"Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    --pb-r-sm:12px; --pb-r-md:20px; --pb-r-lg:28px; --pb-pill:999px;
    --pb-ease:cubic-bezier(.2,.8,.2,1);
  }
  @media (prefers-color-scheme: dark){ :root:not([data-theme="light"]){ ${dark} } }
  :root[data-theme="dark"]{ ${dark} }

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
    :root, :root[data-theme="dark"]{ ${light} }
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
