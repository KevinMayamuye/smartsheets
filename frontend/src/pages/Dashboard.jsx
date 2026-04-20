import { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";
import { Card } from "../ui/Card.jsx";

export default function Dashboard() {
  const { user } = useContext(AuthContext);

  if (!user) return null;

  return (
    <div className="dashboard-page">
      <Card title="Dashboard">
        <p className="dashboard-lead">
          Welcome back, {user.name}.{" "}
          <Link to="/profile">View your profile</Link> or open Sheets from the sidebar.
        </p>
      </Card>
    </div>
  );
}
