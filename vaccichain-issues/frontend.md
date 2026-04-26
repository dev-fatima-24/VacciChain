# Frontend Issues (FE-001 to FE-020)

---

### FE-001 · Implement wallet connection state persistence

**Description:** Freighter wallet connection is lost on page refresh. The `useFreighter` hook should persist connection state and auto-reconnect on mount.

**Acceptance Criteria:**
- Wallet address persists across page refreshes via localStorage
- Auto-reconnect attempted on mount if previously connected
- Graceful fallback UI if Freighter extension is not installed

**Priority:** High | **Effort:** Small
**Dependencies:** None
**Labels:** `frontend`, `enhancement`

---

### FE-002 · Add loading and error states to NFTCard

**Description:** `NFTCard.jsx` renders empty silently on failed contract reads. Users have no feedback when data fails to load.

**Acceptance Criteria:**
- Skeleton loader shown while fetching vaccination records
- Error state displayed with retry button
- Empty state shown when wallet has no records

**Priority:** High | **Effort:** Small
**Dependencies:** None
**Labels:** `frontend`, `bug`, `ux`

---

### FE-003 · Make all pages mobile-responsive

**Description:** PatientDashboard and IssuerDashboard overflow on small screens. Healthcare workers often use mobile devices.

**Acceptance Criteria:**
- All pages pass layout checks at 375px, 768px, 1280px
- NFT card grid reflows to single column on mobile
- Forms are usable on touch devices without horizontal scroll

**Priority:** Medium | **Effort:** Medium
**Dependencies:** None
**Labels:** `frontend`, `ux`, `accessibility`

---

### FE-004 · Implement WCAG 2.1 AA accessibility compliance

**Description:** No ARIA labels, focus management, or keyboard navigation exist. Required for healthcare applications serving diverse users.

**Acceptance Criteria:**
- All interactive elements have ARIA labels
- Keyboard navigation works across all pages
- Color contrast ratios meet AA standard (4.5:1 for normal text)
- Screen reader tested with NVDA and VoiceOver

**Priority:** High | **Effort:** Medium
**Dependencies:** None
**Labels:** `frontend`, `accessibility`

---

### FE-005 · Add form validation to IssuerDashboard vaccination form

**Description:** The vaccination issue form has no client-side validation. Invalid data reaches the backend and causes unhandled errors.

**Acceptance Criteria:**
- Wallet address validated as valid Stellar public key (G..., 56 chars)
- Vaccine name and date fields required with inline error messages
- Date cannot be set in the future
- Submit button disabled until form is valid

**Priority:** High | **Effort:** Small
**Dependencies:** None
**Labels:** `frontend`, `bug`

---

### FE-006 · Implement global error boundary and toast notification system

**Description:** Unhandled React errors crash the entire app. Contract call failures have no user-visible feedback.

**Acceptance Criteria:**
- React `ErrorBoundary` wraps the app with a fallback UI
- Toast notifications for success/failure on all async actions
- Errors logged to console in dev, suppressed in prod

**Priority:** Medium | **Effort:** Small
**Dependencies:** None
**Labels:** `frontend`, `enhancement`

---

### FE-007 · Add JWT expiry handling and auto-logout

**Description:** When the 1-hour JWT expires, API calls silently fail with 401. Users are not redirected to re-authenticate.

**Acceptance Criteria:**
- 401 responses intercepted globally (axios interceptor or fetch wrapper)
- User redirected to re-authenticate via SEP-10 flow
- In-progress form data preserved across re-auth where possible

**Priority:** High | **Effort:** Small
**Dependencies:** None
**Labels:** `frontend`, `security`, `bug`

---

### FE-008 · Implement VerificationBadge visual states

**Description:** `VerificationBadge.jsx` needs distinct visual states for verified, unverified, revoked, and loading to avoid ambiguity.

**Acceptance Criteria:**
- Four distinct badge states: `verified` (green), `not-found` (grey), `revoked` (red), `loading` (spinner)
- Each state has an accessible label
- Badge is reusable across VerifyPage and PatientDashboard

**Priority:** Medium | **Effort:** Small
**Dependencies:** SC-006
**Labels:** `frontend`, `ux`

---

### FE-009 · Add network selector for testnet/mainnet

**Description:** The app is hardcoded to testnet. Developers and production users need to switch networks without rebuilding.

**Acceptance Criteria:**
- Network (testnet/mainnet) driven by environment variable at build time
- Visual indicator in the UI showing active network
- Warning banner displayed when on testnet

**Priority:** Medium | **Effort:** Small
**Dependencies:** None
**Labels:** `frontend`, `enhancement`

---

### FE-010 · Implement patient vaccination record detail view

**Description:** NFTCard shows summary data only. Patients need a detail view with full record metadata and on-chain proof link.

**Acceptance Criteria:**
- Clicking an NFTCard opens a detail modal or page
- Detail view shows: vaccine name, date, issuer address, token ID, transaction hash
- Link to Stellar Explorer for the mint transaction
- Modal is keyboard-dismissible

