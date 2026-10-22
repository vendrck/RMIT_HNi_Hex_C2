"use client";

import "./theme.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { paperFont, uiFont } from "./fonts";
import { LogoMark } from "./icons";
import { simUserName, SIMULATED } from "./simUsers";
import { simSignOut, useSimSession } from "./simulation";
import styles from "./vault.module.css";

const NAV = [
  { href: "/exams", label: "Papers" },
  { href: "/upload", label: "Upload a paper" },
  { href: "/server-view", label: "Server view" },
];

// Header + page frame for every Exam Vault page. devNote renders a strip under the header (/preview).
export function AppShell({ children, devNote }: { children: React.ReactNode; devNote?: React.ReactNode }) {
  const pathname = usePathname();
  const session = useSimSession();
  return (
    <div className={`${uiFont.variable} ${paperFont.variable} ${styles.shell}`}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.wordmark}>
            <LogoMark className={styles.logoMark} />
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
          {SIMULATED && session && (
            <div className={styles.headerRight}>
              <span className={styles.sessionPill}>
                <span className={styles.sessionDot} aria-hidden />
                <span>
                  <strong>{simUserName(session.user)}</strong> (simulated)
                </span>
                <button className={`${styles.buttonQuiet} ${styles.buttonSmall}`} onClick={simSignOut}>
                  Switch user
                </button>
              </span>
            </div>
          )}
        </div>
      </header>
      {devNote && (
        <div className={styles.devStrip}>
          <div className={styles.devStripInner}>{devNote}</div>
        </div>
      )}
      <main key={pathname} className={styles.main}>
        {children}
      </main>
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <span>
            Exam Vault. Built with{" "}
            <a href="https://tide.org/tidecloak" target="_blank" rel="noreferrer">
              TideCloak
            </a>
            .
          </span>
          {SIMULATED && (
            <span>
              Sign-in, roles and approvals are simulated (
              <a href="https://tide.org/unlocked/#plan-c" target="_blank" rel="noreferrer">
                Plan C
              </a>
              ).
            </span>
          )}
        </div>
      </footer>
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
