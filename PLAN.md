# Exam Vault: build plan (2 people, ~3.5 h)

_Deadline: **Fri 23 Oct, 10:00 AEDT** (confirm on Discord that submissions are still open). Background + Tide MCP answers: [FINDINGS.md](FINDINGS.md)._
_The admins' emails are in `TEAM.local.md` (gitignored). This repo is **public**, so no personal data goes in committed files._

**Pitch:** An exam vault where whoever uploads an exam can't read it back, the server only holds ciphertext, and no one can open it unless 2 of 3 committee members approve.

## How it works

- Built-in Tide contract `RelationshipAttestation:1` (no custom C#). One exam = one record, `assignmentId = examId` = the only tag.
- **Write policy**: `User` = the uploader, access `write` → they can upload but never read it back.
- **Read policy**: `Role` = `exam-opener`, access `read`.
- Granting `exam-opener` = an IGA change request. With 3 admins the threshold is `floor(3 × 0.7) = 2` (the filer counts as vote 1).
- The server stores ciphertext + the signed policies only. All routes go through `withAuth` (JWT + DPoP).

## Accounts

| Who | Role |
|---|---|
| Admin 1 | Bootstraps the realm, uploads the exam, later requests `exam-opener` |
| Admin 2 | Second vote (approves) |
| Admin 3 | Third committee member (makes the threshold 2) |

⚠️ TideCloak runs in Docker on **Person A's machine** (localhost:8080). All 3 admin browser profiles must run **on A's machine** for setup and the demo.

## Who does what

### Person A — Tide & infra (owns the realm, `.env`, the demo machine)

| # | Task | Done when |
|---|---|---|
| A1 | Answer the blockers below. Create `.env` by hand from `.env.example` (Claude's hook blocks .env edits): strong `KC_BOOTSTRAP_ADMIN_PASSWORD`, `TIDE_LICENSE_EMAIL`, `TIDE_TERMS_ACCEPTED=yes` | `.env` exists |
| A2 | Fetch the pack: `mkdir -p .tide-pack && curl -fsSL https://mcp.tide.org/pack/templates.tgz \| tar -xz -C .tide-pack` → `npm install` → `npm run init` | Stops at the invite link |
| A3 | **Before linking**, check that the redirect URIs/origins cover localhost:3000 (+ any tunnel). The roles `_tide_encryptor`, `_tide_decryptor`, `exam-opener` are already in `scripts/realm.json.template` | — |
| A4 | Admin 1 links → adapter `data/tidecloak.json` has `jwk`, `vendorId`, `homeOrkUrl` → grant `tide-realm-admin` to Admin 1 **last** → `bash .tide-pack/templates/shared/tide-doctor.sh` OK | Login works at :3000 |
| A5 | While Admin 1 is the only admin (1 vote): give Admin 1 `_tide_encryptor` + `_tide_decryptor` (NOT `exam-opener`). Admins 2 and 3 sign in once, get `_tide_decryptor`, then `tide-realm-admin` → now 2-of-3 | 3 linked admins |
| A6 | `GET /api/admin-policy`: server route (withRole admin) that fetches `/admin/realms/{realm}/iga/role-policies/name/tide-realm-admin` with the **caller's** token and returns the decoded `policy` bytes | Returns bytes |
| A7 | Fill in the 3 TODOs in `src/lib/vault/crypto.ts` using `src/lib/tide/relationship.ts`. Map contract refusals (`error.cause`) → `AccessDeniedError` | Real round trip |
| A8 | After merging B's branch: run the full demo (see below) with mock **off** | All 5 beats pass |
| A9 | Record the 2-min `.mp4` (<100 MB) on A's machine, fill in README Setup | In the repo |

### Person B — App & story (works with `NEXT_PUBLIC_MOCK_TIDE=1`, no TideCloak needed)

| # | Task | Done when |
|---|---|---|
| B1 | `src/lib/db.ts`: SQLite (`better-sqlite3`, **ask before installing**) table `exams(id, title, ciphertext, write_policy, read_policy, created_by, created_at)` | Insert/list works |
| B2 | API: `POST /api/exams` (stores ciphertext + policies, rejects anything that isn't ciphertext-shaped), `GET /api/exams`, `GET /api/exams/[id]`. Wrap with `withAuth` from `src/lib/auth/protect.ts`. Never accept or store plaintext | Routes compile |
| B3 | Pages (call **only** `src/lib/vault/crypto.ts`): `/upload` (title + text → `createExamPolicies` → `encryptExam` → POST, then "You can't read this back"), `/exams` list + Open → `decryptExam` → show it or "Denied by the Tide network" | Works with the mock |
| B4 | `/server-view`: shows raw DB rows (ciphertext) for the video | Shows gibberish |
| B5 | Governance hint on `/exams`: "Access needs 2 of 3 committee approvals" + a link to `http://localhost:8080/admin/<realm>/console/` → Change Requests. (Optional: read-only pending count via `GET /api/pending` that proxies `iga/change-requests?status=PENDING` with the caller's token. **Never approve from the server.**) | — |
| B6 | Write README sections 1–5 (≤300 words total) + the one-liner. Write the video script/voice-over | Word count ≤300 |
| B7 | Polish: clear UI states (locked / pending / opened), error messages | — |

**Notes for B (from A's setup):**
- API calls from pages **must** use `secureFetch` from `useTideCloak()` (DPoP). Plain `fetch` with a `Bearer` header gets a 401 from `withAuth`. The template's `dashboard/page.tsx` shows the wrong pattern.
- The app imports `data/tidecloak.json` (gitignored). Until A's PR is merged, create a placeholder so it builds: `{"realm":"mock","auth-server-url":"http://localhost:8080/","resource":"mock","public-client":true,"jwk":{"keys":[]},"vendorId":"mock"}`. Login won't work with it; that's expected.
- `crypto.ts` is now wired to Tide (A7 done). With `NEXT_PUBLIC_MOCK_TIDE=1` it still uses the mock.

Dev-only shortcut for B: to see pages without login, put a temporary `/preview` page that renders the components, guarded by `process.env.NODE_ENV === "development"`. **Delete it before merging.** Don't touch `src/lib/auth/*`.

## File ownership (prevents merge conflicts)

| Owner | Files |
|---|---|
| A | `scripts/*`, `next.config.ts`, `src/app/providers.tsx`, `src/lib/auth/*`, `src/lib/tide/*`, `src/lib/vault/crypto.ts` (bodies only), `src/app/api/admin-policy/*`, README `## Setup` |
| B | `src/lib/db.ts`, `src/app/api/exams/*`, `src/app/api/pending/*`, `src/app/upload/*`, `src/app/exams/*`, `src/app/server-view/*`, `src/components/*`, README sections 1–5 |
| Ask first | `package.json` (deps), `src/app/page.tsx`, `src/app/layout.tsx`, `crypto.ts` **signatures** |

## Git workflow

```bash
# Once
git clone git@github.com:vendrck/RMIT_HNi_Hex_C2.git && cd RMIT_HNi_Hex_C2
git switch -c a/tide      # Person A
git switch -c b/app       # Person B

# Often (every ~30 min): commit, then catch up with main
git add src/ README.md && git commit -m "feat: ..."   # stage your own files explicitly
git fetch origin && git rebase origin/main
git push -u origin HEAD   # after a rebase: git push --force-with-lease (your OWN branch only, never main)

# Merge into main via a PR
gh pr create --fill --base main
gh pr merge --squash --delete-branch
```

- **Merge order:** A merges first once login works (~1:00), so B can rebase onto real auth. Then B merges at ~2:15. A pulls main, flips mock off, and runs the demo.
- **Conflicts:** stick to file ownership. If `package.json` conflicts, keep both sides' dependencies, then `npm install`. Lockfile conflicts: take main's version, then `npm install` again.
- Each person runs their own Claude Code in their own clone. Tell it: "Read PLAN.md, I'm Person A/B, only touch my files."
- Never commit `.env`, `data/tidecloak.json`, `TEAM.local.md`.

## Timeline

| Time | A | B |
|---|---|---|
| 0:00–1:00 | A1–A4 bootstrap, login works → **PR #1** | B1–B2 DB + API |
| 1:00–1:45 | A5 admins, A6 admin-policy route | rebase on main, B3 pages (mock) |
| 1:45–2:15 | A7 wire crypto.ts | B4–B5 server view, governance hint → **PR #2** |
| 2:15–2:50 | A8 full demo, fix bugs | B6 README + video script, B7 polish |
| 2:50–3:30 | A9 record the video | review README ≤300 words, final check → submit |

## ⛔ Blockers
- [ ] Licence email + agreement to https://tide.org/legal T&C (A)
- [ ] OK to `npm install` / add `better-sqlite3`
- [ ] Discord: is `RelationshipAttestation:1` live on the network? Submissions still open?
- [ ] Branding / new-user fields → default: skip both

## Demo (2 min)
1. "Exam leaks come from insiders: the setter, IT, an admin."
2. Admin 1 uploads → server view shows ciphertext → Admin 1 can't read it back.
3. Admin 1 tries to open it → denied → grants themselves `exam-opener` → **pending 1/2** → still denied.
4. Admin 2 approves in the enclave → Admin 1 re-logs in → it opens.
5. "No single person — uploader, admin, server, or us — can open it alone."

## If things break

| Problem | Do |
|---|---|
| "unknown contract" when signing | Ask Tide on Discord now. Fallback: quorum-gated role + server RBAC only |
| Roles missing after approval | Wait ≤120 s / re-login |
| Login hangs / popup blank | `tide-doctor.sh`, check the CSP `frame-src` |
| A missed redirect URI after the flip | It's a 2-of-3 change request in the admin console |
| Behind at 2:30 | Drop B5's optional part and the B7 polish |
