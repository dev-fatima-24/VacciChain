# VacciChain Usability Test Plan

**Version:** 1.0  
**Target launch gate:** v1.0 mainnet  
**Sessions required:** ≥ 5 (mix of patients and healthcare workers)  
**Estimated session length:** 45–60 minutes  
**Format:** Moderated, think-aloud, remote or in-person

---

## 1. Goals

1. Identify friction in the wallet connection and SEP-10 auth flow for first-time users.
2. Assess whether patients can independently locate and understand their vaccination records.
3. Assess whether healthcare workers can issue a vaccination record without assistance.
4. Assess whether third-party verifiers (employers, border agents) can verify a wallet without guidance.
5. Surface any terminology, error message, or layout issues before mainnet launch.

---

## 2. Participant Profiles

Recruit at least 5 participants across two profiles. Aim for 3 patients and 2 healthcare workers minimum.

### Profile A — Patient (3+)
- Owns a smartphone or laptop
- Has used at least one mobile app in the past month
- No prior blockchain or crypto experience required
- Represents the general public who will receive vaccination records

### Profile B — Healthcare Worker / Issuer (2+)
- Works in a clinical or administrative healthcare role
- Comfortable using web-based forms (e.g. patient management systems)
- No prior blockchain experience required
- Will be given a pre-authorized testnet issuer wallet for the session

### Screener questions (use in recruitment)
1. Have you ever received a vaccination in the past 5 years? *(Patient profile)*
2. Do you currently work in a healthcare setting? *(Issuer profile)*
3. Have you ever used a browser extension to log into a website? *(Both — gauges tech comfort)*
4. Have you ever used a cryptocurrency wallet? *(Record for context; not a filter)*

---

## 3. Test Environment

| Item | Detail |
|---|---|
| URL | Testnet demo: `http://localhost:3000` (or live demo URL) |
| Browser | Chrome or Brave with Freighter extension pre-installed |
| Freighter setup | Pre-configured testnet wallet loaded for each participant |
| Patient wallet | Funded testnet account with 0–2 existing vaccination records |
| Issuer wallet | Pre-authorized testnet issuer account |
| Screen recording | Participant consent required; record screen + audio only |
| Facilitator tools | This guide + observation sheet (one per participant) |

**Before each session:**
- Clear browser localStorage (`vaccichain_wallet` key) to simulate a fresh visit.
- Confirm Freighter is set to **Testnet** and the correct account is loaded.
- Have the patient wallet address ready to paste for the issuer scenario.

---

## 4. Scenarios and Tasks

Each scenario is given to the participant as a realistic situation, not a step-by-step instruction. Read the scenario prompt aloud. Do not demonstrate the steps.

---

### Scenario 1 — Connect Wallet (Both profiles, ~10 min)

**Prompt:**
> "You've heard that VacciChain stores vaccination records on the blockchain. You've just opened the app for the first time. Please go ahead and connect your wallet so you can use the app."

**Success criteria:**
- Participant reaches the Landing page and clicks "Connect Freighter Wallet"
- Freighter popup appears and participant approves
- SEP-10 signing prompt appears and participant signs
- Participant sees the connected state (truncated address shown)

**Observe:**
- Does the participant notice the "Connect Freighter Wallet" button without prompting?
- Does the participant understand what Freighter is from the page alone?
- Does the participant understand the SEP-10 signing prompt ("What am I signing?")?
- Any hesitation, confusion, or abandonment at the signing step?
- Does the "requiresFreighter" info text help or go unread?

**Failure / recovery:** If participant cannot proceed after 3 minutes, note the point of failure and assist. Do not count as a success.

---

### Scenario 2 — View Vaccination Records (Patient profile, ~10 min)

**Prompt:**
> "Your doctor told you that your COVID-19 vaccination has been recorded on VacciChain. Please find your vaccination records and tell me what information is shown."

**Pre-condition:** Participant is connected (from Scenario 1). Patient wallet has 1–2 existing records.

**Success criteria:**
- Participant navigates to Patient Dashboard
- Records are visible and participant can identify vaccine name, date, and issuer
- Participant can open a record detail modal (if applicable)
- Participant can copy their wallet address using the copy button

**Observe:**
- Does the participant find the navigation to Patient Dashboard without help?
- Is the NFT card layout clear — do they understand what each field means?
- Does the term "token ID" cause confusion?
- Does the empty state ("No vaccination records found") make sense if shown?
- Does the pagination work intuitively if multiple records exist?

---

### Scenario 3 — Issue a Vaccination Record (Issuer profile, ~15 min)

**Prompt:**
> "A patient has just received their flu vaccination at your clinic. Their Stellar wallet address is: `[paste address]`. Please record this vaccination in VacciChain."

**Pre-condition:** Participant is connected with an issuer wallet. Provide the patient address on a sticky note or chat message.

