"use client";

import { useTideCloak } from "@tidecloak/nextjs";
import { useCallback } from "react";

/** fetch-shaped call to our own API. Pages use useExamApi(); /preview passes a fake. */
export type ExamApi = (path: string, init?: RequestInit) => Promise<Response>;

/**
 * secureFetch with an absolute URL (the DPoP proof signs the full URL) and no
 * Authorization header, so the SDK attaches `DPoP <token>` + the proof itself.
 */
export function useExamApi(): ExamApi {
  const { secureFetch } = useTideCloak();
  return useCallback(
    (path, init) => secureFetch(new URL(path, window.location.origin).href, init),
    [secureFetch]
  );
}

/** Throws with the server's { error } message on a non-2xx response. */
export async function readJson<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error ?? `${res.status} ${res.statusText}`);
  return data as T;
}
