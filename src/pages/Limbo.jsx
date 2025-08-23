import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../state/WalletProvider";

export default function Limbo() {
  const navigate = useNavigate();
  const { balance, debit, credit } = useWallet();

  const [bet, setBet] = useState(100);
  const [target, setTarget] = useState(2.0);
  const [status, setStatus] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  const [displayMult, setDisplayMult] = useState(1.0);
  const crashRef = useRef(1.0);
  const rafRef = useRef(null);
  const startTsRef = useRef(0);

  // Stake-based Limbo odds
  const genCrash = (betAmount, maxMultiplier = 10) => {
    const minMult = 1.01;

    // Base random
    let r = Math.random();

    // Exponential distribution for Limbo-style odds
    const exponent = 3;
    r = Math.pow(r, exponent);

    // Scale with stake risk (higher bet slightly reduces crash)
    const riskFactor = betAmount / (balance || 1);
    const shaped = Math.pow(r, 1 + riskFactor * 0.8);

    const val = minMult + shaped * (maxMultiplier - minMult);
    return Math.max(minMult, +val.toFixed(2));
  };

  const play = () => {
    const b = Number(bet);
    const t = Number(target);

    if (!Number.isFinite(b) || b <= 0) return setStatus("Enter a valid bet.");
    if (!Number.isFinite(t) || t < 1.01) return setStatus("Target must be ≥ 1.01.");
    if (b > balance) return setStatus("Insufficient balance.");

    debit(b);
    crashRef.current = genCrash(b);
    setIsRunning(true);
    setStatus("Rolling…");
    setDisplayMult(1.0);

    startTsRef.current = performance.now();
    rafRef.current && cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
  };

  const ease = (x) => 1 - Math.pow(1 - x, 3);

  const tick = (ts) => {
    const durationMs = 1900 + (crashRef.current - 1) * 180;
    const t = Math.min(1, (ts - startTsRef.current) / durationMs);
    const eased = ease(t);
    const next = 1 + (crashRef.current - 1) * eased;

    setDisplayMult(+next.toFixed(2));

    if (t < 1) {
      rafRef.current = requestAnimationFrame(tick);
    } else {
      setIsRunning(false);
      const won = crashRef.current >= Number(target);
      if (won) {
        const payout = Math.floor(bet * Number(target));
        credit(payout);
        setStatus(`✅ Win! Rolled x${crashRef.current.toFixed(2)} | Paid ${payout}.`);
      } else {
        setStatus(`❌ Bust at x${crashRef.current.toFixed(2)} — bet lost.`);
      }
    }
  };

  useEffect(() => {
    return () => rafRef.current && cancelAnimationFrame(rafRef.current);
  }, []);

  const css = `
    .limbo-wrap { display:flex; flex-direction:column; align-items:center; gap:16px; padding:18px; color:#eee; }
    .limbo-row { display:flex; gap:12px; align-items:center; flex-wrap:wrap; }
    .box { padding:10px 14px; border:1px solid #444; border-radius:10px; background:#141414; }
    .big-mult { font-size:64px; font-weight:800; letter-spacing:1px; }
    .target-pill { font-weight:700; padding:6px 10px; border-radius:999px; background:#1f2a1f; border:1px solid #305030; }
    .btn { padding:10px 14px; border-radius:10px; border:0; cursor:pointer; }
    .btn-primary { background:#22aa55; color:white; font-weight:700; }
    .btn-ghost { background:transparent; color:#ddd; border:1px solid #444; }
    .status { min-height:22px; color:#bbb; }
    .input { background:#0d0d0d; color:#eee; border:1px solid #333; padding:8px 10px; border-radius:8px; width:120px; }
    .meter { width: 320px; height: 8px; background:#222; border-radius:999px; overflow:hidden; }
    .meter > div { height:100%; width:0%; background:#2bd77f; transition: width 60ms linear; }
    @media (max-width:600px){ .big-mult{ font-size:44px; } .meter{ width: 260px; } }
  `;

  const pct = Math.min(100, ((displayMult - 1) / (crashRef.current - 1 || 1)) * 100);

  return (
    <div className="limbo-wrap">
      <style>{css}</style>

      <h1>🎲 Limbo</h1>
      <div className="limbo-row">
        <div className="box">Balance: <strong>${balance}</strong></div>
        <div className="box">Target: <span className="target-pill">x{Number(target).toFixed(2)}</span></div>
      </div>

      <div className="big-mult">x{displayMult.toFixed(2)}</div>
      <div className="meter"><div style={{ width: isRunning ? `${pct}%` : "0%" }} /></div>

      <div className="limbo-row">
        <label className="box">
          Bet: $
          <input
            className="input"
            type="number"
            min="1"
            value={bet}
            onChange={(e) => setBet(Number(e.target.value))}
            disabled={isRunning}
          />
        </label>
        <label className="box">
          Target:
          <input
            className="input"
            type="number"
            min="1.01"
            step="0.01"
            value={target}
            onChange={(e) => setTarget(Number(e.target.value))}
            disabled={isRunning}
          />
        </label>
        <button className="btn btn-primary" disabled={isRunning} onClick={play}>
          {isRunning ? "Rolling…" : "Play"}
        </button>
        <button className="btn btn-ghost" disabled={isRunning} onClick={() => setStatus("")}>
          Clear
        </button>
        <button className="btn btn-ghost" disabled={isRunning} onClick={() => navigate("/")}>
          ⬅ Dashboard
        </button>
      </div>

      <div className="status" aria-live="polite">{status}</div>
    </div>
  );
}
