"use client";

import { useState } from "react";
import { OPENER_ROLE } from "@/lib/vault/crypto";
import { SIM_USERS, simUserName, type SimUserId } from "./simUsers";
import {
  simApprove,
  simFileRequest,
  simResetCommittee,
  simSignIn,
  THRESHOLD,
  useSimRequest,
  useSimSession,
} from "./simulation";
import { CheckIcon } from "./icons";
import styles from "./vault.module.css";

const ADMINS = SIM_USERS.filter((u) => u.id !== "setter");

// Plan C: the IGA change request that grants exam-opener, acted on by whoever is signed in.
// In live mode this happens in the TideCloak admin console, with an enclave approval per admin.
export function CommitteePanel() {
  const session = useSimSession();
  const request = useSimRequest();
  const [notice, setNotice] = useState<string | null>(null);
  if (!session) return null;

  const me = session.user;
  const isAdmin = me !== "setter";
  const votes = request?.votes.length ?? 0;
  const holdsRole = session.roles.includes(OPENER_ROLE);
  const grantedButStale = !!request?.committed && request.requester === me && !holdsRole;

  let status: string;
  if (!request) status = "No request. Nobody holds exam-opener.";
  else if (request.committed) status = `Granted to ${simUserName(request.requester)} (${votes} of ${THRESHOLD}).`;
  else status = `${simUserName(request.requester)} asked for exam-opener. ${votes} of ${THRESHOLD} approvals.`;

  return (
    <section className={styles.committee} aria-label="Committee">
      <h2 className={styles.committeeTitle}>Committee approvals</h2>
      <p className={styles.muted}>{status}</p>
      <div className={styles.meter} aria-hidden>
        <div
          className={`${styles.meterFill} ${request?.committed ? styles.meterDone : ""}`}
          style={{ width: `${Math.min(100, (votes / THRESHOLD) * 100)}%` }}
        />
      </div>

      {request && (
        <ul className={styles.voters}>
          {ADMINS.map((a) => {
            const voted = request.votes.includes(a.id);
            return (
              <li key={a.id} className={styles.voter}>
                <span className={`${styles.avatar} ${voted ? styles.avatarYes : ""}`} aria-hidden>
                  {voted ? <CheckIcon className={styles.sealIcon} /> : a.name.slice(-1)}
                </span>
                {a.name}
                <span className={styles.voterState}>
                  {voted ? (a.id === request.requester ? "requested (vote 1)" : "approved") : "not yet"}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {!isAdmin && <p className={styles.muted}>Only committee members can request or approve.</p>}

      {isAdmin && !request && (
        <button
          className={styles.button}
          onClick={() => {
            simFileRequest(me);
            setNotice("Change request filed. It counts as your vote; another admin must approve.");
          }}
        >
          Request exam-opener for me
        </button>
      )}

      {isAdmin && request && !request.committed && (
        // The requester can still press it, to show that a second vote from them is refused.
        <button
          className={request.votes.includes(me) ? styles.buttonQuiet : styles.button}
          onClick={() => setNotice(simApprove(me as SimUserId))}
        >
          {request.votes.includes(me) ? "Try to approve your own request" : `Approve as ${simUserName(me)}`}
        </button>
      )}

      {grantedButStale && (
        <button className={styles.button} onClick={() => simSignIn(me)}>
          Sign in again to pick up the role
        </button>
      )}

      {notice && (
        <p className={styles.committeeNotice} role="status">
          {notice}
        </p>
      )}

      {request && (
        <button
          className={`${styles.buttonQuiet} ${styles.buttonSmall}`}
          onClick={() => {
            simResetCommittee();
            setNotice(null);
          }}
        >
          Reset the demo request
        </button>
      )}
    </section>
  );
}
