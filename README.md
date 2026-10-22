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

<!-- TODO(A): fill after the realm bootstrap works. Base it on docs/TIDE_TEMPLATE_README.md. -->
