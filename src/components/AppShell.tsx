"use client";

import "./theme.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { paperFont, uiFont } from "./fonts";
import styles from "./vault.module.css";

const NAV = [
  { href: "/exams", label: "Papers" },
  { href: "/upload", label: "Upload a paper" },
  { href: "/server-view", label: "Server view" },
];

// Header + page frame for every Exam Vault page. devNote renders a strip under the header (/preview).
export function AppShell({ children, devNote }: { children: React.ReactNode; devNote?: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className={`${uiFont.variable} ${paperFont.variable} ${styles.shell}`}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/exams" className={styles.wordmark}>
            Exam Vault
          </Link>
          <nav aria-label="Main" className={styles.nav}>
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={styles.navLink}
                aria-current={pathname === item.href ? "page" : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      {devNote && (
        <div className={styles.devStrip}>
          <div className={styles.devStripInner}>{devNote}</div>
        </div>
      )}
      <main className={styles.main}>{children}</main>
    </div>
  );
}

export function PageHead({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className={styles.pageHead}>
      <h1 className={styles.title}>{title}</h1>
      {children && <p className={styles.lede}>{children}</p>}
    </div>
  );
}
