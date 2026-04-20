import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext.jsx";
import { Card } from "../ui/Card.jsx";

const API_BASE = import.meta.env.VITE_API_URL || "";

export default function Profile() {
  const { user: ctxUser } = useContext(AuthContext);
  const [tab, setTab] = useState("overview");
  const [profileUser, setProfileUser] = useState(ctxUser);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    axios
      .get(`${API_BASE}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setProfileUser(res.data))
      .catch(() => setLoadError("Could not refresh profile."));
  }, []);

  const user = profileUser || ctxUser;
  if (!user) return null;

  return (
    <div className="profile-page">
      <Card title="Profile">
        <div className="profile-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "overview"}
            className={`profile-tab${tab === "overview" ? " active" : ""}`}
            onClick={() => setTab("overview")}
          >
            Overview
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "account"}
            className={`profile-tab${tab === "account" ? " active" : ""}`}
            onClick={() => setTab("account")}
          >
            Account
          </button>
        </div>

        {loadError && <p className="error profile-tab-error">{loadError}</p>}

        {tab === "overview" && (
          <section className="profile-panel" role="tabpanel">
            <p className="profile-lead">
              Hello, <strong>{user.name}</strong>. You are signed in to the <strong>admin panel</strong> as{" "}
              <strong>{user.role}</strong>.
            </p>
            <p className="profile-muted">
              Use <Link to="/users">Users</Link> for account approvals. Approve client-created sheets from Sheets.
            </p>
          </section>
        )}

        {tab === "account" && (
          <section className="profile-panel" role="tabpanel">
            <h2 className="profile-subheading">Your details</h2>
            <dl className="profile-details profile-details--stack">
              <dt>Name</dt>
              <dd>{user.name}</dd>
              <dt>Surname</dt>
              <dd>{user.surname}</dd>
              <dt>Email</dt>
              <dd>{user.email}</dd>
              <dt>Role</dt>
              <dd>{user.role}</dd>
            </dl>
          </section>
        )}
      </Card>
    </div>
  );
}
