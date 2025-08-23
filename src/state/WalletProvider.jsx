// WalletProvider.jsx
import React, { createContext, useContext, useEffect, useState } from "react";

const WalletContext = createContext();
export const useWallet = () => useContext(WalletContext);

export default function WalletProvider({ children }) {
  const STORAGE_KEY = "gm_wallet";
  const REWARD_KEY = "gm_daily_reward";
  const STARTING_BALANCE = 1000;

  // ✅ Always ensure balance is a number
  const [balance, setBalance] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved && !isNaN(saved) ? Number(saved) : STARTING_BALANCE;
  });

  const [daily, setDaily] = useState(() => {
    const saved = localStorage.getItem(REWARD_KEY);
    return saved
      ? JSON.parse(saved)
      : { lastClaim: null, streak: 0 };
  });

  // persist balance
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(balance));
  }, [balance]);

  // persist daily reward
  useEffect(() => {
    localStorage.setItem(REWARD_KEY, JSON.stringify(daily));
  }, [daily]);

  // ✅ Keep balance numeric when updating
  const credit = (amount) => setBalance((b) => Number(b) + Number(amount));
  const debit = (amount) => {
    if (balance >= amount) setBalance((b) => Number(b) - Number(amount));
    else alert("Not enough balance!");
  };

  // daily reward system
  const claimDailyReward = () => {
    const today = new Date().toDateString();

    if (daily.lastClaim === today) {
      alert("You already claimed today's reward!");
      return false;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    let newStreak =
      daily.lastClaim === yesterday.toDateString() ? daily.streak + 1 : 1;

    if (newStreak > 7) newStreak = 1; // reset every 7 days

    const reward = 500 * newStreak;
    credit(reward);

    setDaily({ lastClaim: today, streak: newStreak });
    return { reward, newStreak };
  };

  return (
    <WalletContext.Provider
      value={{ balance, setBalance, credit, debit, claimDailyReward, daily }}
    >
      {children}
    </WalletContext.Provider>
  );
}
