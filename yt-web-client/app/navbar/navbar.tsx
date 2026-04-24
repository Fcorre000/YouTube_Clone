'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { User } from "firebase/auth";

import styles from "./navbar.module.css";
import SignIn from "./sign-in";
import { useTheme } from "../context/theme";
import { onAuthStateChangedHelper } from "../firebase/firebase";
import { REPO_URL, VERSION_TAG } from "../config";

function GhIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.42c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.54-3.88-1.54-.52-1.33-1.27-1.68-1.27-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.68 1.24 3.33.95.1-.74.4-1.24.72-1.53-2.56-.29-5.25-1.28-5.25-5.7 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.58.23 2.75.11 3.04.73.81 1.18 1.84 1.18 3.1 0 4.43-2.69 5.4-5.26 5.69.41.36.78 1.06.78 2.15v3.19c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  );
}

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/watch", label: "Watch" },
  { href: "/upload", label: "Upload" },
  { href: REPO_URL, label: "About the build", external: true },
];

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChangedHelper((u) => setUser(u));
    return () => unsubscribe();
  }, []);

  return (
    <nav className={styles.nav}>
      <Link href="/" className={styles.logo} aria-label="Reel home">
        <span className={styles.logoMark}>Reel</span>
        <span className={styles.logoBar} aria-hidden />
        <span className={styles.logoSub}>{VERSION_TAG}</span>
      </Link>

      <div className={styles.links}>
        {NAV_LINKS.map((link) => {
          const isActive = !link.external && pathname === link.href;
          const className = `${styles.link} ${isActive ? styles.linkActive : ""}`;
          return link.external ? (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className={className}
            >
              {link.label}
            </a>
          ) : (
            <Link key={link.label} href={link.href} className={className}>
              {link.label}
            </Link>
          );
        })}
      </div>

      <div className={styles.actions}>
        <button type="button" onClick={toggleTheme} className={styles.btn}>
          {theme === "light" ? "Dark" : "Light"}
        </button>
        <SignIn user={user} />
        <a
          href={REPO_URL}
          target="_blank"
          rel="noreferrer"
          className={`${styles.btn} ${styles.btnPrimary}`}
        >
          <GhIcon />
          <span>GitHub</span>
        </a>
      </div>
    </nav>
  );
}
