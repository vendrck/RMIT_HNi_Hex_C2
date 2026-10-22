# UNLOCKED (Tide × RMIT hackathon, Challenge 2): findings log

_Last updated: 2026-10-22_

## 1. The challenge

Source: https://tide.org/unlocked

- Build a small working prototype with **TideCloak integrated**. It should show something that is blocked today by a trust, privacy or security trade-off, and that becomes possible when **no single admin, organisation or AI can unilaterally override the rules**.
- **Judging test:** "If your app would work exactly the same with ordinary login and backend permissions, develop the idea further." TideCloak has to change what the app can credibly do.
- Synthetic data and mocked systems are fine. It doesn't need to be a finished product.
- Steps: pick a possibility → connect a coding agent to Tide MCP (Plan B: Quickstart template) → build → demo and submit.

### Deliverables (one **public** GitHub repo, link submitted via Google Form)
- [ ] Prototype code with TideCloak integrated
- [ ] README: Tide's template at the top, a one-sentence description, then the 5 prompts in **≤300 words** total. Setup goes in a separate section.
- [ ] Demo video, **2 min**, `.mp4` in the repo, **<100 MB**
  - Suggested flow: possibility → constraint → prototype and TideCloak's role → what changes for people

### The 5 README prompts (= the template headings = the judging criteria)
1. **Vision & originality**: what you're proposing and what makes it distinctive
2. **Trust constraint insight**: what's impossible today because of trust or privacy, and what becomes possible once that's removed
3. **Value & impact**: who benefits, with one concrete example
4. **Why TideCloak matters**: how the integration is what makes the idea possible
5. **Prototype & storytelling**: what the demo shows and the key interaction to watch for

### Deadline ⚠️
- **Melbourne: Fri 23 Oct 2026, 10:00 AEDT**
- Vietnam / Malaysia: Thu 22 Oct 2026, 6:00 pm
- The page shows **"Submissions have closed."** → **confirm on Discord `#support` that you can still submit.**

### Links
- TideCloak overview: https://tide.org/tidecloak
- MCP / agent plugins: https://tide.org/agent-plugins
- Quickstart: https://docs.tide.org/get-started/Tidecloak%20Quickstart
- Emergent Authority blog: https://tide.org/blog/emergent-authority-beyond-cybersecurity
- Next.js template source: https://github.com/tide-foundation/tidecloak-js/tree/main/packages/tidecloak-create-nextjs
- Not found on the page: the Google Form link, prizes, eligibility, FAQ

## 2. What TideCloak is

- **Keycloak-compatible IAM** ("built on top of Keycloak", according to Tide). It includes standard SSO, OIDC/OAuth2, users, groups, roles, RBAC/ABAC, passwordless login, an admin console and a REST admin API.
- **Tide's addition:** cryptographic authority is spread across independent Tide network nodes. Protected operations (sealing, authorising, decrypting) only happen when identity, policy and approvals line up. No single party holds the full key. Tide calls this **"Emergent Authority"**.
- **Confirmed on Tide's pages:**
  - Quorum-Enforced Governance (no "god-mode" admin; the quickstart enables it by default)
  - Tamper-proof authorisation seals
  - Login without a central password store
  - E2EE bound to a one-time, device-specific session key
- **Not confirmed yet:** an explicit encrypt/decrypt-by-role API, a signing API, quorum mechanics (number of approvers, flow), and the underlying crypto (threshold/MPC). All "immunity" claims are vendor statements.
- SDKs: React, Next.js (`@tidecloak/nextjs`), JavaScript, C#

### Quickstart (dev mode)
```bash
# Prereqs: Docker, Node >= 20.9, curl, jq
sudo docker run --name mytidecloak -d -v .:/opt/keycloak/data/h2 -p 8080:8080 \
  -e KC_BOOTSTRAP_ADMIN_USERNAME=admin -e KC_BOOTSTRAP_ADMIN_PASSWORD=password \
  tideorg/tidecloak-dev:latest
npm init @tidecloak/nextjs@latest my-app   # prints a Tide enrollment URL; complete it, the script waits for it
cd my-app && npm install && npm run dev    # http://localhost:3000
```
- Admin console: `http://localhost:8080/realms/{realm}/tide-console/`
- `admin/password` are dev-only defaults. Don't reuse them anywhere else.

## 3. MCP setup

- The first `claude mcp add` was run from `~`, so it was registered to the home directory only (local scope is per directory).
- It has been re-added from `rmitc2`: `tide` → `https://mcp.tide.org/mcp`, local scope, **✔ Connected**.
- Tools load only when a session starts → **restart Claude Code** (`claude --continue`). Tide calls the server "Raziel".

## 4. Project ideas

The pattern that fits TideCloak most safely: **a human encrypts in the browser → the server stores only ciphertext → a role, granted by quorum approval, unlocks decryption.**

| # | Idea | Status |
|---|---|---|
| A | **Leash**: the AI agent's powers are roles, and new powers need human quorum approval | ❌ **Ruled out by the MCP** (GAP-063/064): no headless auth and no service-account decryption. Only the "operator console" pattern works, where each agent role runs in its own human browser session |
| **B** | **Exam vault**: the setter encrypts the exam in the browser, the server holds only ciphertext, the "open exam" role needs 2/3 committee approval, and an admin who self-grants it is blocked | ✅ **Current pick.** Fits the browser + quorum model, and it's a real problem (insider leaks) |
| C | **Sealed tenders / scholarship applications**: unreadable until a committee quorum opens them | Same code as B with a business angle. Strong alternative |
| D | **Research participant data vault**: decryption only after the ethics committee grants access by quorum | Fits RMIT's research setting |
| E | **Misconduct report escrow**: reports unlock only on committee quorum | Strong emotional story |
| F | **Break-glass patient records**: ED access needs 2 clinicians | Matches Tide's own example, so expect overlap with other teams |

