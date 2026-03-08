import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext.jsx";

export default function Dashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!user) return null;

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <h1>Dashboard</h1>
        <button type="button" onClick={handleLogout} className="logout-btn">
          Log out
        </button>
      </header>
      <section className="profile-details">
        <h2>Your profile</h2>
        <dl>
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
    </div>
  );
}
