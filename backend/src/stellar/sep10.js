const StellarSdk = require('@stellar/stellar-sdk');
const nonceStore = require('./nonceStore');

const NETWORK_PASSPHRASE =
  process.env.STELLAR_NETWORK === 'mainnet'
    ? StellarSdk.Networks.PUBLIC
    : StellarSdk.Networks.TESTNET;

const HORIZON_URL = process.env.HORIZON_URL || 'https://horizon-testnet.stellar.org';
const server = new StellarSdk.Horizon.Server(HORIZON_URL);

/**
 * Build a SEP-10 challenge transaction.
 * Returns the XDR-encoded transaction for the client to sign.
 */
async function buildChallenge(clientPublicKey) {
  const serverKeypair = StellarSdk.Keypair.fromSecret(process.env.SEP10_SERVER_KEY);
  const serverAccount = await server.loadAccount(serverKeypair.publicKey());

  const nonce = StellarSdk.Keypair.random().publicKey(); // random unique value
  const now = Math.floor(Date.now() / 1000);

  const tx = new StellarSdk.TransactionBuilder(serverAccount, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      StellarSdk.Operation.manageData({
        name: 'vaccichain auth',
        value: nonce,
        source: clientPublicKey,
      })
    )
    .setTimeout(300) // 5-minute expiry
    .build();

  tx.sign(serverKeypair);

  nonceStore.set(nonce, clientPublicKey);
  return { transaction: tx.toXDR(), nonce };
}

/**
 * Verify a signed SEP-10 challenge transaction.
 * Returns the verified public key on success.
 */
function verifyChallenge(transactionXDR, nonce) {
  // Consume nonce — throws if unknown, expired, or already used
  nonceStore.consume(nonce);

  const serverKeypair = StellarSdk.Keypair.fromSecret(process.env.SEP10_SERVER_KEY);
  const tx = new StellarSdk.Transaction(transactionXDR, NETWORK_PASSPHRASE);

  // Validate time bounds
  const now = Math.floor(Date.now() / 1000);
  if (tx.timeBounds && (now < Number(tx.timeBounds.minTime) || now > Number(tx.timeBounds.maxTime))) {
    throw new Error('Challenge transaction has expired');
  }

  // Verify server signature
  const txHash = tx.hash();
  const serverSigned = tx.signatures.some((sig) =>
    serverKeypair.verify(txHash, sig.signature())
  );
  if (!serverSigned) throw new Error('Invalid server signature');

  // Extract client public key from the manageData operation source
  const op = tx.operations[0];
  if (!op || op.type !== 'manageData') throw new Error('Invalid challenge format');

  const clientPublicKey = op.source;
  const clientKeypair = StellarSdk.Keypair.fromPublicKey(clientPublicKey);

  const clientSigned = tx.signatures.some((sig) => {
    try {
      return clientKeypair.verify(txHash, sig.signature());
    } catch {
      return false;
    }
  });
  if (!clientSigned) throw new Error('Client signature missing or invalid');

  return clientPublicKey;
}

module.exports = { buildChallenge, verifyChallenge };
