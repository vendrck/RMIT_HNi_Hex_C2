"use client";

import { useSyncExternalStore } from "react";
import { OPENER_ROLE } from "@/lib/vault/crypto";
import { SIMULATED, type SimUserId } from "./simUsers";

// Plan C: simulated Tide session + the IGA change request that grants exam-opener.
// Mirrors TideCloak: 3 admins, threshold floor(3 * 0.7) = 2, the requester's own request is
// vote 1, nobody votes twice, and a committed role only reaches the token on the NEXT sign-in.
// Stored in localStorage so switching users in one browser behaves like separate sign-ins.

export const THRESHOLD = 2;

export interface SimSession {
  user: SimUserId;
  /** Snapshot taken at sign-in, like the roles in a real access token. */
  roles: string[];
}

export interface SimRequest {
  requester: SimUserId;
  votes: SimUserId[];
  committed: boolean;
}

const SESSION_KEY = "ev.sim.session";
const REQUEST_KEY = "ev.sim.request";
const CHANGE = "ev-sim-change";

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {}
  cache.delete(key);
  window.dispatchEvent(new Event(CHANGE));
}

// useSyncExternalStore needs a stable snapshot per stored value.
const cache = new Map<string, { raw: string | null; value: unknown }>();
function snapshot<T>(key: string): T | null {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(key);
  } catch {}
  const hit = cache.get(key);
  if (hit && hit.raw === raw) return hit.value as T | null;
  const value = read<T>(key);
  cache.set(key, { raw, value });
  return value;
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** undefined until mounted (server render), then the session or null. */
export function useSimSession(): SimSession | null | undefined {
  return useSyncExternalStore(
    subscribe,
    () => snapshot<SimSession>(SESSION_KEY),
    () => undefined
  );
}

export function useSimRequest(): SimRequest | null {
  return useSyncExternalStore(
    subscribe,
    () => snapshot<SimRequest>(REQUEST_KEY),
    () => null
  );
}

const baseRoles = (user: SimUserId) =>
  user === "setter" ? ["_tide_encryptor"] : ["_tide_encryptor", "_tide_decryptor", "tide-realm-admin"];

/** The simulated Tide network's answer to "may this session decrypt?". */
export function applySimulatedAccess(session: SimSession | null | undefined = read(SESSION_KEY)) {
  // crypto.ts's mock refuses decryption while mockDenied is "1".
  const allowed = !!session?.roles.includes(OPENER_ROLE);
  try {
    localStorage.setItem("mockDenied", allowed ? "0" : "1");
  } catch {}
}

export function simSignIn(user: SimUserId) {
  const request = read<SimRequest>(REQUEST_KEY);
  const granted = !!request?.committed && request.requester === user;
  const session: SimSession = { user, roles: [...baseRoles(user), ...(granted ? [OPENER_ROLE] : [])] };
  write(SESSION_KEY, session);
  applySimulatedAccess(session);
}

export function simSignOut() {
  write(SESSION_KEY, null);
  applySimulatedAccess(null);
}

export function simFileRequest(user: SimUserId) {
  write(REQUEST_KEY, { requester: user, votes: [user], committed: false } satisfies SimRequest);
}

/** Returns a message for the UI. */
export function simApprove(user: SimUserId): string {
  const request = read<SimRequest>(REQUEST_KEY);
  if (!request || request.committed) return "There is no pending request.";
  if (request.votes.includes(user)) return "Refused: you have already voted on this request. One admin cannot count twice.";
  const votes = [...request.votes, user];
  const committed = votes.length >= THRESHOLD;
  write(REQUEST_KEY, { ...request, votes, committed } satisfies SimRequest);
  return committed
    ? `Approved. ${votes.length} of ${THRESHOLD} reached: the role is granted. It applies when they next sign in.`
    : `Approved. ${votes.length} of ${THRESHOLD}.`;
}

export function simResetCommittee() {
  write(REQUEST_KEY, null);
  const session = read<SimSession>(SESSION_KEY);
  if (session) simSignIn(session.user); // drop a granted role from the current "token"
}

export { SIMULATED };
