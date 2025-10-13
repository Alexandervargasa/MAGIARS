import React from "react";
import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav style={styles.navbar}>
      <div style={styles.navContent}>
        <Link to="/" style={styles.logoLink}>
          <h2 style={styles.logo}>✨ MAGIARS</h2>
        </Link>
        <div style={styles.navLinks}>
          <Link to="/" style={styles.link}>
            Inicio
          </Link>
          <Link to="/about" style={styles.link}>
            Acerca de
          </Link>
        </div>
      </div>
    </nav>
  );
}

const styles = {
  navbar: {
    padding: "15px 20px",
    background: "#1a1a1a",
    color: "#fff",
    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  navContent: {
    maxWidth: "1200px",
    margin: "0 auto",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logoLink: {
    textDecoration: "none",
    color: "inherit",
  },
  logo: {
    display: "inline",
    margin: 0,
    fontSize: "24px",
    fontWeight: "700",
  },
  navLinks: {
    display: "flex",
    gap: "25px",
  },
  link: {
    color: "#fff",
    textDecoration: "none",
    fontSize: "15px",
    fontWeight: "500",
    transition: "color 0.3s ease",
    padding: "8px 12px",
    borderRadius: "4px",
    cursor: "pointer",
  },
};

export default Navbar;