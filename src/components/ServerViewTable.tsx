import type { ExamRow } from "@/lib/db";

// Presentational only (no hooks), so it renders from the server page and from /preview.
const CAPTION =
  "This is everything the server holds. The operator can read, copy or leak all of it, and it still opens nothing.";
const PREVIEW_CHARS = 120;

const bytes = (s: string) => new TextEncoder().encode(s).length;

export function ServerViewTable({ rows }: { rows: ExamRow[] }) {
  return (
    <section>
      <p>
        <strong>{CAPTION}</strong>
      </p>
      {rows.length === 0 ? (
        <p>The database is empty.</p>
      ) : (
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              {["id", "title", "ciphertext", "write policy", "read policy", "created_by", "created_at"].map((h) => (
                <th key={h} style={{ textAlign: "left", borderBottom: "1px solid #999", padding: 4 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} style={{ verticalAlign: "top" }}>
                <td style={{ padding: 4, fontFamily: "monospace" }}>{r.id}</td>
                <td style={{ padding: 4 }}>{r.title}</td>
                <td style={{ padding: 4, fontFamily: "monospace", wordBreak: "break-all", maxWidth: "40ch" }}>
                  {r.ciphertext.slice(0, PREVIEW_CHARS)}
                  {r.ciphertext.length > PREVIEW_CHARS && `… (${r.ciphertext.length} chars)`}
                </td>
                <td style={{ padding: 4 }}>{bytes(r.write_policy)} bytes</td>
                <td style={{ padding: 4 }}>{bytes(r.read_policy)} bytes</td>
                <td style={{ padding: 4, fontFamily: "monospace" }}>{r.created_by}</td>
                <td style={{ padding: 4 }}>{r.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
