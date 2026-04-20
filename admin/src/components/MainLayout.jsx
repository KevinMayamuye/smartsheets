import { useState, useEffect, useRef, useContext } from "react";
import { Outlet, NavLink, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";
import { AppShell } from "../ui/AppShell.jsx";
import { Button } from "../ui/Button.jsx";
import { IconDashboard, IconSheets, IconProfile, IconUsers } from "../ui/icons.jsx";

function navClass(isActive) {
  return `sf-nav-item${isActive ? " sf-nav-item--active" : ""}`;
}

export default function MainLayout() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchDraft, setSearchDraft] = useState("");
  const searchInputRef = useRef(null);
  const sheetsNavActive = pathname === "/sheets" || pathname.startsWith("/sheets/");

  useEffect(() => {
    if (!pathname.startsWith("/sheets")) {
      setSearchDraft("");
      return;
    }
    if (searchInputRef.current === document.activeElement) return;
    setSearchDraft(searchParams.get("q") || "");
  }, [pathname, searchParams]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      const v = searchDraft.trim();
      if (pathname.startsWith("/sheets")) {
        const current = (searchParams.get("q") || "").trim();
        if (current === v) return;
        if (v === "") {
          setSearchParams({}, { replace: true });
        } else {
          setSearchParams({ q: v }, { replace: true });
        }
        return;
      }
      if (v === "") return;
      navigate(`/sheets?q=${encodeURIComponent(v)}`, { replace: true });
    }, 300);
    return () => window.clearTimeout(t);
  }, [searchDraft, pathname, navigate, setSearchParams, searchParams]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const sidebar = (
    <>
      <NavLink to="/dashboard" end className={({ isActive }) => navClass(isActive)}>
        <IconDashboard />
        Dashboard
      </NavLink>
      <NavLink to="/users" end className={({ isActive }) => navClass(isActive)}>
        <IconUsers />
        Users
      </NavLink>
      <NavLink to="/sheets" className={() => navClass(sheetsNavActive)}>
        <IconSheets />
        Sheets
      </NavLink>
      <NavLink to="/profile" end className={({ isActive }) => navClass(isActive)}>
        <IconProfile />
        Profile
      </NavLink>
    </>
  );

  const footer = (
    <>
      {user && <div className="sf-sidebar-user">{user.name} {user.surname}</div>}
      <Button variant="secondary" className="sf-btn-block" onClick={handleLogout}>
        Log out
      </Button>
    </>
  );

  return (
    <AppShell
      brand="Smartsheets Admin"
      user={user}
      sidebar={sidebar}
      sidebarFooter={footer}
      searchValue={searchDraft}
      onSearchChange={setSearchDraft}
      searchInputRef={searchInputRef}
      onProfileClick={() => navigate("/profile")}
    >
      <Outlet />
    </AppShell>
  );
}
