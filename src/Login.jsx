import React, { useState } from "react";

export default function Signup({ onSwitchToLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [dob, setDob] = useState("");

  const handleSignup = (e) => {
    e.preventDefault();

    if (!dob) {
      alert("Please select your date of birth.");
      return;
    }

    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < 18) {
      alert("You must be at least 18 years old to sign up.");
      return;
    }

    alert("Signup successful! 🎉");
  };

  return (
    <div className="form-container">
      <h2>Signup</h2>
      <form onSubmit={handleSignup}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <label style={{ color: "white", marginBottom: "5px" }}>
          Date of Birth
        </label>
        <input
          type="date"
          value={dob}
          onChange={(e) => setDob(e.target.value)}
          required
        />

        <button type="submit">Signup</button>
      </form>

      <p style={{ color: "white" }}>Already have an account?</p>
      <button onClick={onSwitchToLogin}>Login</button>
    </div>
  );
}
