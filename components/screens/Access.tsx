"use client";
import React, { useState } from "react";
import styled from "styled-components";
import { motion } from "framer-motion";
import { KeyRound, Lock, Mail, MailCheck } from "lucide-react";
import { useStore } from "@/lib/store";
import { PillButton, Segmented } from "../ui";

/* ---------- Mise en page commune aux écrans d’accès ---------- */
const Wrap = styled.div`
  min-height:100dvh; display:flex; flex-direction:column; background:var(--pb-hero);
  padding:calc(24px + env(safe-area-inset-top,0px)) 24px calc(28px + env(safe-area-inset-bottom,0px));
  .center{ flex:1; display:flex; flex-direction:column; justify-content:center; max-width:420px; width:100%; margin:0 auto; }
  h1{ font-family:var(--pb-font-display); font-weight:500; font-size:40px; letter-spacing:-.035em; line-height:1.04; margin:24px 0 12px; }
  p.lead{ color:var(--pb-muted); font-size:16px; margin:0 0 22px; }
  .err{ color:var(--pb-danger); font-size:14px; margin:12px 4px 0; }
  .muted{ color:var(--pb-muted); font-size:14px; text-align:center; margin-top:14px; }
`;
const Logo = styled(motion.div)`
  width:60px; height:60px; border-radius:19px; background:var(--pb-ink); display:flex; align-items:flex-end; justify-content:center; gap:5px; padding:13px;
  i{ width:8px; border-radius:3px; background:var(--pb-accent); display:block; }
  i:last-child{ background:var(--pb-gold); }
`;
function BrandMark() {
  return (
    <Logo initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
      {[13, 21, 32].map((h, i) => <motion.i key={i} initial={{ height: 0 }} animate={{ height: h }} transition={{ delay: 0.15 + i * 0.1, type: "spring", stiffness: 260, damping: 18 }} />)}
    </Logo>
  );
}
const Field = styled.label`
  position:relative; display:block; margin-top:10px;
  svg{ position:absolute; left:16px; top:50%; transform:translateY(-50%); color:var(--pb-muted); pointer-events:none; }
  input{ width:100%; height:52px; border:0; border-radius:var(--pb-pill); background:var(--pb-bg); color:var(--pb-ink);
         padding:0 18px 0 46px; font-size:16px; }
  input::placeholder{ color:var(--pb-muted); }
  input:focus{ box-shadow:inset 0 0 0 2px var(--pb-accent); }
`;
const Or = styled.div`
  display:flex; align-items:center; gap:12px; color:var(--pb-muted); font-size:13px; margin:18px 0;
  &::before, &::after{ content:""; flex:1; height:1px; background:var(--pb-line); }
`;
const Link = styled.button` color:var(--pb-accent); font-weight:600; font-size:14px; padding:6px 4px; `;

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
);

