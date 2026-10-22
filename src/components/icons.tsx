// Inline icons (no icon library). Decorative unless a title is passed.

type IconProps = { className?: string; title?: string };

const a11y = (title?: string) => (title ? { role: "img", "aria-label": title } : { "aria-hidden": true });

export function LogoMark({ className, title }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} {...a11y(title)}>
      <rect width="32" height="32" rx="8" fill="var(--ink)" />
      <circle cx="16" cy="16" r="9" fill="none" stroke="var(--seal-logo, #ef8396)" strokeWidth="2.5" />
      <circle cx="16" cy="16" r="3.5" fill="var(--seal-logo, #ef8396)" />
    </svg>
  );
}

export function LockIcon({ className, title }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" {...a11y(title)}>
      <rect x="3" y="7" width="10" height="7" rx="1.5" />
      <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
    </svg>
  );
}

export function UnlockIcon({ className, title }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" {...a11y(title)}>
      <rect x="3" y="7" width="10" height="7" rx="1.5" />
      <path d="M5.5 7V5a2.5 2.5 0 0 1 4.9-.7" />
    </svg>
  );
}

export function ShieldIcon({ className, title }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" {...a11y(title)}>
      <path d="M12 3 4.5 6v5.5c0 4.4 3.1 8.2 7.5 9.5 4.4-1.3 7.5-5.1 7.5-9.5V6L12 3Z" />
      <path d="m8.8 12.2 2.2 2.2 4.3-4.6" strokeLinecap="round" />
    </svg>
  );
}

export function PaperIcon({ className, title }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" {...a11y(title)}>
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M14 3v4h4M9 12h6M9 16h6" strokeLinecap="round" />
    </svg>
  );
}

export function CheckIcon({ className, title }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...a11y(title)}>
      <path d="m3.5 8.5 3 3 6-7" />
    </svg>
  );
}
