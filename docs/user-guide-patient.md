# Patient User Guide

Welcome to VacciChain! This guide will help you view and manage your vaccination records on the blockchain.

## Table of Contents

- [Getting Started](#getting-started)
- [Connecting Your Wallet](#connecting-your-wallet)
- [Viewing Your Records](#viewing-your-records)
- [Exporting Your Certificate](#exporting-your-certificate)
- [Sharing Your Status](#sharing-your-status)
- [Troubleshooting](#troubleshooting)

---

## Getting Started

VacciChain stores your vaccination records as **soulbound NFTs** on the Stellar blockchain. This means:

- ✅ **Your records are yours** — Only you can access them
- ✅ **Tamper-proof** — Records cannot be forged or altered
- ✅ **Portable** — Your records follow you, not tied to any institution
- ✅ **Verifiable** — Anyone can verify your status instantly

### What You'll Need

1. **Freighter Wallet** — A browser extension for managing Stellar assets
   - Download from [freighter.app](https://www.freighter.app/)
   - Available for Chrome, Firefox, Edge, and Brave

2. **A Stellar Account** — Created automatically when you install Freighter

3. **Internet Connection** — To access the VacciChain application

---

## Connecting Your Wallet

### Step 1: Install Freighter

1. Visit [freighter.app](https://www.freighter.app/)
2. Click "Download" and select your browser
3. Follow the installation prompts
4. Create a new wallet or import an existing one
5. **Important**: Save your recovery phrase in a safe place

### Step 2: Switch to Testnet (if applicable)

If you're testing VacciChain on testnet:

1. Open Freighter
2. Click the network selector (top-right)
3. Select "Testnet"
4. Your wallet will now show testnet assets

### Step 3: Connect to VacciChain

1. Visit the VacciChain application
2. Click "Connect Wallet" on the landing page
3. Freighter will prompt you to approve the connection
4. Click "Approve"
5. You'll be redirected to your Patient Dashboard

**Screenshot**: Landing page with "Connect Wallet" button

---

## Viewing Your Records

### Patient Dashboard

Once connected, you'll see your Patient Dashboard with:

- **Your Wallet Address** — Your unique Stellar identifier
- **Vaccination Records** — All your vaccination NFTs
- **Record Details** — Vaccine name, date administered, issuer

### Understanding Your Records

Each vaccination record shows:

| Field | Meaning |
|-------|---------|
| **Vaccine Name** | Type of vaccine (e.g., COVID-19, Influenza) |
| **Date Administered** | When you received the vaccine |
| **Issuer** | Healthcare provider who issued the record |
| **Token ID** | Unique blockchain identifier |

### Example Record

```
Vaccine: COVID-19 (Pfizer-BioNTech)
Date: March 15, 2026
Issuer: City Health Department
Status: ✅ Verified on blockchain
```

**Screenshot**: Patient dashboard showing vaccination records

---

## Exporting Your Certificate

### Generate a Certificate

1. On your Patient Dashboard, click "Export Certificate"
2. Select the vaccination record you want to export
3. Choose format:
   - **PDF** — For printing or email
   - **JSON** — For digital verification
4. Click "Download"

### What's Included

Your certificate contains:

- Your name and wallet address
- Vaccine details (name, date, issuer)
- Blockchain verification link
- QR code for quick verification

### Using Your Certificate

- **Travel**: Show to border agents or airlines
- **Employment**: Provide to employers requiring proof
- **Education**: Submit to schools or universities
- **Healthcare**: Share with medical providers

**Screenshot**: Export certificate dialog

---

## Sharing Your Status

### Public Verification Link

You can share a link that allows others to verify your vaccination status:

1. On your Patient Dashboard, click "Share Status"
2. Copy the verification link
3. Share via email, messaging, or QR code
4. Others can verify your status without accessing your full records

### What Others Can See

When someone verifies your status, they see:

- ✅ Whether you are vaccinated
- ✅ Number of vaccination records
- ✅ Vaccine names and dates (if you allow)
- ❌ Your wallet address (hidden)
- ❌ Your personal information

### Privacy Controls

1. Click "Privacy Settings"
2. Choose what information to share:
   - [ ] Show vaccine names
   - [ ] Show dates
   - [ ] Show issuer information
3. Click "Save"

**Screenshot**: Share status dialog with privacy options

---

## Troubleshooting

### "Wallet Not Connected"

**Problem**: The app says your wallet is not connected.

**Solution**:
1. Check that Freighter is installed and open
2. Verify you're on the correct network (Testnet or Mainnet)
3. Click "Connect Wallet" again
4. Approve the connection in Freighter

### "No Records Found"

**Problem**: You don't see any vaccination records.

**Solution**:
1. Verify you're using the correct wallet address
2. Check that you're on the correct network
3. Wait a few moments for records to load
4. Refresh the page
5. Contact your healthcare provider to issue a record

### "Transaction Failed"

**Problem**: An action (like exporting) failed.

**Solution**:
1. Check your internet connection
2. Verify you have sufficient Stellar balance (minimum 1 XLM)
3. Try again in a few moments
4. If the problem persists, contact support

### "Freighter Not Responding"

**Problem**: Freighter is not responding to connection requests.

**Solution**:
1. Close and reopen Freighter
2. Restart your browser
3. Reinstall Freighter if the problem persists
4. Check [Freighter support](https://www.freighter.app/support)

### "Certificate Export Not Working"

**Problem**: You cannot export your certificate.

**Solution**:
1. Ensure you have at least one vaccination record
2. Check that your browser allows downloads
3. Try a different browser
4. Contact support if the problem persists

---

## Security Tips

### Protect Your Wallet

- ✅ **Never share your recovery phrase** — Anyone with it can access your wallet
- ✅ **Use a strong password** — At least 12 characters with mixed case and numbers
- ✅ **Keep Freighter updated** — Enable automatic updates
- ✅ **Verify URLs** — Always check you're on the official VacciChain site

### Verify Records

- ✅ **Check the issuer** — Ensure records come from trusted healthcare providers
- ✅ **Verify dates** — Confirm vaccination dates match your records
- ✅ **Use blockchain verification** — Click the verification link to confirm on-chain

---

## Frequently Asked Questions

**Q: Is my data private?**  
A: Yes. Your records are encrypted and only accessible with your wallet. VacciChain cannot access your data.

**Q: Can I lose my records?**  
A: No. Records are stored on the Stellar blockchain permanently. As long as you have access to your wallet, you have access to your records.

**Q: What if I lose my wallet?**  
A: If you have your recovery phrase, you can restore your wallet on any device. Without it, your records are inaccessible.

**Q: Can I delete my records?**  
A: No. Records are permanent on the blockchain. However, you can request revocation from the issuing healthcare provider.

**Q: How much does this cost?**  
A: VacciChain is free. You only pay minimal Stellar network fees (typically <$0.01).

**Q: Can I use this on mobile?**  
A: Yes, if your mobile browser supports Freighter (iOS Safari, Android Chrome).

---

## Getting Help

- **Email**: support@vaccichain.example.com
- **Discord**: [Join our community](https://discord.gg/vaccichain)
- **GitHub Issues**: [Report a bug](https://github.com/dev-fatima-24/VacciChain/issues)

---

## Next Steps

- [View the Issuer Guide](./user-guide-issuer.md) if you're a healthcare provider
- [Learn about Stellar](https://developers.stellar.org/learn) for technical details
- [Verify someone's status](../README.md#verification) using the public verification endpoint
