import { useState } from "react";
import { Link } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
import { Button } from "../ui/Button.jsx";

export default function Register() {
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const { register } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const data = await register(name, surname, email, password);
      setSuccessMessage(data?.message || "");
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="sf-auth-layout">
        <div className="sf-auth-card">
          <h1>Registration received</h1>
          <p className="sf-muted">
            {successMessage ||
              "An administrator must approve your account before you can log in."}
          </p>
          <p className="sf-auth-footer" style={{ marginTop: 12 }}>
            <Link to="/login">Back to log in</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="sf-auth-layout">
      <div className="sf-auth-card">
        <h1>Create account</h1>
        <form onSubmit={handleSubmit}>
          {error && <p className="sf-error">{error}</p>}
          <div className="sf-field">
            <label htmlFor="name">Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="given-name"
            />
          </div>
          <div className="sf-field">
            <label htmlFor="surname">Surname</label>
            <input
              id="surname"
              type="text"
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
              required
              autoComplete="family-name"
            />
          </div>
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
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <div className="sf-form-actions">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creating account…" : "Register"}
            </Button>
          </div>
        </form>
        <p className="sf-auth-footer">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
