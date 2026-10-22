import type { ExamRow } from "@/lib/db";
import { PaperIcon } from "./icons";
import styles from "./vault.module.css";

// Presentational only (no hooks), so it renders from the server page and from /preview.
const CAPTION =
  "This is everything the server holds. The operator can read, copy or leak all of it, and it still opens nothing.";
const PREVIEW_CHARS = 120;

const bytes = (s: string) => new TextEncoder().encode(s).length;

export function ServerViewTable({ rows }: { rows: ExamRow[] }) {
  return (
    <section>
      <p className={styles.caption}>{CAPTION}</p>
      {rows.length === 0 ? (
        <div className={styles.empty}>
          <PaperIcon className={styles.emptyIcon} />
          <p>The database is empty. Upload a paper, then come back to see what the server stores.</p>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">id</th>
                <th scope="col">title</th>
                <th scope="col">ciphertext</th>
                <th scope="col">write policy</th>
                <th scope="col">read policy</th>
                <th scope="col">created_by</th>
                <th scope="col">created_at</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className={`${styles.mono} ${styles.nowrap}`}>{r.id}</td>
                  <td>{r.title}</td>
                  <td className={`${styles.mono} ${styles.cipher}`}>
                    {r.ciphertext.slice(0, PREVIEW_CHARS)}
                    {r.ciphertext.length > PREVIEW_CHARS && `… (${r.ciphertext.length} chars)`}
                  </td>
                  <td className={styles.nowrap}>{bytes(r.write_policy)} bytes</td>
                  <td className={styles.nowrap}>{bytes(r.read_policy)} bytes</td>
                  <td className={styles.mono}>{r.created_by}</td>
                  <td className={`${styles.mono} ${styles.nowrap}`}>{r.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
