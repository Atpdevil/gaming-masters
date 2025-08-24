import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../state/WalletProvider";

const SUITS = ["♠", "♥", "♦", "♣"];
const VALUES = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];

const scoreHand = (hand) => {
  let total = 0, aces = 0;
  for (const c of hand) {
    if (c.v === "A") { total += 11; aces++; }
    else if (["K","Q","J"].includes(c.v)) total += 10;
    else total += Number(c.v);
  }
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return total;
};

const newDeck = () => {
  const d = [];
  for (const s of SUITS) for (const v of VALUES) d.push({ s, v });
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
};

export default function Blackjack() {
  const navigate = useNavigate();
  const { balance, debit, credit } = useWallet();

  const [bet, setBet] = useState(100);
  const [deck, setDeck] = useState([]);
  const [player, setPlayer] = useState([]);
  const [dealer, setDealer] = useState([]);
  const [done, setDone] = useState(true);
  const [status, setStatus] = useState("");
  const [chipPulse, setChipPulse] = useState(false);
  const [hiddenDealer, setHiddenDealer] = useState(true);

  const deal = () => {
    const b = Number(bet);
    if (!Number.isFinite(b) || b <= 0) return setStatus("Enter a valid bet.");
    if (b > balance) return setStatus("Insufficient balance.");
    debit(b);
    setChipPulse(true);
    setTimeout(() => setChipPulse(false), 350);

    const d = newDeck();
    setDeck(d);
    const pHand = [d.pop(), d.pop()];
    const dHand = [d.pop(), d.pop()];
    setPlayer([pHand]);
    setDealer(dHand);
    setHiddenDealer(true);
    setDone(false);
    setStatus("Your move.");
  };

  const hit = (handIndex=0) => {
    if (done) return;
    const d = [...deck];
    if (!d.length) return;
    const newCard = d.pop();
    const newPlayer = [...player];
    newPlayer[handIndex] = [...newPlayer[handIndex], newCard];
    setPlayer(newPlayer);
    setDeck(d);
    if (scoreHand(newPlayer[handIndex]) > 21) setStatus("Bust!");
  };

  const stand = () => {
    if (done) return;
    setHiddenDealer(false);
    let dHand = [...dealer];
    let d = [...deck];
    while (scoreHand(dHand) < 17 && d.length) dHand.push(d.pop());
    setDealer(dHand);
    setDeck(d);

    let totalWin = 0;
    let message = "";
    player.forEach(h => {
      const ps = scoreHand(h);
      const ds = scoreHand(dHand);
      if (ps > 21) message += "❌ Bust. ";
      else if (ds > 21 || ps > ds) {
        message += "✅ You win! ";
        totalWin += bet*2;
      } else if (ps < ds) message += "❌ Dealer wins. ";
      else {
        message += "➖ Push. ";
        totalWin += bet;
      }
    });
    if (totalWin > 0) credit(totalWin);
    setStatus(message + (totalWin ? `Paid ${totalWin}.` : ""));
    setDone(true);
  };

  const double = (handIndex=0) => {
    if (done) return;
    const b = bet;
    if (b > balance) return setStatus("Insufficient balance to double.");
    debit(b);
    const newPlayer = [...player];
    newPlayer[handIndex] = [...newPlayer[handIndex], deck.pop()];
    setPlayer(newPlayer);
    setDeck(deck);
    stand();
  };

  const split = () => {
    if (done) return;
    const firstHand = player[0];
    if (firstHand.length !== 2 || firstHand[0].v !== firstHand[1].v) {
      return setStatus("Can only split identical cards.");
    }
    if (bet > balance) return setStatus("Insufficient balance to split.");
    debit(bet);
    const d = [...deck];
    const newHands = [[firstHand[0], d.pop()], [firstHand[1], d.pop()]];
    setPlayer(newHands);
    setDeck(d);
  };

  const reset = () => {
    setDeck([]);
    setPlayer([]);
    setDealer([]);
    setDone(true);
    setStatus("");
    setHiddenDealer(true);
  };

  // Bigger cards
  const cardStyle = { width: "110px", height: "160px", fontSize:"2.6rem" };

  const css = `
    .bj-wrap{
      display:flex;
      flex-direction:column;
      align-items:center;
      gap:12px;
      padding:18px;
      color:#eee;
    }
    .row{
      display:flex;
      gap:12px;
      align-items:center;
      flex-wrap:wrap;
    }
    .chips{
      padding:8px 12px;
      border:1px solid #333;
      border-radius:10px;
      background:#121212;
      position:relative;
    }
    .chip-dot{
      position:absolute;
      right:-8px;
      top:-8px;
      width:12px;
      height:12px;
      border-radius:999px;
      background:#2bd77f;
      opacity:0;
      transform:scale(0.6);
      transition: all .25s ease;
    }
    .chip-dot.on{
      opacity:1;
      transform:scale(1);
    }
    .cards{
      display:flex;
      gap:12px;
      justify-content:center;
    }
    .card{
      ${Object.entries(cardStyle).map(([k,v])=>`${k}:${v};`).join("")}
      border-radius:8px;
      background:#fff;
      color:#111;
      display:flex;
      align-items:center;
      justify-content:center;
      font-weight:800;
      box-shadow:0 2px 12px rgba(0,0,0,.5);
    }
    .btn{
      padding:10px 14px;
      border-radius:10px;
      border:0;
      cursor:pointer;
    }
    .btn-primary{
      background:#22aa55;
      color:#fff;
      font-weight:700;
    }
    .btn-ghost{
      background:transparent;
      color:#ddd;
      border:1px solid #444;
    }
    .input{
      background:#0d0d0d;
      color:#eee;
      border:1px solid #333;
      padding:8px 10px;
      border-radius:8px;
      width:120px;
    }
  `;

  return (
    <div className="bj-wrap">
      <style>{css}</style>
      <h1>🂡 Blackjack</h1>

      {/* Moved dealer + player ABOVE controls */}
      <div className="row" style={{ flexDirection:"column", alignItems:"center", gap:"20px" }}>
        <div>
          <div style={{marginBottom:6}}>
            Dealer ({hiddenDealer ? "?" : scoreHand(dealer)}):
          </div>
          <div className="cards">
            {dealer.map((c,i)=>(
              <div key={i} className="card">
                {i===0 || !hiddenDealer ? `${c.v}${c.s}` : "🂠"}
              </div>
            ))}
          </div>
        </div>

        <div>
          {player.map((hand,index)=>(
            <div key={index} style={{marginTop:index ? 12 : 0}}>
              <div style={{marginBottom:6}}>
                You ({scoreHand(hand)}):
              </div>
              <div className="cards">
                {hand.map((c,i)=><div key={i} className="card">{c.v}{c.s}</div>)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Controls below */}
      <div className="row">
        <div className="chips">
          Balance: <strong>${balance}</strong>
          <span className={`chip-dot ${chipPulse ? "on" : ""}`} />
        </div>
        <label>
          Bet: $ <input className="input" type="number" min="1" value={bet} onChange={(e)=>setBet(Number(e.target.value))} disabled={!done} />
        </label>
      </div>

      <div className="row">
        <button className="btn btn-primary" onClick={deal} disabled={!done}>Deal</button>
        <button className="btn btn-ghost" onClick={()=>hit(0)} disabled={done}>Hit</button>
        <button className="btn btn-ghost" onClick={stand} disabled={done}>Stand</button>
        <button className="btn btn-ghost" onClick={()=>double(0)} disabled={done}>Double</button>
        <button className="btn btn-ghost" onClick={split} disabled={done}>Split</button>
        <button className="btn btn-ghost" onClick={reset}>Reset</button>
        <button className="btn btn-ghost" onClick={()=>navigate("/")}>⬅ Dashboard</button>
      </div>

      <div style={{ color:"#bbb", minHeight:22 }}>{status}</div>
    </div>
  );
}
