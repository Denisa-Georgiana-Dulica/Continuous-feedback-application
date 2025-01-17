import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login"; // Importăm componenta Login
import Teacher from "./components/Teacher"; // Importăm dashboard-ul profesorului
import Student from "./components/Student";
//import Feedback from "./components/Feedback";


function App() {
  const [role, setRole] = useState(""); // Stare pentru rolul utilizatorului

  const handleLogin = (userRole) => {
    if (userRole === "teacher" || userRole === "student") {
      setRole(userRole);
    } else {
      console.error("Role not recognized");
    }
  };

  return (
    <div className="App">
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        {role === "teacher" && (
          <Route path="/teacher-dashboard" element={<Teacher />} />
        )}
        {role === "student" && (
          <Route path="/student-dashboard" element={<Student />} />
        )}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </div>
  );
}

export default App;
