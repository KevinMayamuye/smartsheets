export function Button({ variant = "primary", className = "", children, ...props }) {
  const v = ["ghost", "danger", "secondary"].includes(variant) ? variant : "primary";
  return (
    <button className={`sf-btn sf-btn--${v} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}
