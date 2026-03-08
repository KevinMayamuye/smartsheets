import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext.jsx";

const API_BASE = import.meta.env.VITE_API_URL || "";

export default function Dashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch(`${API_BASE}/api/users`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then((data) => setUsers(data))
      .catch((err) => setError(err.message || "Failed to load users"))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!user) return null;

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <h1>Admin dashboard</h1>
        <div className="header-right">
          <span className="admin-name">{user.name} {user.surname}</span>
          <button type="button" onClick={handleLogout} className="logout-btn">
            Log out
          </button>
        </div>
      </header>
      <section className="profiles-section">
        <h2>Client profiles</h2>
        {loading && <p>Loading profiles...</p>}
        {error && <p className="error">{error}</p>}
        {!loading && !error && users.length === 0 && (
          <p>No users yet. Clients will appear here after they register.</p>
        )}
        {!loading && !error && users.length > 0 && (
          <table className="profiles-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Surname</th>
                <th>Email</th>
                <th>Role</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td>{u.name}</td>
                  <td>{u.surname}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
