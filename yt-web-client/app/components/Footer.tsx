import { REPO_URL } from "../config";
import styles from "./Footer.module.css";

const STACK = [
  "Next.js 15 · React 19",
  "Firebase Auth + Firestore",
  "Cloud Run · Pub/Sub",
  "ffmpeg · Docker",
];

const SOURCE = [
  { label: "Web client", href: `${REPO_URL}/tree/main/yt-web-client` },
  { label: "API service", href: `${REPO_URL}/tree/main/yt-api-service` },
  { label: "Video worker", href: `${REPO_URL}/tree/main/video-processing-service` },
  { label: "README.md", href: `${REPO_URL}#readme` },
];

export default function Footer() {
  return (
    <footer className={styles.foot}>
      <div>
        <h5 className={styles.head}>About this project</h5>
        <p className={styles.lede}>
          A full-stack video streaming platform built to practice microservices,
          async pipelines, and cloud infra.
        </p>
        <p className={styles.line}>Built by a student engineer, 2026.</p>
      </div>

      <div>
        <h5 className={styles.head}>Stack</h5>
        {STACK.map((s) => (
          <span key={s} className={styles.line}>
            {s}
          </span>
        ))}
      </div>

      <div>
        <h5 className={styles.head}>Source</h5>
        {SOURCE.map((s) => (
          <a key={s.label} href={s.href} target="_blank" rel="noreferrer" className={styles.link}>
            {s.label}
          </a>
        ))}
      </div>

      <div className={styles.disclaimer}>
        <span>Demo data · videos shown are placeholders</span>
        <span>Not affiliated with YouTube</span>
        <span>Source: MIT · 2026</span>
      </div>
    </footer>
  );
}
