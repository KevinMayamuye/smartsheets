import { useState, useEffect } from "react";
import axios from "axios";
import { Card } from "../ui/Card.jsx";
import { Badge } from "../ui/Badge.jsx";
import { Button } from "../ui/Button.jsx";

const API_BASE = import.meta.env.VITE_API_URL || "";

export default function Users() {
  const [pending, setPending] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [actionId, setActionId] = useState(null);

  const token = () => localStorage.getItem("token");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const headers = { Authorization: `Bearer ${token()}` };
      const [pRes, aRes] = await Promise.all([
        axios.get(`${API_BASE}/api/users/pending`, { headers }),
        axios.get(`${API_BASE}/api/users`, { headers }),
      ]);
      setPending(Array.isArray(pRes.data) ? pRes.data : []);
      setAllUsers(Array.isArray(aRes.data) ? aRes.data : []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleApprove = async (id) => {
    setActionId(id);
    setError("");
    setInfo("");
    try {
      const res = await axios.post(`${API_BASE}/api/users/${id}/approve`, {}, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      setInfo(res.data?.message || "Approved.");
      await load();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Approve failed");
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="users-page">
      <Card title="Users">
        <p className="users-lead">
          Approve new client accounts here. Until approved, clients cannot log in.
        </p>

        {info && <p className="sf-success">{info}</p>}
        {error && <p className="sf-error">{error}</p>}

        <section className="sf-section">
          <h2>Pending approval</h2>
          {loading ? (
            <p className="sf-muted">Loading…</p>
          ) : pending.length === 0 ? (
            <p className="sf-muted">No accounts waiting for approval.</p>
          ) : (
            <table className="sf-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Surname</th>
                  <th>Email</th>
                  <th>Registered</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {pending.map((u) => (
                  <tr key={u._id}>
                    <td>{u.name}</td>
                    <td>{u.surname}</td>
                    <td>{u.email}</td>
                    <td>{u.createdAt ? new Date(u.createdAt).toLocaleString() : "—"}</td>
                    <td>
                      <Button
                        type="button"
                        variant="primary"
                        disabled={actionId === u._id}
                        onClick={() => handleApprove(u._id)}
                      >
                        {actionId === u._id ? "…" : "Approve"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="sf-section">
          <h2>All accounts</h2>
          {!loading && (
            <table className="sf-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Approved</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {allUsers.map((u) => (
                  <tr key={u._id}>
                    <td>
                      {u.name} {u.surname}
                    </td>
                    <td>{u.email}</td>
                    <td>{u.role}</td>
                    <td>
                      {u.accountApproved === false ? (
                        <Badge variant="blocked">No</Badge>
                      ) : (
                        <Badge variant="complete">Yes</Badge>
                      )}
                    </td>
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
