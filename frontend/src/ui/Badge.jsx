const VARIANTS = new Set(["complete", "progress", "risk", "blocked", "notstarted", "neutral"]);

export function Badge({ variant = "neutral", children }) {
  const v = VARIANTS.has(variant) ? variant : "neutral";
  return <span className={`sf-badge sf-badge--${v}`}>{children}</span>;
}
