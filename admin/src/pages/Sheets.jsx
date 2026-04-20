import { useState, useEffect, useContext, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axios from "axios";
import api from "../api/client.js";
import { AuthContext } from "../context/AuthContext.jsx";
import { Badge } from "../ui/Badge.jsx";
import { Button } from "../ui/Button.jsx";

const API_BASE = import.meta.env.VITE_API_URL || "";

function sheetStatus(s) {
  return s.status || "approved";
}

function statusBadgeVariant(st) {
  if (st === "approved") return "complete";
  if (st === "pending") return "progress";
  if (st === "rejected") return "blocked";
  return "neutral";
}

function memberCount(s) {
  if (Array.isArray(s.memberIds) && s.memberIds.length > 0) return s.memberIds.length;
  return s.ownerId ? 1 : 0;
}

function membersSummary(s) {
  const members = Array.isArray(s.memberIds) ? s.memberIds : [];
  const n = memberCount(s);
  if (n === 0) return "—";
  const populated = members.filter((m) => m && typeof m === "object" && (m.name != null || m.email));
  if (populated.length === 0) return `${n} member(s)`;
  const labels = populated.slice(0, 3).map((m) => {
    const parts = [m.name, m.surname].filter(Boolean);
    return parts.length ? parts.join(" ") : m.email || "?";
  });
  const extra = populated.length > 3 ? ` +${populated.length - 3} more` : "";
  return `${n}: ${labels.join(", ")}${extra}`;
}

export default function Sheets() {
  const { user } = useContext(AuthContext);
  const isAdmin = user?.role === "admin";
  const [searchParams] = useSearchParams();

  const [sheets, setSheets] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [assignment, setAssignment] = useState("admin_only");
  const [selectedIds, setSelectedIds] = useState([]);
  const [creating, setCreating] = useState(false);
  const [info, setInfo] = useState("");
  const [actionId, setActionId] = useState(null);

  const load = () => {
    setLoading(true);
    setError("");
    api
      .get("/api/sheets")
      .then((res) => setSheets(Array.isArray(res.data) ? res.data : []))
      .catch((err) => setError(err.response?.data?.message || err.message || "Failed to load"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    const token = localStorage.getItem("token");
    axios
      .get(`${API_BASE}/api/users`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : [];
        setAllUsers(list);
      })
      .catch(() => setAllUsers([]));
  }, [isAdmin]);

  const searchQ = useMemo(() => (searchParams.get("q") || "").trim().toLowerCase(), [searchParams]);

  const sheetsFiltered = useMemo(() => {
    if (!searchQ) return sheets;
    return sheets.filter((s) => {
      const n = String(s.name || "").toLowerCase();
      const d = String(s.description || "").toLowerCase();
      return n.includes(searchQ) || d.includes(searchQ);
    });
  }, [sheets, searchQ]);

  const { approved, pending, rejected } = useMemo(() => {
    const a = [];
    const p = [];
    const r = [];
    for (const s of sheetsFiltered) {
      const st = sheetStatus(s);
      if (st === "approved") a.push(s);
      else if (st === "pending") p.push(s);
      else r.push(s);
    }
    return { approved: a, pending: p, rejected: r };
  }, [sheetsFiltered]);

  const noSearchResults =
    Boolean(searchQ) &&
    sheets.length > 0 &&
    approved.length === 0 &&
    pending.length === 0 &&
    rejected.length === 0;

  const onMultiSelectChange = (e) => {
    const opts = [...e.target.selectedOptions];
    setSelectedIds(opts.map((o) => o.value));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (isAdmin && assignment === "selected" && selectedIds.length === 0) {
      setError("Select at least one user, or choose another assignment mode.");
      return;
    }
    setCreating(true);
    setError("");
    setInfo("");
    try {
      const payload =
        isAdmin
          ? {
              name: name.trim(),
              assignment,
              userIds: assignment === "selected" ? selectedIds : undefined,
            }
          : { name: name.trim() };
      const res = await api.post("/api/sheets", payload);
      setName("");
      setAssignment("admin_only");
      setSelectedIds([]);
      setInfo(res.message || "Created.");
      load();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Create failed");
    } finally {
      setCreating(false);
    }
  };

  const handleApprove = async (id) => {
    setActionId(id);
    setError("");
    try {
      await api.post(`/api/sheets/${id}/approve`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Approve failed");
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (id) => {
    setActionId(id);
    setError("");
    try {
      await api.post(`/api/sheets/${id}/reject`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Reject failed");
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this sheet from your list?")) return;
    setActionId(id);
    setError("");
    try {
      await api.delete(`/api/sheets/${id}`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Delete failed");
    } finally {
      setActionId(null);
    }
  };

  const renderRow = (s, { showMembers, showAdminActions, allowClientDelete }) => {
    const st = sheetStatus(s);
    const canOpen = st === "approved";
    const busy = actionId === s._id;
    return (
      <li key={s._id} className="sf-list-row">
        <div className="sheets-list-main">
          {canOpen ? (
            <Link to={`/sheets/${s._id}`}>{s.name}</Link>
          ) : (
            <span className="sheets-name-disabled">{s.name}</span>
          )}
          {s.description ? <span className="sf-muted"> — {s.description}</span> : null}{" "}
          <Badge variant={statusBadgeVariant(st)}>{st}</Badge>
          {showMembers && (
            <span className="sf-muted sheets-members"> · Members: {membersSummary(s)}</span>
          )}
        </div>
        <div className="sf-toolbar-actions">
          {showAdminActions && st === "pending" && (
            <>
              <Button type="button" variant="secondary" disabled={busy} onClick={() => handleApprove(s._id)}>
                Approve
              </Button>
              <Button type="button" variant="danger" disabled={busy} onClick={() => handleReject(s._id)}>
                Reject
              </Button>
            </>
          )}
          {allowClientDelete && (st === "pending" || st === "rejected") && (
            <button type="button" className="sf-link-danger" disabled={busy} onClick={() => handleDelete(s._id)}>
              Remove
            </button>
          )}
        </div>
      </li>
    );
  };

  return (
    <div className="sheets-page sf-stack">
      <header className="sheets-header">
        <h1 className="page-title">Sheets</h1>
      </header>

      <form onSubmit={handleCreate} className="sf-stack">
        <div className="sf-row">
          <input
            className="sf-field-like"
            type="text"
            placeholder="New sheet name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Button type="submit" disabled={creating}>
            {creating ? "Creating…" : "Create sheet"}
          </Button>
        </div>
        {isAdmin && (
          <fieldset className="sf-fieldset">
            <legend>Who can access this sheet</legend>
            <label className="sf-radio-row">
              <input
                type="radio"
                name="assignment"
                value="admin_only"
                checked={assignment === "admin_only"}
                onChange={() => setAssignment("admin_only")}
              />
              Admin only (you)
            </label>
            <label className="sf-radio-row">
              <input
                type="radio"
                name="assignment"
                value="selected"
                checked={assignment === "selected"}
                onChange={() => setAssignment("selected")}
              />
              Choose users
            </label>
            <label className="sf-radio-row">
              <input
                type="radio"
                name="assignment"
                value="all"
                checked={assignment === "all"}
                onChange={() => setAssignment("all")}
              />
              Everyone (snapshot: all accounts now)
            </label>
            {assignment === "selected" && (
              <div className="sheets-multi-wrap">
                <label htmlFor="sheet-members-multi" className="sf-muted" style={{ display: "block", marginBottom: 6 }}>
                  Hold Ctrl/Cmd to select multiple:
                </label>
                <select
                  id="sheet-members-multi"
                  multiple
                  size={Math.min(8, Math.max(4, allUsers.length))}
                  value={selectedIds}
                  onChange={onMultiSelectChange}
                  className="sf-multi"
                >
                  {allUsers.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name} {u.surname} ({u.email}) — {u.role}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </fieldset>
        )}
      </form>

      {info && <p className="sf-success">{info}</p>}
      {error && <p className="sf-error">{error}</p>}

      {loading ? (
        <p className="sf-muted">Loading…</p>
      ) : (
        <>
          {noSearchResults && <p className="sf-muted">No sheets match your search.</p>}
          {isAdmin && pending.length > 0 && (
            <section className="sf-section">
              <h2>Pending approval</h2>
              <ul className="sf-list-plain">
                {pending.map((s) =>
                  renderRow(s, { showMembers: true, showAdminActions: true, allowClientDelete: false })
                )}
              </ul>
            </section>
          )}

          {!isAdmin && (pending.length > 0 || rejected.length > 0) && (
            <section className="sf-section">
              <h2>Awaiting action</h2>
              <p className="sf-muted" style={{ marginBottom: 8 }}>
                Pending sheets are submitted for admin approval. You can open them after approval.
              </p>
              <ul className="sf-list-plain">
                {[...pending, ...rejected].map((s) =>
                  renderRow(s, { showMembers: false, showAdminActions: false, allowClientDelete: true })
                )}
              </ul>
            </section>
          )}

          <section className="sf-section">
            <h2>{isAdmin ? "Approved & other" : "Your sheets"}</h2>
            <ul className="sf-list-plain">
              {!isAdmin &&
                !noSearchResults &&
                approved.length === 0 &&
                pending.length === 0 &&
                rejected.length === 0 && (
                <li className="sf-muted">No sheets yet. Create one above.</li>
              )}
              {!isAdmin && approved.length === 0 && (pending.length > 0 || rejected.length > 0) && (
                <li className="sf-muted sheets-muted-row">No approved sheets yet. Open items above once they are approved.</li>
              )}
              {isAdmin && sheets.length === 0 && <li className="sf-muted">No sheets yet.</li>}
              {isAdmin &&
                sheetsFiltered
                  .filter((s) => sheetStatus(s) !== "pending")
                  .map((s) =>
                    renderRow(s, {
                      showMembers: true,
                      showAdminActions: false,
                      allowClientDelete: false,
                    })
                  )}
              {!isAdmin &&
                approved.map((s) =>
                  renderRow(s, { showMembers: false, showAdminActions: false, allowClientDelete: false })
                )}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
