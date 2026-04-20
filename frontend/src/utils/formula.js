/**
 * Minimal safe formula evaluation for spreadsheet cells.
 * Supports: leading = optional, numbers, + - * / ( ) and spaces.
 * Example: "=1+2*3", "=(10+5)/3"
 */
export function evaluateFormula(input) {
  if (input == null || input === "") return "";
  const s = String(input).trim();
  if (!s.startsWith("=")) return s;
  const expr = s.slice(1).replace(/\s/g, "");
  if (!/^[\d+\-*/().]+$/.test(expr)) {
    return "#ERR";
  }
  try {
    const fn = new Function(`return (${expr})`);
    const v = fn();
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
    return "#ERR";
  } catch {
    return "#ERR";
  }
}
