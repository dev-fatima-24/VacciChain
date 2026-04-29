# Issuer User Guide

Welcome to VacciChain! This guide will help you issue and manage vaccination records as an authorized healthcare provider.

## Table of Contents

- [Getting Started](#getting-started)
- [Authorization Status](#authorization-status)
- [Issuing Records](#issuing-records)
- [Managing Records](#managing-records)
- [Revoking Records](#revoking-records)
- [Troubleshooting](#troubleshooting)

---

## Getting Started

As an authorized healthcare provider, you can issue **soulbound vaccination NFTs** directly to patient wallets on the Stellar blockchain.

### What You'll Need

1. **Freighter Wallet** — A browser extension for managing Stellar assets
   - Download from [freighter.app](https://www.freighter.app/)
   - Available for Chrome, Firefox, Edge, and Brave

2. **Authorization** — Your wallet must be authorized by VacciChain administrators
   - Contact your VacciChain administrator to request authorization
   - Provide your Stellar public key

3. **Internet Connection** — To access the VacciChain application

### Key Concepts

- **Soulbound Tokens** — Records cannot be transferred; they stay with the patient
- **Immutable Records** — Once issued, records cannot be modified (only revoked)
- **On-Chain Verification** — Anyone can verify records instantly on the blockchain
- **Audit Trail** — All issuances are logged for compliance

---

## Authorization Status

### Checking Your Authorization

1. Visit the VacciChain application
2. Click "Connect Wallet" on the landing page
3. Approve the connection in Freighter
4. You'll be redirected to the Issuer Dashboard

### If You See "Not Authorized"

If you see a message saying you're not authorized:

1. **Verify your wallet address** — Ensure you're using the correct wallet
2. **Contact your administrator** — Request authorization with your public key
3. **Wait for confirmation** — Authorization may take a few minutes to propagate
4. **Refresh the page** — Try again after a few moments

### Understanding Your Role

As an issuer, you have:

- ✅ **Issue Records** — Create vaccination NFTs for patients
- ✅ **Revoke Records** — Remove records if needed (e.g., data correction)
- ✅ **View History** — See all records you've issued
- ❌ **Modify Records** — Cannot change issued records (must revoke and re-issue)
- ❌ **Access Patient Data** — Cannot see other patients' records

**Screenshot**: Issuer dashboard showing authorization status

---

## Issuing Records

### Step 1: Access the Issue Form

1. On the Issuer Dashboard, click "Issue Vaccination Record"
2. You'll see a form with the following fields:
   - Patient Wallet Address
   - Vaccine Name
   - Date Administered

### Step 2: Enter Patient Information

**Patient Wallet Address**

- Ask the patient for their Stellar public key
- It starts with `G` and is 56 characters long
- Example: `GBRPYHIL2CI3WHZDTOOQFC6EB4KJJGUJGU7WYLBTK2DYHUYXO5IHXF7`
- Verify the address is correct before proceeding

**Vaccine Name**

- Enter the vaccine type (e.g., "COVID-19 (Pfizer-BioNTech)")
- Include the manufacturer if applicable
- Be consistent with naming across records

**Date Administered**

- Select the date the vaccine was given
- Use the calendar picker or type the date
- Format: YYYY-MM-DD

### Step 3: Review and Confirm

1. Review all information for accuracy
2. Click "Preview" to see how the record will appear
3. Click "Issue Record" to submit

### Step 4: Confirm in Freighter

1. Freighter will prompt you to approve the transaction
2. Review the transaction details
3. Click "Approve" to confirm
4. Wait for the transaction to complete (usually 5-10 seconds)

### Step 5: Confirmation

You'll see a success message with:

- **Token ID** — Unique blockchain identifier
- **Transaction Hash** — Link to view on Stellar Expert
- **Timestamp** — When the record was issued

**Screenshot**: Issue vaccination record form

---

## Managing Records

### View Issued Records

1. On the Issuer Dashboard, click "My Records"
2. You'll see a list of all records you've issued
3. Each record shows:
   - Patient wallet address
   - Vaccine name
   - Date administered
   - Issue date
   - Status (Active or Revoked)

### Search Records

1. Use the search bar to find records by:
   - Patient wallet address
   - Vaccine name
   - Date range

### Export Records

1. Click "Export" to download your records
2. Choose format:
   - **CSV** — For spreadsheets
   - **JSON** — For data analysis
3. Click "Download"

### Record Details

Click on any record to see:

- Full patient wallet address
- Complete vaccine information
- Blockchain verification link
- Revocation status
- Audit trail (who issued, when, from where)

**Screenshot**: My records list with search and export options

---

## Revoking Records

### When to Revoke

You may need to revoke a record if:

- ❌ **Data Error** — Wrong vaccine name or date
- ❌ **Duplicate** — Record was issued twice by mistake
- ❌ **Patient Request** — Patient asks for removal
- ❌ **Fraud** — Record was issued in error

### How to Revoke

1. On the Issuer Dashboard, find the record to revoke
2. Click the three-dot menu (⋯)
3. Select "Revoke Record"
4. Enter a reason for revocation (optional)
5. Click "Confirm Revocation"
6. Approve the transaction in Freighter

### After Revocation

- The record will be marked as "Revoked"
- It will no longer appear in patient verification
- The blockchain will show the revocation
- You cannot restore a revoked record (must re-issue)

### Revocation Audit Trail

All revocations are logged with:

- Who revoked the record
- When it was revoked
- Reason for revocation
- Transaction hash

**Screenshot**: Revoke record confirmation dialog

---

## Best Practices

### Data Quality

- ✅ **Verify patient identity** — Confirm you have the correct wallet address
- ✅ **Use consistent naming** — Standardize vaccine names across your organization
- ✅ **Double-check dates** — Verify dates match your records
- ✅ **Document everything** — Keep records of what you issued and when

### Security

- ✅ **Protect your wallet** — Never share your recovery phrase
- ✅ **Use a strong password** — At least 12 characters
- ✅ **Keep Freighter updated** — Enable automatic updates
- ✅ **Verify URLs** — Always check you're on the official VacciChain site

### Compliance

- ✅ **Follow regulations** — Comply with local healthcare regulations
- ✅ **Maintain audit logs** — Keep records of all issuances
- ✅ **Protect patient privacy** — Only share necessary information
- ✅ **Report issues** — Notify administrators of suspicious activity

---

## Troubleshooting

### "Not Authorized"

**Problem**: You see "Not Authorized" on the Issuer Dashboard.

**Solution**:
1. Verify you're using the correct wallet
2. Contact your VacciChain administrator
3. Provide your Stellar public key
4. Wait for authorization to be processed
5. Refresh the page

### "Transaction Failed"

**Problem**: Issuing a record failed.

**Solution**:
1. Check your internet connection
2. Verify the patient wallet address is correct
3. Ensure you have sufficient Stellar balance (minimum 1 XLM)
4. Try again in a few moments
5. Check the error message for details

### "Invalid Wallet Address"

**Problem**: The system says the wallet address is invalid.

**Solution**:
1. Verify the address starts with `G`
2. Check that it's 56 characters long
3. Ensure there are no typos or extra spaces
4. Ask the patient to provide their address again
5. Use copy-paste to avoid manual entry errors

### "Freighter Not Responding"

**Problem**: Freighter is not responding to transaction requests.

**Solution**:
1. Close and reopen Freighter
2. Restart your browser
3. Check your internet connection
4. Reinstall Freighter if the problem persists
5. Check [Freighter support](https://www.freighter.app/support)

### "Insufficient Balance"

**Problem**: You see "Insufficient balance" error.

**Solution**:
1. Check your Stellar account balance
2. You need at least 1 XLM to issue records
3. Request XLM from your administrator
4. Wait for the transaction to complete
5. Try again

### "Duplicate Record"

**Problem**: You accidentally issued the same record twice.

**Solution**:
1. Revoke one of the duplicate records
2. Document the revocation reason
3. Notify the patient if needed
4. Re-issue if necessary

---

## Frequently Asked Questions

**Q: Can I modify a record after issuing?**  
A: No. Records are immutable on the blockchain. You must revoke and re-issue if changes are needed.

**Q: How long does it take to issue a record?**  
A: Usually 5-10 seconds. The blockchain confirms the transaction automatically.

**Q: Can patients see who issued their records?**  
A: Yes. The issuer address is visible on the blockchain. This is intentional for transparency.

**Q: What if a patient loses their wallet?**  
A: The record remains on the blockchain. If they restore their wallet with their recovery phrase, they'll have access again.

**Q: Can I issue records in bulk?**  
A: Currently, records are issued one at a time. Contact your administrator about bulk issuance features.

**Q: How do I verify a patient's records?**  
A: Use the public verification endpoint or ask the patient to share their verification link.

**Q: What happens if I revoke a record?**  
A: The record is marked as revoked on the blockchain. It will no longer appear in patient verification.

**Q: Can I see records issued by other providers?**  
A: No. You can only see records you've issued. This protects patient privacy.

---

## Compliance and Regulations

### Data Protection

- VacciChain complies with HIPAA and GDPR requirements
- Patient data is encrypted and only accessible to the patient
- Audit logs are maintained for compliance

### Record Retention

- Records are permanent on the blockchain
- You cannot delete records (only revoke)
- Maintain local backups for your records

### Reporting

- Export records regularly for your records
- Report any suspicious activity to administrators
- Maintain compliance with local regulations

---

## Getting Help

- **Email**: support@vaccichain.example.com
- **Discord**: [Join our community](https://discord.gg/vaccichain)
- **GitHub Issues**: [Report a bug](https://github.com/dev-fatima-24/VacciChain/issues)
- **Administrator**: Contact your VacciChain administrator for authorization issues

---

## Next Steps

- [View the Patient Guide](./user-guide-patient.md) to understand the patient experience
- [Learn about Stellar](https://developers.stellar.org/learn) for technical details
- [Review the API Documentation](../README.md#backend-api) for integration details
