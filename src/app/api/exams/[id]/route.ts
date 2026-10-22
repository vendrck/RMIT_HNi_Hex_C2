import { withAuth } from "@/lib/auth/protect";
import { getExam } from "@/lib/db";

// withAuth passes (req, jwt) only, so the id comes from the path: /api/exams/<id>.
// Returns ciphertext + policies; decryption happens in the opener's browser.
export const GET = withAuth(async (req) => {
  const id = decodeURIComponent(req.nextUrl.pathname.split("/").pop() ?? "");
  const exam = getExam(id);
  if (!exam) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  return Response.json({ exam });
});