**Success criteria:**
- Participant navigates to Issuer Dashboard
- Participant fills in patient address, vaccine name ("Influenza"), and today's date
- Participant submits the form and sees the confirmation (token ID + Stellar Explorer link)
- No form errors on a valid submission

**Observe:**
- Does the participant understand the "Patient Stellar Address" field? Do they know where to get it?
- Does the `G...` placeholder help or confuse?
- Does the date picker work as expected on their OS/browser?
- Does the participant notice and understand the confirmation message?
- Does the "View on Stellar Explorer" link get clicked? Is it understood?
- What happens if they submit with an invalid address — is the error message clear?

---

### Scenario 4 — Verify a Wallet (Both profiles, ~10 min)

**Prompt:**
> "A job applicant has given you their Stellar wallet address and claims they are vaccinated against COVID-19. Please verify their vaccination status using VacciChain."

**Pre-condition:** Participant does not need to be connected. Provide a wallet address with known records.

**Success criteria:**
- Participant navigates to the Verify page
- Participant enters the wallet address and submits
- Participant correctly reads the verification result (vaccinated / not vaccinated badge)
- Participant can identify which vaccines are on record

**Observe:**
- Does the participant find the Verify page without help?
- Is the input placeholder (`G...` or translated text) sufficient guidance?
- Does the VerificationBadge clearly communicate vaccinated vs. not vaccinated?
- Does the participant trust the result? Do they ask "how do I know this is real?"
- Does the shareable URL (`?wallet=...`) get noticed or used?

---

## 5. Facilitator Script

### Opening (read aloud)
> "Thank you for joining today. We're testing the VacciChain application — we're not testing you. There are no right or wrong answers. Please think out loud as you work through each task: tell me what you're looking at, what you're thinking, and what you expect to happen. I won't be able to answer questions about how to use the app during the tasks, but I'll answer anything after. Do you have any questions before we start?"

### During tasks
- Do not answer "how do I do X?" questions. Respond: *"What would you try?"*
- If the participant is silent for >30 seconds, prompt: *"What are you thinking right now?"*
- If the participant is stuck for >3 minutes, note the failure point and say: *"Let's move on to the next scenario."*
- Note exact quotes — especially confusion, surprise, or frustration.

### After each scenario
Ask:
1. "How did that feel — easy, difficult, or somewhere in between?"
2. "Was anything confusing or unexpected?"
3. "Is there anything you'd expect to see that wasn't there?"

### Closing (5 min)
1. "Overall, what was the most confusing part of the experience?"
2. "What would make you more confident using this app for real vaccination records?"
3. "Is there anything else you'd like to tell us?"

---

## 6. Observation Sheet (one per participant)

Copy this section for each session.

```
Participant ID: ___________   Profile: [ ] Patient  [ ] Healthcare Worker
Date: ___________   Facilitator: ___________   Session length: ___________
Tech comfort (self-reported 1–5): ___   Prior crypto experience: [ ] Yes  [ ] No

SCENARIO 1 — Connect Wallet
  Completed without help: [ ] Yes  [ ] No  [ ] Partial
  Time to complete: ___________
  Point of failure (if any): ___________
  Quotes / observations:


SCENARIO 2 — View Records
  Completed without help: [ ] Yes  [ ] No  [ ] Partial  [ ] N/A (issuer)
  Time to complete: ___________
  Point of failure (if any): ___________
  Quotes / observations:


SCENARIO 3 — Issue Record
  Completed without help: [ ] Yes  [ ] No  [ ] Partial  [ ] N/A (patient)
  Time to complete: ___________
  Point of failure (if any): ___________
  Quotes / observations:


SCENARIO 4 — Verify Wallet
  Completed without help: [ ] Yes  [ ] No  [ ] Partial
  Time to complete: ___________
  Point of failure (if any): ___________
  Quotes / observations:


POST-SESSION NOTES
  Most confusing element: ___________
  Suggested improvements (participant's words): ___________
  Severity ratings (H/M/L) for issues observed:
    Issue 1: ___________  Severity: ___
    Issue 2: ___________  Severity: ___
    Issue 3: ___________  Severity: ___
```

---

## 7. Severity Rating Scale

| Rating | Definition | Action |
|---|---|---|
| **High** | Participant cannot complete the task without facilitator help; or expresses significant distrust of the result | File a GitHub issue before v1.0 launch |
| **Medium** | Participant completes the task but with notable hesitation, confusion, or a workaround | File a GitHub issue; fix before or shortly after launch |
| **Low** | Minor friction, cosmetic issue, or preference | Log in findings doc; address in a future iteration |

---

## 8. After Sessions

1. Consolidate observation sheets into `docs/usability-findings.md`.
2. File a GitHub issue for every High-severity finding with label `usability` and milestone `v1.0`.
3. Review findings with the frontend team before the mainnet launch gate.
