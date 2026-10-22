import type { NextRequest } from "next/server";
import type { JWTPayload } from "jose";
import { withAuth } from "@/lib/auth/protect";
import { isSimUserId, SIM_USER_HEADER, SIMULATED } from "@/components/simUsers";

type AuthHandler = (req: NextRequest, jwt: JWTPayload) => Promise<Response>;

// Plan C: with NEXT_PUBLIC_MOCK_TIDE=1 the API trusts a simulated identity header instead of a
// Tide JWT + DPoP proof. That is NOT authentication; it exists only so the demo's access checks
// still run server-side while the Tide network can't issue tokens. Mock off = real withAuth.
function withSimulatedAuth(handler: AuthHandler) {
  return async (req: NextRequest) => {
    const user = req.headers.get(SIM_USER_HEADER);
    if (!isSimUserId(user)) {
      return Response.json({ error: "Sign in (simulated) to use this API." }, { status: 401 });
    }
    return handler(req, { sub: `sim:${user}` });
  };
}

export const withExamAuth = SIMULATED ? withSimulatedAuth : withAuth;
