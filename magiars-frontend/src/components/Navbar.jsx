import React from "react";
import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav style={{ padding: "10px", background: "#222", color: "#fff" }}>
      <h2 style={{ display: "inline", marginRight: "20px" }}>🌐 Magiars</h2>
      <Link to="/" style={{ color: "#fff", marginRight: "15px" }}>Inicio</Link>
      <Link to="/about" style={{ color: "#fff" }}>Acerca de</Link>
    </nav>
  );
}

export default Navbar;
