import { IconLogoGrid } from "./icons.jsx";

function initials(user) {
  if (!user) return "?";
  const a = (user.name || "").trim().charAt(0);
  const b = (user.surname || "").trim().charAt(0);
  const s = (a + b).toUpperCase();
  return s || String(user.email || "?")
    .charAt(0)
    .toUpperCase();
}

export function AppShell({
  brand,
  user,
  sidebar,
  sidebarFooter,
  children,
  searchValue = "",
  onSearchChange,
  onProfileClick,
  searchInputRef,
}) {
  return (
    <div className="sf-app">
      <header className="sf-navbar">
        <div className="sf-nav-logo">
          <div className="sf-nav-logo-dot" aria-hidden>
            <IconLogoGrid width={12} height={12} />
          </div>
          {brand}
        </div>
        <label className="sf-nav-search" role="search">
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
            <circle cx="5" cy="5" r="3.5" stroke="#9CA3AF" strokeWidth="1.2" />
            <path d="M8 8l2 2" stroke="#9CA3AF" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <input
            ref={searchInputRef}
            type="search"
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Search sheets, tasks…"
            aria-label="Search sheets"
          />
        </label>
        <div className="sf-nav-right">
          <div className="sf-nav-bell" aria-hidden title="Notifications">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path
                d="M7 1a4 4 0 00-4 4v3l-1 1.5h10L11 8V5a4 4 0 00-4-4z"
                stroke="#6B7280"
                strokeWidth="1.2"
              />
              <path d="M5.5 11.5a1.5 1.5 0 003 0" stroke="#6B7280" strokeWidth="1.2" />
            </svg>
            <span className="sf-nav-bell-badge" />
          </div>
          <button
            type="button"
            className="sf-nav-avatar"
            title={user ? `${user.name} ${user.surname}`.trim() : ""}
            aria-label="Profile"
            onClick={() => onProfileClick?.()}
          >
            {initials(user)}
          </button>
        </div>
      </header>

      <div className="sf-body">
        <aside className="sf-sidebar">
          <nav className="sf-sidebar-nav">{sidebar}</nav>
          {sidebarFooter && <div className="sf-sidebar-footer">{sidebarFooter}</div>}
        </aside>
        <div className="sf-main">
          <div className="sf-main-inner">{children}</div>
        </div>
      </div>
    </div>
  );
}
