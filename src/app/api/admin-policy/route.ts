import { readFileSync } from "fs";
import { join } from "path";
import { withRole } from "@/lib/auth/protect";

// The realm's signed admin policy, needed by signRelationshipPolicy() in an admin's browser.
// Produced by scripts/fetch-admin-policy.sh so master-admin credentials stay out of the app.
// Only realm admins sign policies, so only they get it.
export const GET = withRole("tide-realm-admin", async () => {
  try {
    const file = join(process.cwd(), "data", "admin-policy.json");
    const { policy } = JSON.parse(readFileSync(file, "utf-8")) as { policy: string };
    return Response.json({ policy });
  } catch {
    return Response.json(
      { error: "Admin policy not found. Run: bash scripts/fetch-admin-policy.sh" },
      { status: 503 }
    );
  }
});
