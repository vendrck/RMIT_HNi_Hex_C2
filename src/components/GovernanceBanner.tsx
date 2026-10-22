import tcConfig from "../../data/tidecloak.json";
import { ShieldIcon } from "./icons";
import { SIMULATED } from "./simUsers";
import styles from "./vault.module.css";

// Console URL format from the Tide pack (canon iga-change-requests-api):
// {auth-server-url}/admin/{realm}/console/ → Change Requests. Built from the adapter config.
const consoleUrl = `${tcConfig["auth-server-url"].replace(/\/+$/, "")}/admin/${encodeURIComponent(tcConfig.realm)}/console/`;

export function GovernanceBanner() {
  return (
    <aside className={styles.notice} aria-label="How papers are opened">
      <ShieldIcon className={styles.noticeIcon} />
      <p>
        <strong>Opening an exam needs 2 of 3 committee approvals.</strong>{" "}
        {SIMULATED ? (
          <>
            In this simulation, committee members approve the exam-opener request below. Live, they
            approve it in the{" "}
            <a href={consoleUrl} target="_blank" rel="noreferrer">
              TideCloak admin console
            </a>
            .
          </>
        ) : (
          <>
            Committee members review requests for the exam-opener role in the{" "}
            <a href={consoleUrl} target="_blank" rel="noreferrer">
              TideCloak admin console
            </a>
            , under Change Requests.
          </>
        )}
      </p>
    </aside>
  );
}
