"use client";
import React, { useEffect } from "react";
import styled from "styled-components";
import { AnimatePresence, motion, PanInfo, useDragControls } from "framer-motion";
import { Delete, X } from "lucide-react";
import { RoundButton } from "./ui";

/* ---------- Feuille (bottom sheet) avec geste de fermeture ---------- */
const Scrim = styled(motion.div)`
  position:fixed; inset:0; z-index:50; background:var(--pb-scrim);
  display:flex; align-items:flex-end; justify-content:center;
  @media (min-width:700px){ align-items:center; padding:24px; }
`;
const Panel = styled(motion.div)`
  width:100%; max-width:480px; max-height:94dvh; overflow:auto; overscroll-behavior:contain;
  background:var(--pb-bg); border-radius:28px 28px 0 0;
  padding:8px 20px calc(20px + env(safe-area-inset-bottom,0px));
  @media (min-width:700px){ border-radius:28px; padding-bottom:24px; }
`;
const Grab = styled.div`
  touch-action:none; cursor:grab;
  width:40px; height:5px; border-radius:9px; background:var(--pb-surface-2); margin:4px auto 10px;
  @media (min-width:700px){ display:none; }
`;
const Head = styled.div`
  touch-action:none;
  display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:16px;
  h3{ margin:0; font-family:var(--pb-font-display); font-weight:600; font-size:21px; letter-spacing:-.01em; }
`;

export function Sheet({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    const prev = document.body.style.overflow; document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", k); document.body.style.overflow = prev; };
  }, [open, onClose]);

  const controls = useDragControls();
  const startDrag = (e: React.PointerEvent) => controls.start(e);
  const onDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.y > 120 || info.velocity.y > 600) onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <Scrim key="scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={(e) => e.target === e.currentTarget && onClose()}>
          <Panel role="dialog" aria-modal="true" aria-label={title}
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 420, damping: 40 }}
            drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.6 }}
            dragControls={controls} dragListener={false} onDragEnd={onDragEnd}>
            <Grab onPointerDown={startDrag} />
            <Head onPointerDown={startDrag}>
              <h3>{title}</h3>
              <RoundButton $size={36} onClick={onClose} aria-label="Fermer"><X size={18} /></RoundButton>
            </Head>
            {children}
          </Panel>
        </Scrim>
      )}
    </AnimatePresence>
  );
}

/* ---------- Pavé numérique façon appli bancaire ---------- */
const Pad = styled.div`
  display:grid; grid-template-columns:repeat(3,1fr); gap:6px; margin:6px 0 14px;
`;
const Key = styled(motion.button)`
  height:54px; border-radius:16px; font-family:var(--pb-font-display); font-size:24px; font-weight:500;
  display:grid; place-items:center; color:var(--pb-ink);
  @media (hover:hover){ &:hover{ background:var(--pb-surface); } }
`;
export function pushKey(value: string, key: string) {
  if (key === "back") return value.slice(0, -1);
  if (key === ",") return value.includes(",") ? value : (value || "0") + ",";
  const [int, dec] = value.split(",");
  if (dec !== undefined && dec.length >= 2) return value;
  if (dec === undefined && int.replace(/\s/g, "").length >= 7) return value;
  if (value === "0") return key;
  return value + key;
}
export function Keypad({ onKey }: { onKey: (k: string) => void }) {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ",", "0", "back"];
  return (
    <Pad>
      {keys.map((k) => (
        <Key key={k} whileTap={{ scale: 0.88 }}
          onClick={() => onKey(k)} aria-label={k === "back" ? "Effacer" : k}>
          {k === "back" ? <Delete size={22} /> : k}
        </Key>
      ))}
    </Pad>
  );
}

/* ---------- Toast ---------- */
const ToastBox = styled(motion.div)`
  position:fixed; left:50%; z-index:70; bottom:calc(100px + env(safe-area-inset-bottom,0px));
  background:var(--pb-ink); color:var(--pb-bg); padding:12px 18px; border-radius:var(--pb-pill);
  font-weight:500; font-size:14px; max-width:90vw; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
  @media (min-width:900px){ bottom:32px; }
`;
export function Toast({ toast }: { toast: { id: number; msg: string } | null }) {
  return (
    <AnimatePresence>
      {toast && (
        <ToastBox key={toast.id} role="status" initial={{ opacity: 0, y: 16, x: "-50%" }}
          animate={{ opacity: 1, y: 0, x: "-50%" }} exit={{ opacity: 0, y: 8, x: "-50%" }}
          transition={{ type: "spring", stiffness: 500, damping: 34 }}>
          {toast.msg}
        </ToastBox>
      )}
    </AnimatePresence>
  );
}

/* ---------- Animation de succès (coche qui se dessine) ---------- */
const SuccessWrap = styled(motion.div)`
  position:fixed; inset:0; z-index:80; display:grid; place-items:center; pointer-events:none;
`;
const Circle = styled(motion.div)`
  width:96px; height:96px; border-radius:50%; background:var(--pb-accent); display:grid; place-items:center;
`;
export function Success({ tick }: { tick: number }) {
  const [show, setShow] = React.useState(false);
  useEffect(() => {
    if (!tick) return;
    setShow(true);
    const t = setTimeout(() => setShow(false), 900);
    return () => clearTimeout(t);
  }, [tick]);
  return (
    <AnimatePresence>
      {show && (
        <SuccessWrap key={tick} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <Circle initial={{ scale: 0.4 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}
            transition={{ type: "spring", stiffness: 420, damping: 18 }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <motion.path d="M5 12.5l4.5 4.5L19 7.5" stroke="var(--pb-on-accent)" strokeWidth="2.6"
                strokeLinecap="round" strokeLinejoin="round"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.12, duration: 0.35 }} />
            </svg>
          </Circle>
        </SuccessWrap>
      )}
    </AnimatePresence>
  );
}
