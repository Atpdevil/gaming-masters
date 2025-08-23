import React, { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";

export default function Auth({ onLogin }) {
  const [isSignup, setIsSignup] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [age, setAge] = useState("");
  const [error, setError] = useState("");

  const handleSignup = () => {
    if (!username || !password || !age) {
      setError("All fields required!");
      return;
    }
    if (age < 18) {
      setError("You must be 18 or older!");
      return;
    }

    // Save user to localStorage for demo
    localStorage.setItem(
      "user",
      JSON.stringify({ username, password, age })
    );
    setError("");
    alert("Signup successful! Please login.");
    setIsSignup(false);
  };

  const handleLogin = () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || user.username !== username || user.password !== password) {
      setError("Incorrect username or password!");
      return;
    }
    setError("");
    onLogin(user.username);
  };

  return (
    <div className="container">
      {isSignup ? <h2>Signup</h2> : <h2>Login</h2>}
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {isSignup && (
        <input
          type="number"
          placeholder="Age"
          value={age}
          onChange={(e) => setAge(e.target.value)}
        />
      )}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {isSignup ? (
        <button onClick={handleSignup}>Signup</button>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
      <p>
        {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
        <button onClick={() => setIsSignup(!isSignup)}>
          {isSignup ? "Login" : "Signup"}
        </button>
      </p>

      {!isSignup && (
        <div style={{ marginTop: "10px" }}>
          <GoogleLogin
            onSuccess={(credentialResponse) => {
              onLogin("GoogleUser");
            }}
            onError={() => {
              alert("Google login failed");
            }}
          />
        </div>
      )}
    </div>
  );
}