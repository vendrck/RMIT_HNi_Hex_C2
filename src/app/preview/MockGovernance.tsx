"use client";

import { useEffect, useState } from "react";
import { OPENER_ROLE } from "@/lib/vault/crypto";

// DEV ONLY. Simulates the IGA change request that grants exam-opener, the way TideCloak
// runs it with 3 admins: threshold floor(3 * 0.7) = 2, the filer's own request counts as
// vote 1, and one admin cannot vote twice. Drives the mock's denial flag, so Open stays
// Locked until the request is committed.

const ADMINS = ["Admin 1", "Admin 2", "Admin 3"] as const;
type Admin = (typeof ADMINS)[number];
const THRESHOLD = 2;

type Request = { requester: Admin; votes: Admin[]; committed: boolean };

function setDenied(denied: boolean) {
  try {
    localStorage.setItem("mockDenied", denied ? "1" : "0");
  } catch {}
}

export function MockGovernance() {
  const [request, setRequest] = useState<Request | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Start locked: nobody holds exam-opener until a request is committed.
  useEffect(() => setDenied(true), []);

  function file(requester: Admin) {
    setRequest({ requester, votes: [requester], committed: false });
    setNotice(`${requester} filed a change request: grant ${OPENER_ROLE} to ${requester}. Their own request counts as vote 1.`);
    setDenied(true);
  }

  function approve(admin: Admin) {
    if (!request || request.committed) return;
    if (request.votes.includes(admin)) {
      setNotice(`Refused: ${admin} has already voted on this request. One admin cannot count twice.`);
      return;
    }
    const votes = [...request.votes, admin];
    const committed = votes.length >= THRESHOLD;
    setRequest({ ...request, votes, committed });
    setNotice(
      committed
        ? `${admin} approved. ${votes.length} of ${THRESHOLD} reached: committed. ${request.requester} now holds ${OPENER_ROLE} after signing in again.`
        : `${admin} approved. ${votes.length} of ${THRESHOLD}.`
    );
    if (committed) setDenied(false);
  }

  function reset() {
    setRequest(null);
    setNotice(null);
    setDenied(true);
  }

  const status = !request
    ? "No request: nobody holds exam-opener"
    : request.committed
      ? `Committed (${request.votes.length}/${THRESHOLD}): ${request.requester} holds ${OPENER_ROLE}`
      : `Pending ${request.votes.length}/${THRESHOLD}: waiting for another admin`;

  return (
    <section style={{ border: "1px dashed #c00", padding: 12, margin: "12px 0" }}>
      <h2 style={{ marginTop: 0 }}>Committee (simulated change request)</h2>
      <p>
        <strong>Status:</strong> {status}
      </p>
      {!request && <button onClick={() => file("Admin 1")}>Admin 1: request {OPENER_ROLE} for myself</button>}
      {request && !request.committed && (
        <p>
          {ADMINS.map((a) => (
            <button key={a} onClick={() => approve(a)} style={{ marginRight: 8 }}>
              {a}: approve
            </button>
          ))}
        </p>
      )}
      {request && <button onClick={reset}>Reset</button>}
      {notice && <p role="status">{notice}</p>}
    </section>
  );
}
