"use client";

import { useTideCloak } from "@tidecloak/nextjs";
import { useCallback } from "react";
import { SIM_USER_HEADER, SIMULATED } from "./simUsers";
import { useSimSession } from "./simulation";

/** fetch-shaped call to our own API. Pages use useExamApi(); /preview passes a fake. */
export type ExamApi = (path: string, init?: RequestInit) => Promise<Response>;

/**
 * secureFetch with an absolute URL (the DPoP proof signs the full URL) and no
 * Authorization header, so the SDK attaches `DPoP <token>` + the proof itself.
 */
export function useExamApi(): ExamApi {
  const { secureFetch } = useTideCloak();
  const session = useSimSession();
  return useCallback(
    (path, init) => {
      if (SIMULATED) {
        // Plan C: the simulated identity stands in for the Tide token (see simulatedAuth.ts).
        const headers = new Headers(init?.headers);
        if (session) headers.set(SIM_USER_HEADER, session.user);
        return fetch(path, { ...init, headers });
      }
      return secureFetch(new URL(path, window.location.origin).href, init);
    },
    [secureFetch, session]
  );
}

/** Throws a readable message on a non-2xx response. */
export async function readJson<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (res.ok) return data as T;
  if (res.status === 401) throw new Error("Your session has expired. Sign in again.");
  if (res.status === 404) throw new Error("This exam no longer exists.");
  if (res.status >= 500) throw new Error(`The server had a problem (${res.status}). Try again.`);
  throw new Error(data?.error ?? `Request failed (${res.status}).`);
}

/** Error → one sentence a user can act on. */
export function readableError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  if (/popup/i.test(message)) return "Your browser blocked the Tide approval window. Allow pop-ups for this site, then try again.";
  if (err instanceof TypeError && /fetch/i.test(message)) return "Can't reach the server. Check your connection and try again.";
  return message;
}
