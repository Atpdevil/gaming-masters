import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./style.css";
import Auth from "./components/Auth";
import Dashboard from "./components/Dashboard";
import { GoogleOAuthProvider } from "@react-oauth/google";
import Mines from "./pages/Mines";
import Blackjack from "./pages/blackjack"; // Make sure file name matches case
import Limbo from "./pages/Limbo";

function App() {
  const [user, setUser] = useState(null);
  const [coins, setCoins] = useState(1000); // Global coin state

  return (
    <GoogleOAuthProvider clientId="1057799024569-mngd6iar2udpc3ls4r78h754vvvvqro1.apps.googleusercontent.com">
      <Router>
        <Routes>
          {/* Mines doesn't use coins yet, so leave as is */}
          <Route path="/mines" element={<Mines />} />
          {/* Pass coins + setCoins to all games */}
          <Route
            path="/blackjack"
            element={<Blackjack coins={coins} setCoins={setCoins} />}
          />
          <Route
            path="/limbo"
            element={<Limbo coins={coins} setCoins={setCoins} />}
          />

          {/* Auth & Dashboard */}
          {!user ? (
            <Route
              path="/"
              element={<Auth onLogin={(username) => setUser(username)} />}
            />
          ) : (
            <Route
              path="/"
              element={
                <Dashboard
                  username={user}
                  coins={coins}
                  setCoins={setCoins}
                  onLogout={() => setUser(null)}
                />
              }
            />
          )}
        </Routes>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