**Priority:** Medium | **Effort:** Small
**Dependencies:** FE-004
**Labels:** `frontend`, `enhancement`

---

### FE-011 · Add Freighter not-installed detection and install prompt

**Description:** If Freighter is not installed, all wallet interactions fail silently with a JS error.

**Acceptance Criteria:**
- On mount, detect if `window.freighter` is available
- If not installed, show a prompt with a link to the Freighter install page
- Prompt is dismissible and does not block the VerifyPage (which needs no wallet)

**Priority:** High | **Effort:** Small
**Dependencies:** None
**Labels:** `frontend`, `ux`, `bug`

---

### FE-012 · Implement issuer authorization status indicator

**Description:** An issuer who connects their wallet has no feedback on whether they are authorized on-chain before attempting to mint.

**Acceptance Criteria:**
- IssuerDashboard checks issuer authorization status on wallet connect
- Authorized: green badge + form enabled
- Unauthorized: warning message + form disabled with explanation

**Priority:** Medium | **Effort:** Small
**Dependencies:** None
**Labels:** `frontend`, `ux`

---

### FE-013 · Add copy-to-clipboard for wallet addresses and token IDs

**Description:** Long Stellar addresses and token IDs are displayed as full strings with no way to copy them easily.

**Acceptance Criteria:**
- All wallet addresses and token IDs have a copy icon
- Clicking copies to clipboard and shows a brief "Copied!" tooltip
- Accessible via keyboard

**Priority:** Low | **Effort:** Small
**Dependencies:** None
**Labels:** `frontend`, `ux`

---

### FE-014 · Implement VerifyPage URL-based wallet lookup

**Description:** The VerifyPage requires manual input. Sharing a verification link for a specific wallet is not possible.

**Acceptance Criteria:**
- VerifyPage reads wallet address from URL query param `?wallet=G...`
- If param present, verification runs automatically on page load
- URL updates when user manually enters a wallet address
- Shareable links work correctly

**Priority:** Medium | **Effort:** Small
**Dependencies:** None
**Labels:** `frontend`, `enhancement`

---

### FE-015 · Add pagination to PatientDashboard NFT list

**Description:** Wallets with many vaccination records will render an unbounded list, degrading performance.

**Acceptance Criteria:**
- NFT list paginated with configurable page size (default 10)
- Pagination controls accessible via keyboard
- Total record count displayed

**Priority:** Medium | **Effort:** Small
**Dependencies:** BE-007
**Labels:** `frontend`, `performance`

---

### FE-016 · Implement dark mode support

**Description:** No dark mode exists. Healthcare workers in low-light environments (clinics, night shifts) need reduced-glare UI.

**Acceptance Criteria:**
- Dark mode toggled via system preference (`prefers-color-scheme`) by default
- Manual toggle available in the UI
- Preference persisted in localStorage
- All components have dark mode variants

**Priority:** Low | **Effort:** Medium
**Dependencies:** None
**Labels:** `frontend`, `ux`, `enhancement`

---

### FE-017 · Add confirmation dialog before vaccination issuance

**Description:** The IssuerDashboard submits the vaccination form immediately. A misclick can trigger an irreversible on-chain mint.

**Acceptance Criteria:**
- Confirmation dialog shown before submitting the issue form
- Dialog displays a summary of the record to be minted
- Requires explicit confirmation click (not just Enter key)
- Cancellable without losing form data

**Priority:** High | **Effort:** Small
**Dependencies:** None
**Labels:** `frontend`, `ux`, `security`

---

### FE-018 · Implement session timeout warning

**Description:** JWT expires after 1 hour with no warning. Users lose in-progress work without notice.

**Acceptance Criteria:**
- Warning shown 5 minutes before JWT expiry
- User can extend session by re-signing with Freighter
- If ignored, user is logged out gracefully at expiry

**Priority:** Medium | **Effort:** Small
**Dependencies:** FE-007
**Labels:** `frontend`, `ux`

---

### FE-019 · Add analytics dashboard page

**Description:** The Python analytics service exposes vaccination rates and anomaly data but there is no UI to visualize it.

**Acceptance Criteria:**
- New `/analytics` route accessible to authorized issuers
- Bar chart for vaccination rates by vaccine type
- Table for issuer activity (volume, last active)
- Anomaly flags displayed with severity indicators
- Data auto-refreshes every 60 seconds

**Priority:** Low | **Effort:** Large
**Dependencies:** None
**Labels:** `frontend`, `enhancement`, `product`

---

### FE-020 · Implement vaccination certificate PDF export

**Description:** Patients need portable, printable proof of vaccination for offline use (travel, school enrollment).

**Acceptance Criteria:**
- "Export Certificate" button on each NFTCard in PatientDashboard
- PDF includes: patient wallet (truncated), vaccine name, date, issuer, QR code linking to on-chain verification
- PDF generated client-side (no patient data sent to server)
- PDF filename includes vaccine name and date

**Priority:** Medium | **Effort:** Medium
**Dependencies:** FE-010
**Labels:** `frontend`, `enhancement`, `product`
