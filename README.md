[![Built with TideCloak](https://tide.org/badges/built-with-tidecloak.svg)](https://tide.org/tidecloak?utm_source=github&utm_medium=readme&utm_campaign=unlocked)

## Project overview

Exam Vault lets exam boards prepare papers online months ahead and deliver them digitally to exam centres, because no single person, not the setter, IT, the server operator or us, can open a paper without 2 of 3 committee approvals.

Built with [TideCloak](https://tide.org/tidecloak?utm_source=github&utm_medium=readme&utm_campaign=unlocked).

<!-- The 5 sections below must total 300 words or fewer. -->

### 1. Vision & originality

<!-- What new product, service, experience or way of working are you proposing? What makes your idea distinctive? -->

Exams prepared online and sent digitally to exam centres, without quarantined setter teams or sealed print runs. Nobody, not the setter, IT or the server operator, can open a paper alone: it takes 2 of 3 committee approvals. The same pattern fits sealed tenders and grade changes.

### 2. Trust constraint insight

<!-- What is difficult, risky or impossible today because trust, privacy or security gets in the way? Explain what becomes possible when that constraint is removed. -->

Today every exam passes through people who can read it: the setter, IT, the printer. The fix is more people watching people, yet one leak still forces a cohort re-sit. Remove that constraint and papers can live on a server and travel digitally, because holding the server no longer means holding the paper.

### 3. Value & impact

<!-- Who would benefit, and how would their lives or work improve? Give a concrete example of why this matters. -->

National exam boards and universities can deliver papers online without trusting any insider. Students gain most: if one administrator photographs a national maths paper the night before, every candidate re-sits it. With Exam Vault, that administrator never holds a readable copy.

### 4. Why TideCloak matters

<!-- How does your application use TideCloak, and how does that integration help enable your idea? Connect the technology to the possibility you are demonstrating. -->

The exam is encrypted in the setter's browser. The server stores only ciphertext and signed policies. The decryption key never exists in one place: the Tide network releases it only to an `exam-opener` role holder. Granting that role is an IGA change request that needs 2 of 3 admins, enforced by the network, so an admin cannot grant it to themselves. Without TideCloak, whoever runs the server can always read the database or grant themselves access.

### 5. Prototype & storytelling

<!-- What does your prototype demonstrate today? Describe the key interaction judges should look for. -->

An admin uploads an exam and cannot read it back. The server view shows only gibberish. The admin grants themselves `exam-opener`: the request sits at 1 of 2 approvals, and opening is still denied. A second admin approves; after re-login, it opens.

**Honest limits:** a colluding quorum can still open it, opened plaintext can be copied, and revocation applies at the next login.

## Setup

> **Status:** the Tide network is under heavy load during the hackathon, and licensing a new
> TideCloak realm currently fails (`TIDE-IDPEXT-VENDOR-KEYGEN_FAILED`). Following the organisers'
> [Plan C](https://tide.org/unlocked/#plan-c), the prototype runs with sign-in, encryption and the
> committee vote **simulated**. The real Tide wiring is in place and switches on with one flag.

### Requirements

- Node.js 20.9+
- For live mode only: Docker, `curl`, `jq`

### Run the simulated demo (no TideCloak needed)

```bash
npm install
git restore public/silent-check-sso.html   # @tidecloak/js rewrites this Tide file on install; keep it byte-identical
echo "NEXT_PUBLIC_MOCK_TIDE=1" > .env.local
mkdir -p data && cat > data/tidecloak.json <<'EOF'
{ "realm": "stub", "auth-server-url": "http://localhost:8080", "resource": "stub", "public-client": true }
EOF
npm run dev
```

Open **http://localhost:3000**, click **Try the demo**, and follow the five beats:

1. Sign in as **Exam setter**. On **Upload a paper**, enter a title and text, then click
   **Encrypt and upload**. On **Papers**, click **Open**: refused, the setter is write-only.
2. **Server view** shows the only thing the server stores: ciphertext and policies.
3. **Switch user** to **Admin 1**. **Open** is refused. In **Committee approvals**, click
   **Request exam-opener for me** (1 of 2), then **Try to approve your own request**: refused.
4. **Switch user** to **Admin 2** and click **Approve as Admin 2**. The request commits (2 of 2).
5. **Switch user** back to **Admin 1** (signing in again picks up the role) and click **Open**.
   The paper opens.

What is simulated: sign-in (a picker instead of the Tide enclave), the Tide encryption (mock mode
stores `MOCK:` + base64, which is **not** encryption) and the IGA change request. The API still
checks identity (401 without one), validates ciphertext, and writes the real database.
`/preview` is the same flow on one page, with an in-memory API.

### Run live (when the Tide network is available)

```bash
cp .env.example .env    # set KC_BOOTSTRAP_ADMIN_PASSWORD to a strong value
TIDE_LICENSE_EMAIL=<your email> TIDE_TERMS_ACCEPTED=yes npm run init
```

`npm run init` starts TideCloak (`tideorg/tidecloak-dev`) on port 8080, creates the `exam-vault`
realm with IGA, licenses it to your email under [Tide's terms](https://tide.org/legal), and prints
an invite link. Open it to link your admin Tide account; the script then writes
`data/tidecloak.json`. Set `NEXT_PUBLIC_MOCK_TIDE=0` in `.env.local` and run `npm run dev`.
For the 2-of-3 committee, link two more admins (see `PLAN.md`, task A5).

macOS note: `scripts/init-tidecloak.sh` is written for Linux. On macOS it currently stops at
`chown` (without `sudo`) and at GNU-style `sed -i`; both need a small patch to the script.

### Pages and API

| Route | What it is |
|---|---|
| `/upload` | Encrypt a paper in the browser and upload the ciphertext (sign-in required) |
| `/exams` | List papers; **Open** decrypts in the browser only if the Tide network agrees |
| `/server-view` | Raw database rows: what the operator sees (public on purpose: it is all ciphertext) |
| `/preview` | The simulated demo above (development only) |
| `POST /api/exams`, `GET /api/exams`, `GET /api/exams/[id]` | JWT + DPoP verified (`withAuth`); rejects anything that is not ciphertext-shaped |

Tests: `npm test`.
