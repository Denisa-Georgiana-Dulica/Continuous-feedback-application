import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const backendUrl = process.env.REACT_APP_BACKEND_URL;
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      const response = await fetch(`${backendUrl}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
  
      if (response.ok) {
        const data = await response.json();
        console.log(data);  
        // Salvăm token-ul în funcție de rolul utilizatorului
        if (data.role === "teacher") {
          localStorage.setItem("teacherToken", data.token); // Salvăm token-ul pentru profesor
          localStorage.setItem("teacherId", data.userId);
        } else if (data.role === "student") {
          localStorage.setItem("studentToken", data.token); // Salvăm token-ul pentru student
        }
  
        setSuccess(true);
        setError(""); // Șterge mesajul de eroare
        onLogin(data.role);
  
        if (data.role === "teacher") {
          navigate("/teacher-dashboard");
        } else if (data.role === "student") {
          navigate("/student-dashboard");
        } else {
          setError("Role not recognized.");
          setSuccess(false); // Nu afișăm succes dacă rolul nu este recunoscut
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Login failed.");
        setSuccess(false); // Șterge mesajul de succes
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setSuccess(false); // Șterge mesajul de succes
    }
  };
  return (
    <div className="login-container">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Login</button>
      </form>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>Logare cu succes! Vei fi redirecționat...</p>}
    </div>
  );
};

export default Login;
