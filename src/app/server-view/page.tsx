import { connection } from "next/server";
import { ServerViewTable } from "@/components/ServerViewTable";
import { listExamRows } from "@/lib/db";

// "What the operator sees": raw DB rows, read directly on the server.
// Intentionally public (no login) for the demo: everything shown is ciphertext, and the
// point is that leaking all of it opens nothing.
export default async function ServerViewPage() {
  await connection(); // read the DB per request, not once at build time
  return (
    <main>
      <h1>What the operator sees</h1>
      <ServerViewTable rows={listExamRows()} />
    </main>
  );
}
