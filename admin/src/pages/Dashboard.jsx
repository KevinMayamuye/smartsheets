import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";
import { Card } from "../ui/Card.jsx";

const API_BASE = import.meta.env.VITE_API_URL || "";

export default function Dashboard() {
  const { user } = useContext(AuthContext);
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

  if (!user) return null;

  return (
    <div className="dashboard-page">
      <Card title="Admin dashboard">
        <p className="dashboard-lead">
          <Link to="/profile">Your profile</Link> ·{" "}
          <Link to="/users">Account approvals</Link> · Manage sheets from the sidebar.
        </p>
        <section className="sf-section">
          <h2>Client profiles</h2>
          {loading && <p className="sf-muted">Loading profiles…</p>}
          {error && <p className="sf-error">{error}</p>}
          {!loading && !error && users.length === 0 && (
            <p className="sf-muted">No users yet. Clients will appear here after they register.</p>
          )}
          {!loading && !error && users.length > 0 && (
            <table className="sf-table">
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
      </Card>
    </div>
  );
}
