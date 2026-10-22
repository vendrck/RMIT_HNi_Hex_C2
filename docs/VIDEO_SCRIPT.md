# Exam Vault: 2-minute video script

Recorded on Person A's machine, mock **off**, real TideCloak. Three browser profiles: **Admin 1** (uploads, then asks for `exam-opener`), **Admin 2** (approves), **Admin 3** (not used on screen, but makes the threshold 2 of 3).

Before recording:
- Admin 1 is signed in on `/upload` with no exam uploaded yet, and Admin 2 is signed in to the TideCloak admin console in a second window.
- Neither admin holds `exam-opener` yet.
- Have the exam text ready to paste, e.g. "Final Maths Paper, Q1: ...".
- Rehearse once. The re-login in Beat 5 is the slowest part. Cut it in editing if needed.

## 0:00–0:20 · The possibility

| Shot | On screen | Voice-over |
|---|---|---|
| 1 | Title card: "Exam Vault: no one opens it alone" | "This is Exam Vault. It stores exam papers so that no single person can open them." |
| 2 | Home page, then the `/upload` page | "Exam boards can prepare exams online and send them digitally, without quarantining anyone. No one, not even us, opens a paper alone. It takes two of three committee approvals." |

## 0:20–0:40 · The constraint

| Shot | On screen | Voice-over |
|---|---|---|
| 3 | Simple slide: setter → IT/admin → printer, each with an eye icon | "Today, every exam passes through people who can read it. The setter. IT. The printer." |
| 4 | Same slide, "Leak → whole cohort re-sits" | "So we add more people to watch people. And when one insider leaks a paper, every student sits it again." |

## 0:40–1:40 · The prototype (5 beats)

| Beat | Time | What to click | Voice-over |
|---|---|---|---|
| 1. Upload, can't read back | 0:40–0:52 | Admin 1, `/upload`: type a title, paste the exam text, click **Encrypt and upload**. Approve the Tide popups. Show the screen saying "You can't read this back". | "Admin 1 uploads the paper. It is encrypted in this browser, before it leaves. And Admin 1 can't read it back." |
| 2. Server sees gibberish | 0:52–1:02 | Open `/server-view`. Hover over the ciphertext column. | "This is everything the server holds. The operator can copy or leak all of it. It still opens nothing." |
| 3. Self-grant → pending → denied | 1:02–1:20 | Admin console: Users → Admin 1 → Role mapping → assign `exam-opener`. Show the change request at **1 of 2 approvals**. Back in `/exams`, click **Open** and show "Denied by the Tide network". | "Admin 1 tries to give themselves access. That becomes a change request. It needs two of three approvals, and only one is in. So the Tide network still says no." |
| 4. Second admin approves | 1:20–1:30 | Switch to Admin 2's window. Change Requests → the pending request → **Approve**. Approve in the Tide enclave popup. The request commits. | "Admin 2 reviews it and approves, in their own browser." |
| 5. Re-login → it opens | 1:30–1:40 | Admin 1: sign out, sign in, go to `/exams`, click **Open**. The exam text appears. | "Admin 1 signs in again. Now, and only now, the paper opens." |

## 1:40–2:00 · What changes

| Shot | On screen | Voice-over |
|---|---|---|
| 6 | The opened exam, then the README "Honest limits" line | "No single person can leak this paper. Not the uploader, not an admin, not the server. A colluding quorum still could, and once opened, text can be copied." |
| 7 | End card: "Exam Vault · Built with TideCloak" + repo URL | "Prepare exams online and send them digitally, without quarantining anyone. The same pattern works for sealed tenders and grade changes." |

## Checklist

- [ ] Total length ≤ 2:00, `.mp4`, < 100 MB
- [ ] Mock is off (no "MOCK:" prefix in `/server-view`)
- [ ] No real emails or personal data on screen (blur the admin console user list if needed)
- [ ] The `/preview` page is not shown
