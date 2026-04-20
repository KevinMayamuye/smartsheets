export function Card({ title, action, children, className = "" }) {
  return (
    <div className={`sf-card ${className}`.trim()}>
      {(title || action) && (
        <div className="sf-card__header">
          {title && <span className="sf-card__title">{title}</span>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
