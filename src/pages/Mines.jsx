import React, { useMemo, useState } from "react";
import { useWallet } from "../state/WalletProvider";
import { useNavigate } from "react-router-dom";

export default function Mines() {
  const { balance, debit, credit } = useWallet();
  const navigate = useNavigate();
  const GRID_SIZE = 5; // 5x5
  const TOTAL_TILES = GRID_SIZE * GRID_SIZE;

  const [bet, setBet] = useState(100);
  const [grid, setGrid] = useState([]); // 'safe' | 'mine'
  const [revealed, setRevealed] = useState([]); // indices revealed
  const [playing, setPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [status, setStatus] = useState(""); // inline messages
  const [multiplier, setMultiplier] = useState(1);
  const [picks, setPicks] = useState(0); // number of safe picks made
  const [canCashout, setCanCashout] = useState(false);
  const [isRunning] = useState(false);
  const [minesCount, setMinesCount] = useState(5); // allow user to pick mines

  const potentialPayout = Math.floor(bet * multiplier);

  // --- Hardcoded multiplier tables ---
  const multiplierTables = {
    1: [1.03, 1.08, 1.12, 1.18, 1.24, 1.3, 1.37, 1.46, 1.55, 1.65, 1.77, 1.9, 2.06, 2.25, 2.47, 2.75, 3.09, 3.54, 4.12, 4.95, 6.19, 8.25, 12.37, 24.75],
    2: [1.08, 1.17, 1.29, 1.41, 1.56, 1.74, 1.94, 2.18, 2.47, 2.83, 3.26, 3.81, 4.5, 5.4, 6.6, 8.25, 10.61, 14.14, 19.8, 29.7, 49.5, 99, 297],
    3: [1.12, 1.29, 1.48, 1.71, 2, 2.35, 2.79, 3.35, 4.07, 5, 6.26, 7.96, 10.35, 13.8, 18.97, 27.11, 40.66, 65.06, 113.85, 227.7, 596.25, 2277],
    4: [1.18, 1.41, 1.71, 2.09, 2.58, 3.23, 4.09, 5.26, 6.88, 9.17, 12.51, 17.52, 25.3, 37.95, 59.64, 99.39, 178.91, 357.81, 834.9, 2504.7, 12523.5],
    5: [1.24, 1.56, 2, 2.58, 3.39, 4.52, 6.14, 8.5, 12.04, 17.52, 26.27, 40.87, 66.41, 113.85, 208.72, 417.45, 939.26, 2504.7, 8766.45, 52598.7],
  };

  // helper to create new grid
  const createGrid = () => {
    const g = Array(TOTAL_TILES).fill("safe");
    let placed = 0;
    while (placed < minesCount) {
      const idx = Math.floor(Math.random() * TOTAL_TILES);
      if (g[idx] === "safe") {
        g[idx] = "mine";
        placed++;
      }
    }
    return g;
  };

  const startGame = () => {
    setStatus("");
    if (!Number.isFinite(bet) || bet <= 0) {
      setStatus("Enter a valid bet.");
      return;
    }
    if (bet > balance) {
      setStatus("Insufficient balance for that bet.");
      return;
    }

    // debit bet
    debit(bet);

    const g = createGrid();
    setGrid(g);
    setRevealed([]);
    setPlaying(true);
    setGameOver(false);
    setMultiplier(1);
    setPicks(0);
    setCanCashout(true);
    setStatus("Game started — pick safe tiles. Cash out anytime.");
  };

  const revealAllMines = (g) => {
    const mineIdxs = [];
    g.forEach((t, i) => {
      if (t === "mine") mineIdxs.push(i);
    });
    setRevealed((r) => Array.from(new Set([...r, ...mineIdxs])));
  };

  const clickTile = (i) => {
    if (!playing || gameOver) return;
    if (revealed.includes(i)) return; // already clicked

    if (grid[i] === "mine") {
      // hit mine
      revealAllMines(grid);
      setGameOver(true);
      setPlaying(false);
      setCanCashout(false);
      setStatus(`💥 You hit a mine after ${picks} safe picks. Bet lost.`);
      return;
    }

    // safe tile
    const newPicks = picks + 1;
    setRevealed((r) => [...r, i]);
    setPicks(newPicks);

    // get multiplier from table
    const table = multiplierTables[minesCount] || [];
    const newMultiplier = table[newPicks - 1] || multiplier;
    setMultiplier(newMultiplier);

    setStatus(`Safe pick! Multiplier is now x${newMultiplier.toFixed(2)}.`);
  };

  const cashOut = () => {
    if (!playing || gameOver || !canCashout) return;

    const payout = Math.floor(bet * multiplier);
    credit(payout);
    setStatus(`💸 Cashed out ${payout} coins (x${multiplier.toFixed(2)}).`);
    setPlaying(false);
    setGameOver(true);
    setCanCashout(false);
  };

  const resetGame = () => {
    setGrid([]);
    setRevealed([]);
    setPlaying(false);
    setGameOver(false);
    setStatus("");
    setMultiplier(1);
    setPicks(0);
    setCanCashout(false);
  };

  const remainingSafe = useMemo(() => {
    if (!grid || grid.length === 0) return 0;
    const mines = grid.reduce((acc, t) => (t === "mine" ? acc + 1 : acc), 0);
    return TOTAL_TILES - mines - revealed.filter((i) => grid[i] !== "mine").length;
  }, [grid, revealed, TOTAL_TILES]);

  // CSS (kept as you had)
  const css = `
    .mines-wrap { display:flex; flex-direction:column; align-items:center; gap:18px; padding:18px; }
    .mines-controls { display:flex; gap:10px; align-items:center; }
    .mines-grid { display:grid; gap:10px; justify-content:center; align-items:center; }
    .mines-grid button { width:56px; height:56px; border-radius:8px; border:0; font-size:18px; cursor:pointer; }
    .tile-hidden { background:#222; color:transparent; }
    .tile-safe { background:#0b6; color:#012; font-weight:700; }
    .tile-mine { background:#c33; color:#fff; font-weight:700; }
    .status { min-height:22px; color:#ddd; }
    .info-row { display:flex; gap:12px; align-items:center; }
    .btn { padding:8px 12px; border-radius:8px; border:0; cursor:pointer; }
    .btn-primary { background:#d63333; color:white; }
    .btn-ghost { background:transparent; color:#ddd; border:1px solid #444; }
    @media (min-width:600px) {
      .mines-grid { grid-template-columns: repeat(${GRID_SIZE}, 56px); }
    }
    @media (max-width:599px) {
      .mines-grid { grid-template-columns: repeat(${GRID_SIZE}, 44px); }
      .mines-grid button { width:44px; height:44px; font-size:14px; }
    }
  `;

  return (
    <div className="mines-wrap" style={{ color: "#eee" }}>
      <style>{css}</style>

      <h2>Find the safe spots where Mines are Hidden 💣</h2>

      <div className="mines-controls">
        <div className="info-row">
          <div>Balance: $<strong>{balance}</strong></div>
          <div>Bet:$
            <input
              type="number"
              min={1}
              value={bet}
              onChange={(e) => setBet(Number(e.target.value))}
              style={{ width: 100, marginLeft: 8, padding: 6, borderRadius: 6 }}
              disabled={playing}
            />
          </div>
          <div>
            Mines:
            <input
              type="number"
              min={1}
              max={5}
              value={minesCount}
              onChange={(e) => setMinesCount(Number(e.target.value))}
              style={{ width: 60, marginLeft: 8, padding: 6, borderRadius: 6 }}
              disabled={playing}
            />
          </div>
          <div>Multiplier: <strong>x{multiplier.toFixed(2)}</strong></div>
          <div>Potential: <strong>{potentialPayout}</strong></div>
        </div>

        <div style={{ display: "flex", gap: 8, marginLeft: 12 }}>
          {!playing && !gameOver && (
            <button className="btn btn-primary" onClick={startGame}>Start Game</button>
          )}
          {playing && (
            <>
              <button className="btn btn-primary" onClick={cashOut}>Cash Out</button>
              <button className="btn btn-ghost" onClick={resetGame}>Quit</button>
            </>
          )}
          {gameOver && (
            <button className="btn btn-ghost" onClick={resetGame}>New Round</button>
          )}
        <button className="btn btn-ghost" disabled={isRunning} onClick={() => navigate("/")}>
          ⬅ Dashboard
        </button>
        </div>
      </div>

      <div className="status" aria-live="polite">
        {status}
      </div>

      <div style={{ fontSize: 13, color: "#bbb" }}>
        Picks: {picks} • Remaining safe tiles: {remainingSafe}
      </div>

      <div className="mines-grid" role="grid" aria-label="Mines grid">
        {Array(TOTAL_TILES)
          .fill(null)
          .map((_, i) => {
            const isRevealed = revealed.includes(i);
            const tileType = grid[i];
            const classes = isRevealed
              ? tileType === "mine"
                ? "tile-mine"
                : "tile-safe"
              : "tile-hidden";

            return (
              <button
                key={i}
                className={classes}
                onClick={() => clickTile(i)}
                disabled={!playing || isRevealed || gameOver}
                aria-label={`Tile ${i + 1}`}
                title={!isRevealed ? "Click to reveal" : ""}
              >
                {isRevealed ? (tileType === "mine" ? "💣" : "💎") : ""}
              </button>
            );
          })}
      </div>
    </div>
  );
}
