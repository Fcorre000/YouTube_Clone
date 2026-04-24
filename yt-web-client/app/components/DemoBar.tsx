import styles from "./DemoBar.module.css";

export default function DemoBar() {
  return (
    <div className={styles.bar}>
      <span className={styles.tag}>◉ Portfolio project</span>
      <span className={styles.divider} aria-hidden />
      <span className={styles.desc}>
        Full-stack YouTube-style streaming demo · microservices on Google Cloud
      </span>
    </div>
  );
}
