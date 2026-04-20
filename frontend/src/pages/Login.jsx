import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
import { Button } from "../ui/Button.jsx";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      const data = err.response?.data;
      if (err.response?.status === 403 && data?.code === "ACCOUNT_NOT_APPROVED") {
        setError(
          data.message ||
            "Your account is pending administrator approval. You cannot log in until an admin approves it."
        );
      } else {
        setError(data?.message || err.message || "Login failed");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="sf-auth-layout">
      <div className="sf-auth-card">
        <h1>Log in</h1>
        <form onSubmit={handleSubmit}>
          {error && <p className="sf-error">{error}</p>}
          <div className="sf-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="sf-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <div className="sf-form-actions">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Logging in…" : "Log in"}
            </Button>
          </div>
        </form>
        <p className="sf-auth-footer">
          Don&apos;t have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}
