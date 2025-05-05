import styles from "./badge.module.css";

export function Badge({ children }) {
  return <span className={styles.badge}>{children}</span>;
}
