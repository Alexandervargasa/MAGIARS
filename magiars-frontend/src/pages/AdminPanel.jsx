// src/pages/AdminPanel.jsx
import React, { useEffect, useState } from "react";
import api from "../services/api.js";

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await api.getAllUsers();
      setUsers(data);
      setError("");
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Error al cargar usuarios. Verifica que tienes permisos de administrador.");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, currentRole) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    
    if (!window.confirm(`¿Cambiar rol a ${newRole === "admin" ? "Administrador" : "Usuario"}?`)) {
      return;
    }

    try {
      await api.updateUserRole(userId, newRole);
      setSuccessMessage(`Rol actualizado correctamente a ${newRole === "admin" ? "Administrador" : "Usuario"}`);
      setTimeout(() => setSuccessMessage(""), 3000);
      fetchUsers();
    } catch (err) {
      console.error("Error updating role:", err);
      setError("Error al actualizar rol");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`¿Estás seguro de eliminar a ${userName}? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      await api.deleteUserById(userId);
      setSuccessMessage("Usuario eliminado correctamente");
      setTimeout(() => setSuccessMessage(""), 3000);
      fetchUsers();
    } catch (err) {
      console.error("Error deleting user:", err);
      setError(err.message.includes("No puedes eliminarte") 
        ? "No puedes eliminarte a ti mismo" 
        : "Error al eliminar usuario");
      setTimeout(() => setError(""), 3000);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-CO", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loader}></div>
        <p style={styles.loadingText}>Cargando usuarios...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .user-row:hover {
          background: rgba(102, 126, 234, 0.05) !important;
          transform: translateX(5px);
        }
        .action-button:hover {
          transform: translateY(-2px);
        }
        .delete-button:hover {
          background: #ef4444 !important;
        }
      `}</style>

      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>👥 Panel de Administración</h1>
          <p style={styles.subtitle}>Gestiona usuarios y permisos del sistema</p>
        </div>
        <div style={styles.stats}>
          <div style={styles.statCard}>
            <span style={styles.statNumber}>{users.length}</span>
            <span style={styles.statLabel}>Total Usuarios</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statNumber}>
              {users.filter(u => u.role === 'admin').length}
            </span>
            <span style={styles.statLabel}>Administradores</span>
          </div>
        </div>
      </div>

      {/* Mensajes */}
      {error && (
        <div style={styles.errorMessage}>
          ⚠️ {error}
        </div>
      )}

      {successMessage && (
        <div style={styles.successMessage}>
          ✅ {successMessage}
        </div>
      )}

      {/* Tabla de usuarios */}
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeader}>
              <th style={styles.th}>Avatar</th>
              <th style={styles.th}>Nombre</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Rol</th>
              <th style={styles.th}>Tipo Auth</th>
              <th style={styles.th}>Registrado</th>
              <th style={styles.th}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="user-row" style={styles.tableRow}>
                <td style={styles.td}>
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} style={styles.avatar} />
                  ) : (
                    <div style={styles.avatarPlaceholder}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </td>
                <td style={styles.td}>
                  <strong style={styles.userName}>{user.name}</strong>
                </td>
                <td style={styles.td}>
                  <span style={styles.email}>{user.email}</span>
                </td>
                <td style={styles.td}>
                  <span style={{
                    ...styles.badge,
                    ...(user.role === 'admin' ? styles.badgeAdmin : styles.badgeUser)
                  }}>
                    {user.role === 'admin' ? '👑 Admin' : '👤 Usuario'}
                  </span>
                </td>
                <td style={styles.td}>
                  <span style={styles.authType}>
                    {user.authType === 'local' ? '🔐 Local' : '🌐 Meta'}
                  </span>
                </td>
                <td style={styles.td}>
                  <span style={styles.date}>{formatDate(user.createdAt)}</span>
                </td>
                <td style={styles.td}>
                  <div style={styles.actions}>
                    <button
                      className="action-button"
                      onClick={() => handleRoleChange(user.id, user.role)}
                      style={{
                        ...styles.button,
                        ...(user.role === 'admin' ? styles.demoteButton : styles.promoteButton)
                      }}
                      title={user.role === 'admin' ? 'Quitar admin' : 'Hacer admin'}
                    >
                      {user.role === 'admin' ? '⬇️' : '⬆️'}
                    </button>
                    <button
                      className="action-button delete-button"
                      onClick={() => handleDeleteUser(user.id, user.name)}
                      style={{...styles.button, ...styles.deleteButton}}
                      title="Eliminar usuario"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>No hay usuarios registrados</p>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "20px",
    animation: "fadeIn 0.6s ease-in",
  },

  loader: {
    width: "50px",
    height: "50px",
    border: "4px solid rgba(102, 126, 234, 0.2)",
    borderTop: "4px solid #667eea",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    margin: "0 auto",
  },

  loadingText: {
    textAlign: "center",
    color: "#fff",
    marginTop: "20px",
    fontSize: "16px",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
    flexWrap: "wrap",
    gap: "20px",
  },

  title: {
    fontSize: "32px",
    fontWeight: "700",
    color: "#fff",
    marginBottom: "8px",
  },

  subtitle: {
    fontSize: "16px",
    color: "rgba(255, 255, 255, 0.6)",
  },

  stats: {
    display: "flex",
    gap: "15px",
  },

  statCard: {
    background: "rgba(102, 126, 234, 0.1)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(102, 126, 234, 0.3)",
    borderRadius: "12px",
    padding: "15px 25px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "5px",
  },

  statNumber: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#667eea",
  },

  statLabel: {
    fontSize: "12px",
    color: "rgba(255, 255, 255, 0.6)",
  },

  errorMessage: {
    background: "rgba(239, 68, 68, 0.1)",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    color: "#ef4444",
    padding: "12px 20px",
    borderRadius: "8px",
    marginBottom: "20px",
    fontSize: "14px",
  },

  successMessage: {
    background: "rgba(34, 197, 94, 0.1)",
    border: "1px solid rgba(34, 197, 94, 0.3)",
    color: "#22c55e",
    padding: "12px 20px",
    borderRadius: "8px",
    marginBottom: "20px",
    fontSize: "14px",
  },

  tableContainer: {
    background: "rgba(255, 255, 255, 0.05)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(102, 126, 234, 0.2)",
    borderRadius: "12px",
    overflow: "hidden",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
  },

  tableHeader: {
    background: "rgba(102, 126, 234, 0.1)",
  },

  th: {
    padding: "16px",
    textAlign: "left",
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: "14px",
    fontWeight: "600",
    borderBottom: "1px solid rgba(102, 126, 234, 0.2)",
  },

  tableRow: {
    transition: "all 0.3s ease",
  },

  td: {
    padding: "16px",
    color: "#fff",
    fontSize: "14px",
    borderBottom: "1px solid rgba(102, 126, 234, 0.1)",
  },

  avatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid rgba(102, 126, 234, 0.3)",
  },

  avatarPlaceholder: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontSize: "16px",
    fontWeight: "700",
  },

  userName: {
    color: "#fff",
    fontWeight: "600",
  },

  email: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: "13px",
  },

  badge: {
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    display: "inline-block",
  },

  badgeAdmin: {
    background: "rgba(234, 179, 8, 0.2)",
    color: "#eab308",
    border: "1px solid rgba(234, 179, 8, 0.3)",
  },

  badgeUser: {
    background: "rgba(102, 126, 234, 0.2)",
    color: "#667eea",
    border: "1px solid rgba(102, 126, 234, 0.3)",
  },

  authType: {
    fontSize: "13px",
    color: "rgba(255, 255, 255, 0.6)",
  },

  date: {
    fontSize: "13px",
    color: "rgba(255, 255, 255, 0.5)",
  },

  actions: {
    display: "flex",
    gap: "8px",
  },

  button: {
    padding: "8px 12px",
    border: "none",
    borderRadius: "6px",
    fontSize: "16px",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },

  promoteButton: {
    background: "rgba(34, 197, 94, 0.2)",
    border: "1px solid rgba(34, 197, 94, 0.3)",
  },

  demoteButton: {
    background: "rgba(234, 179, 8, 0.2)",
    border: "1px solid rgba(234, 179, 8, 0.3)",
  },

  deleteButton: {
    background: "rgba(239, 68, 68, 0.2)",
    border: "1px solid rgba(239, 68, 68, 0.3)",
  },

  emptyState: {
    padding: "60px 20px",
    textAlign: "center",
  },

  emptyText: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: "16px",
  },
};