# VacciChain Usability Findings

**Status:** 🔲 Awaiting sessions  
**Test plan:** [docs/usability-test-plan.md](./usability-test-plan.md)  
**Sessions required:** ≥ 5  
**Sessions completed:** 0 / 5  
**Target completion:** Before v1.0 mainnet launch

---

## Participants

| ID | Profile | Tech comfort (1–5) | Prior crypto | Session date | Facilitator |
|---|---|---|---|---|---|
| P1 | | | | | |
| P2 | | | | | |
| P3 | | | | | |
| P4 | | | | | |
| P5 | | | | | |

---

## Task Completion Summary

Fill in after all sessions. ✅ = completed without help, ⚠️ = completed with difficulty, ❌ = could not complete, — = not applicable.

| Scenario | P1 | P2 | P3 | P4 | P5 | Completion rate |
|---|---|---|---|---|---|---|
| S1 — Connect Wallet | | | | | | / 5 |
| S2 — View Records | | | | | | / 5 |
| S3 — Issue Record | | | | | | / 5 |
| S4 — Verify Wallet | | | | | | / 5 |

---

## Findings

### High Severity

> Issues that prevented task completion or caused significant distrust. Must be resolved before v1.0 launch.
> File a GitHub issue for each with label `usability` and milestone `v1.0`.

<!-- Add findings here after sessions. Example format:

#### H-01 — [Short title]
**Scenario:** S1  
**Observed in sessions:** P1, P3  
**Description:** [What happened]  
**Participant quote:** "[exact words]"  
**Recommended fix:** [Specific UI change]  
**GitHub issue:** #___
-->

*No findings recorded yet.*

---

### Medium Severity

> Issues where participants completed the task but with notable hesitation, confusion, or a workaround.

<!-- Add findings here after sessions. Example format:

#### M-01 — [Short title]
**Scenario:** S3  
**Observed in sessions:** P2, P4  
**Description:** [What happened]  
**Participant quote:** "[exact words]"  
**Recommended fix:** [Specific UI change]  
**GitHub issue:** #___
-->

*No findings recorded yet.*

---

### Low Severity

> Minor friction, cosmetic issues, or participant preferences.

<!-- Add findings here after sessions. Example format:

#### L-01 — [Short title]
**Scenario:** S2  
**Observed in sessions:** P5  
**Description:** [What happened]  
**Recommended fix:** [Specific UI change]  
-->

*No findings recorded yet.*

---

## Session Notes

### P1
**Profile:**  
**Date:**  
**Facilitator:**  

**S1 — Connect Wallet**  
Completed: [ ] Yes [ ] No [ ] Partial  
Time:  
Notes:  

**S2 — View Records**  
Completed: [ ] Yes [ ] No [ ] Partial [ ] N/A  
Time:  
Notes:  

**S3 — Issue Record**  
Completed: [ ] Yes [ ] No [ ] Partial [ ] N/A  
Time:  
Notes:  

**S4 — Verify Wallet**  
Completed: [ ] Yes [ ] No [ ] Partial  
Time:  
Notes:  

**Post-session:**  
Most confusing element:  
Participant suggestions:  

---

### P2
**Profile:**  
**Date:**  
**Facilitator:**  

**S1 — Connect Wallet**  
Completed: [ ] Yes [ ] No [ ] Partial  
Time:  
Notes:  

**S2 — View Records**  
Completed: [ ] Yes [ ] No [ ] Partial [ ] N/A  
Time:  
Notes:  

**S3 — Issue Record**  
Completed: [ ] Yes [ ] No [ ] Partial [ ] N/A  
Time:  
Notes:  

**S4 — Verify Wallet**  
Completed: [ ] Yes [ ] No [ ] Partial  
Time:  
Notes:  

**Post-session:**  
Most confusing element:  
Participant suggestions:  

---

### P3
**Profile:**  
**Date:**  
**Facilitator:**  

**S1 — Connect Wallet**  
Completed: [ ] Yes [ ] No [ ] Partial  
Time:  
Notes:  

**S2 — View Records**  
Completed: [ ] Yes [ ] No [ ] Partial [ ] N/A  
Time:  
Notes:  

**S3 — Issue Record**  
Completed: [ ] Yes [ ] No [ ] Partial [ ] N/A  
Time:  
Notes:  

**S4 — Verify Wallet**  
Completed: [ ] Yes [ ] No [ ] Partial  
Time:  
Notes:  

**Post-session:**  
Most confusing element:  
Participant suggestions:  

---

### P4
**Profile:**  
**Date:**  
**Facilitator:**  

**S1 — Connect Wallet**  
Completed: [ ] Yes [ ] No [ ] Partial  
Time:  
Notes:  

**S2 — View Records**  
Completed: [ ] Yes [ ] No [ ] Partial [ ] N/A  
Time:  
Notes:  

**S3 — Issue Record**  
Completed: [ ] Yes [ ] No [ ] Partial [ ] N/A  
Time:  
Notes:  

**S4 — Verify Wallet**  
Completed: [ ] Yes [ ] No [ ] Partial  
Time:  
Notes:  

**Post-session:**  
Most confusing element:  
Participant suggestions:  

---

### P5
**Profile:**  
**Date:**  
**Facilitator:**  

**S1 — Connect Wallet**  
Completed: [ ] Yes [ ] No [ ] Partial  
Time:  
Notes:  

**S2 — View Records**  
Completed: [ ] Yes [ ] No [ ] Partial [ ] N/A  
Time:  
Notes:  

**S3 — Issue Record**  
Completed: [ ] Yes [ ] No [ ] Partial [ ] N/A  
Time:  
Notes:  

**S4 — Verify Wallet**  
Completed: [ ] Yes [ ] No [ ] Partial  
Time:  
Notes:  

**Post-session:**  
Most confusing element:  
Participant suggestions:  

---

## Known Risk Areas

These are UI patterns identified during development review that are likely to surface as usability issues. Watch for them during sessions.

| Area | Risk | Scenario |
|---|---|---|
| SEP-10 signing prompt | Users unfamiliar with blockchain may not understand what they are signing or why | S1 |
| Freighter not installed | No inline install link on the Landing page — users see only a text note | S1 |
| "Token ID" label on NFT cards | Medical users unlikely to understand what a token ID is | S2 |
| Patient address field in issuer form | Issuers must obtain the patient's `G...` address out-of-band — no QR scan or lookup | S3 |
| `G...` 56-character address format | Unfamiliar to non-crypto users; easy to truncate or mistype | S3, S4 |
| Verification badge trust | No explanation of what "on-chain" means or why the result is trustworthy | S4 |
| No confirmation before minting | Form submits immediately on button click — no review step before the irreversible on-chain action | S3 |

---

## Sign-off

Testing must be completed and all High-severity findings resolved (or explicitly deferred with justification) before the v1.0 mainnet launch gate.

| Role | Name | Sign-off date |
|---|---|---|
| Facilitator | | |
| Frontend lead | | |
| Product owner | | |
