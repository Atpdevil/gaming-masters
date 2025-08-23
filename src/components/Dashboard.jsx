import React from "react";
import { useNavigate } from "react-router-dom";
import minesImg from "../assets/mines.png";
import limboImg from "../assets/limbo.png";
import blackjackImg from "../assets/blackjack.png"; // add this
import { useWallet } from "../state/WalletProvider";
import "./dashboard.css"; 

export default function Dashboard({ username, onLogout }) {
  const { balance } = useWallet();

  const games = [
    { key: "mines", name: "Mines", players: 4512, img: minesImg },
    { key: "limbo", name: "Limbo", players: 3044, img: limboImg },
    { key: "blackjack", name: "Blackjack", players: 3891, img: blackjackImg }, 
  ];

  return (
    <div className="dashboard">
      <h1 className="dashboard-title">Welcome, {username}</h1>
      <h2 className="balance"> Balance: ${balance}</h2>

      <button className="logout-btn" onClick={onLogout}>
        🚪 Logout
      </button>

      <div className="game-grid">
        {games.map((g) => (
          <GameCard key={g.key} game={g} />
        ))}
      </div>
    </div>
  );
}

function GameCard({ game }) {
  const navigate = useNavigate();

  return (
    <div className="game-card" onClick={() => navigate(`/${game.key}`)}>
      <img src={game.img} alt={game.name} className="game-img" />
      <div className="game-info">
        <h3>{game.name}</h3>
        <p> {game.players.toLocaleString()} playing</p>
      </div>
    </div>
  );
}