/* ====================== Connexion / inscription ====================== */
export function Login() {
  const { signIn, signInEmail, signUpEmail, resetPassword, authError, setAuthError, authBusy } = useStore();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState(""); const [pw, setPw] = useState(""); const [code, setCode] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "in") signInEmail(email, pw); else signUpEmail(email, pw, code);
  };

  return (
    <Wrap>
      <div className="center">
        <BrandMark />
        <h1>Ton argent,<br />enfin clair.</h1>
        <p className="lead">{mode === "in" ? "Connecte-toi pour retrouver tes dépenses, tes budgets et tes objectifs." : "PolyBudget est en test privé : il te faut un code d’invitation pour créer ton compte."}</p>

        <Segmented id="authmode" value={mode} onChange={(v) => { setMode(v); setAuthError(""); }} options={[["in", "Se connecter"], ["up", "Créer un compte"]]} />

        <form onSubmit={submit} style={{ marginTop: 8 }}>
          <Field><Mail size={18} /><input type="email" autoComplete="email" placeholder="Adresse e-mail" value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
          <Field><Lock size={18} /><input type="password" autoComplete={mode === "in" ? "current-password" : "new-password"} placeholder={mode === "in" ? "Mot de passe" : "Mot de passe (8 caractères min.)"} value={pw} onChange={(e) => setPw(e.target.value)} required minLength={mode === "up" ? 8 : undefined} /></Field>
          {mode === "up" && <Field><KeyRound size={18} /><input autoCapitalize="characters" autoComplete="off" placeholder="Code d’invitation" value={code} onChange={(e) => setCode(e.target.value)} required /></Field>}
          <div style={{ marginTop: 14 }}>
            <PillButton type="submit" $variant="accent" $block $size="lg" disabled={authBusy}>
              {authBusy ? "Un instant…" : mode === "in" ? "Se connecter" : "Créer mon compte"}
            </PillButton>
          </div>
        </form>
        {authError && <div className="err" role="alert">{authError}</div>}
        {mode === "in" && <div style={{ textAlign: "center", marginTop: 8 }}><Link type="button" onClick={() => resetPassword(email)}>Mot de passe oublié ?</Link></div>}

        <Or>ou</Or>
        <PillButton $variant="primary" $block $size="lg" onClick={signIn} disabled={authBusy}><GoogleIcon />Continuer avec Google</PillButton>
        {mode === "up" && <div className="muted">Avec Google, ton code d’invitation te sera demandé juste après.</div>}
      </div>
    </Wrap>
  );
}

/* ====================== Vérification de l’e-mail ====================== */
export function VerifyEmail() {
  const { user, checkVerified, resendVerification, logout, authError, authBusy } = useStore();
  return (
    <Wrap>
      <div className="center">
        <Logo as="div" style={{ alignItems: "center", padding: 0 }}><MailCheck size={30} color="var(--pb-bg)" /></Logo>
        <h1>Vérifie ton e-mail</h1>
        <p className="lead">Un lien de confirmation a été envoyé à <b style={{ color: "var(--pb-ink)" }}>{user?.email}</b>. Clique dessus, puis reviens ici. Pense à regarder dans tes spams.</p>
        <PillButton $variant="accent" $block $size="lg" onClick={checkVerified} disabled={authBusy}>{authBusy ? "Vérification…" : "J’ai cliqué sur le lien"}</PillButton>
        {authError && <div className="err" role="alert">{authError}</div>}
        <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 14 }}>
          <Link type="button" onClick={resendVerification}>Renvoyer l’e-mail</Link>
          <Link type="button" onClick={logout} style={{ color: "var(--pb-muted)" }}>Changer de compte</Link>
        </div>
      </div>
    </Wrap>
  );
}

/* ====================== Code d’invitation (comptes Google ou membres retirés) ====================== */
export function InviteGate() {
  const { user, redeemCode, logout, authError, authBusy } = useStore();
  const [code, setCode] = useState("");
  return (
    <Wrap>
      <div className="center">
        <BrandMark />
        <h1>Encore une étape</h1>
        <p className="lead">PolyBudget est en test privé. Entre le code d’invitation qu’on t’a donné pour activer le compte <b style={{ color: "var(--pb-ink)" }}>{user?.email}</b>.</p>
        <form onSubmit={(e) => { e.preventDefault(); redeemCode(code); }}>
          <Field><KeyRound size={18} /><input autoCapitalize="characters" autoComplete="off" placeholder="Code d’invitation" value={code} onChange={(e) => setCode(e.target.value)} required /></Field>
          <div style={{ marginTop: 14 }}>
            <PillButton type="submit" $variant="accent" $block $size="lg" disabled={authBusy}>{authBusy ? "Vérification…" : "Activer mon compte"}</PillButton>
          </div>
        </form>
        {authError && <div className="err" role="alert">{authError}</div>}
        <div style={{ textAlign: "center", marginTop: 12 }}><Link type="button" onClick={logout} style={{ color: "var(--pb-muted)" }}>Changer de compte</Link></div>
      </div>
    </Wrap>
  );
}
