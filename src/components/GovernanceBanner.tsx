import tcConfig from "../../data/tidecloak.json";

// Console URL format from the Tide pack (canon iga-change-requests-api):
// {auth-server-url}/admin/{realm}/console/ → Change Requests. Built from the adapter config.
const consoleUrl = `${tcConfig["auth-server-url"].replace(/\/+$/, "")}/admin/${encodeURIComponent(tcConfig.realm)}/console/`;

export function GovernanceBanner() {
  return (
    <p style={{ background: "#eef3ff", border: "1px solid #99b", padding: 8 }}>
      <strong>Opening an exam needs 2 of 3 committee approvals.</strong> Requests for the
      exam-opener role are approved in the{" "}
      <a href={consoleUrl} target="_blank" rel="noreferrer">
        TideCloak admin console
      </a>{" "}
      under Change Requests.
    </p>
  );
}
