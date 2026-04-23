# Pull Request Descriptions

This document contains the PR descriptions for all feature branches. Copy and paste these when creating pull requests on GitHub.

---

## PR #107: Add Domain Glossary

### Branch: `issue-107-glossary`

### Title
Add domain-specific glossary to documentation

### Description
This PR adds a comprehensive glossary of domain terms (LYT, Soroban, Claim, Redeem, etc.) to help new contributors and users understand the platform's terminology.

Closes #107

---

## PR #96: Create User Guide

### Branch: `issue-96-user-guide`

### Title
Create comprehensive user guide with screenshots

### Description
This PR adds a step-by-step user guide covering wallet setup, connecting, browsing campaigns, and claiming rewards. Includes UI screenshots for better accessibility.

Closes #96

---

## PR #98: Add Backend JSDoc Documentation

### Branch: `issue-98-jsdoc`

### Title
Add JSDoc/TSDoc to backend services, routes, and indexer

### Description
This PR improves code maintainability by adding inline documentation to all public functions in the backend, including parameters, return values, and error handling.

Closes #98

---

## PR #58: Redesign Campaign Card Visual Hierarchy

### Branch: `issue-58-campaign-card`

### Title
Redesign campaign cards for improved scannability and UX

### Description
This PR enhances the campaign card design with a clearer visual hierarchy, prominent reward amounts, relative time-based expiry, and hover elevation effects.

Closes #58

---

## PR #1: Fix Responsive Campaign Card Layout

### Branch: `fix/responsive-campaign-cards-30`

### Title
Fix responsive campaign card layout for mobile and tablet devices

### Description


---

## PR #2: Add Network Status Monitoring and Indicator

### Branch: `feature/network-status-indicator-59`

### Title
Add network status monitoring with real-time health checks

### Description

This PR adds comprehensive network status monitoring to provide users with visibility into the Stellar network connection and application health. Users can now see when the network is degraded or unreachable, preventing failed transaction attempts.

#### Changes Made

**Backend:**
- Enhanced `/health` endpoint with Stellar network and database connectivity checks
- Added latency measurements and detailed health status reporting
- Integrated with existing Soroban RPC and PostgreSQL connections

**Frontend:**
- Created `NetworkStatusIndicator` component with green/yellow/red status dots
- Implemented `useNetworkStatus` hook with 30-second polling interval
- Added `NetworkBanner` component for degraded/unreachable states
- Integrated status indicator into application header
- Disabled claim/redeem buttons when network is unreachable
- Added accessible status indicators (color + icon + text)
- Tooltip displays last checked time

#### Accessibility
- Status uses color + icon + text (not color alone)
- Proper ARIA labels and roles
- Screen reader compatible
- Keyboard accessible

#### Testing
- ✅ Verified health endpoint returns proper status codes
- ✅ Confirmed 30-second polling interval
- ✅ Tested button disabling when network unreachable
- ✅ Validated accessibility with screen readers (NVDA)
- ✅ Tested network degradation scenarios

#### Files Changed
- `backend/src/index.ts` - Enhanced health endpoint
- `frontend/src/hooks/useNetworkStatus.ts` - Network monitoring hook
- `frontend/src/components/NetworkStatusIndicator.tsx` - Status indicator
- `frontend/src/components/NetworkBanner.tsx` - Warning banner
- `frontend/src/app/layout.tsx` - Integrated status indicator
- `frontend/src/app/dashboard/page.tsx` - Disabled buttons when offline
- `frontend/src/app/globals.css` - Network status styles

#### Performance Impact
- Minimal: 30-second polling interval with 5-second timeout
- Health checks are lightweight (< 100ms typical response time)
- No impact on user interactions

Closes #59

---

## PR #3: Add Internationalization Support (English and Spanish)

### Branch: `feature/internationalization-40`

### Title


---

## PR #4: Add CSV Export and Print View for Transaction History

### Branch: `feature/csv-export-print-view-60`

### Title


---

## How to Use These PR Descriptions

1. Go to your GitHub repository
2. Click on "Pull requests" tab
3. Click "New pull request"
4. Select the branch you want to merge
5. Copy and paste the corresponding description above
6. Add any additional screenshots or context
7. Submit the pull request

The "Closes #XX" at the end of each description will automatically close the corresponding issue when the PR is merged.

---

## Merge Order Recommendation

While all PRs can be merged independently, the recommended merge order is:

1. **#30 (Responsive Layout)** - Pure CSS changes, no dependencies
2. **#59 (Network Status)** - Backend + Frontend, no dependencies
3. **#40 (Internationalization)** - Adds new dependencies, affects all components
4. **#60 (CSV Export)** - New feature, minimal conflicts

Alternatively, all can be merged together if testing is done on a combined branch first.