### Planned demo beats for B
1. The DB / server view shows only ciphertext.
2. The admin grants themselves "open exam" → the change sits **pending approval**.
3. Approval 1 → still locked.
4. Approval 2 → the exam decrypts in the browser.

## 5. Open questions → answers from the Tide MCP (Agent Pack v1.9.33)

1. **Encrypt/decrypt by role: YES, in two models.**
   - *Self-encryption*: `doEncrypt`/`doDecrypt` from `useTideCloak()` with roles `_tide_{tag}.selfencrypt/.selfdecrypt`. **Only the encrypting user can ever decrypt.** It can't be upgraded to sharing later.
   - *Shared*: the **built-in contract `RelationshipAttestation:1`**, which needs no C# and no deployment. A policy names `subjectType` (`User`/`Group`/`Role`) + `subjectId`, `assignmentId` (the record id, which must also be the **only** tag on each item), and `roles` (a JSON *string*: `["_tide_encryptor"]` = write-only, `["_tide_decryptor"]` = read-only). The caller must also hold the realm role `_tide_encryptor`/`_tide_decryptor`. A realm admin signs each policy once in the enclave popup.
   - Template: `.tide-pack/templates/relationship-attestation/relationship.ts` → `buildRelationshipPolicy`, `signRelationshipPolicy`, `encryptForRecord`, `decryptForRecord`.
   - Measured: data encrypted under one policy **decrypts under a different policy for the same record**. So the setter can get a write-only policy and the openers a read-only one.
   - ⚠️ The contract has been on ORK `main` only since **2026-10-16**. Its presence on the live network is ASSUMED. If policy signing fails with "unknown contract", stop and ask Tide on Discord. Don't write a custom contract.
2. **Quorum = IGA change requests.** Every admin change (e.g. granting a role) creates a pending change request (CR). The threshold is **`max(1, floor(admins × 0.7))`** and can't be configured (3 admins → 2). **Filing a CR counts as the filer's approval**, so the filer can't count twice (409). In multiAdmin mode, each approval is an enclave popup in that admin's **own browser**. The built-in Admin Console → Change Requests UI works, so a custom panel is optional.
3. **Service accounts / headless agents: NO.** GAP-064: no headless, client-credentials or device-code path to a doken. GAP-063: signing is browser-only. A background job **cannot decrypt**. The only agent pattern is one human-owned browser session per agent role, and compromising that session = compromising the approver. → Idea A is dead.
4. **Pending state in our own UI: possible** via `GET /admin/realms/{realm}/iga/change-requests?status=PENDING` (through a same-origin proxy because of CORS). **Never** approve server-side on someone's behalf (AP-89/AP-37): approvals use the admin's own token from their browser. For the hackathon, show the built-in console, or a read-only "pending 1/2" badge.
5. **Every user needs their own Tide account** and must sign in once (policies name their key/roles). Every admin also needs account linking via an invite. → Plan **4 Tide accounts** (setter + 3 committee/admins), using separate browser profiles and real emails. Enrolment takes "a few minutes" each.
6. **Local Docker (`tideorg/tidecloak-dev`) is enough.** Licensing happens automatically in `setUpTideRealm` (it calls Tide's licensing service). **But before any realm setup, the MCP requires the USER to give: (a) a real licence email, (b) agreement to https://tide.org/legal T&C.** The realm can't be moved between local and hosted Skycloak later, so local is the right choice.
   - **One-way door:** granting `tide-realm-admin` flips the realm to multiAdmin. After that, every config change needs enclave approvals. Do **all** roles, redirect URIs/origins and client config **before** that grant.
   - The admin password goes in `.env` (gitignored), never hardcoded. Fetch the pack templates into `.tide-pack/` (gitignored).
7. **Organisers:** still to ask on Discord whether submissions are open until Fri 23 Oct 10:00 AEDT.

## 6. Revised design: Exam vault on `RelationshipAttestation:1`

- **Record** = one exam (`assignmentId = exam-<id>`, the only tag).
- **Setter**: `User` policy, `roles=["_tide_encryptor"]` → **write-only drop box**. They can upload the exam and **can't re-read it** afterwards.
- **Openers**: `Role` policy, subject = realm role `exam-opener`, `roles=["_tide_decryptor"]` → read-only.
- **Committee = the 3 realm admins.** Giving anyone `exam-opener` (or `_tide_decryptor`) is an IGA CR that needs **2 of 3**.
- **Server**: stores ciphertext + signed policy bytes only. It verifies the JWT + DPoP on every route.
- **Demo beats:** (1) the DB holds only ciphertext → (2) Admin A grants themselves `exam-opener` → CR **pending 1/2**, decrypt refused by the ORKs → (3) Admin B approves in the enclave → commit → (4) Admin A re-logs in → the exam decrypts in the browser → (5) the setter tries to read the exam back → refused.
- **Honest limits (for the README):** granting the role opens *every* exam under that role policy (use one role/group per exam if needed). Revocation only takes effect at the next token refresh. Once someone decrypts, they can still copy the plaintext.
- **Fallback if the built-in contract is missing:** quorum-governed roles + server-side RBAC only (weaker: the server could read). Ask Tide first.
