const StellarSdk = require('@stellar/stellar-sdk');

/**
 * Generates a mock SEP-10 challenge transaction.
 * @param {string} clientPublicKey - The public key of the client.
 * @param {Object} overrides - Overrides for the challenge.
 * @returns {Object} An object containing the transaction XDR and nonce.
 */
const sep10ChallengeFactory = (clientPublicKey, overrides = {}) => {
  const serverKeypair = StellarSdk.Keypair.fromSecret(
    process.env.SEP10_SERVER_KEY || 'SAZF5P4T56653E656665666566656665666566656665666566656665'
  );
  
  // We mock the nonce store behavior by just returning a nonce
  const nonce = overrides.nonce || StellarSdk.Keypair.random().publicKey();
  
  // Create a minimal transaction that satisfies SEP-10 for tests
  // Note: In real scenarios, you'd use TransactionBuilder, but for a factory
  // we might just want to return what the backend expects or a valid XDR.
  
  const networkPassphrase = process.env.STELLAR_NETWORK === 'mainnet'
    ? StellarSdk.Networks.PUBLIC
    : StellarSdk.Networks.TESTNET;

  const sourceAccount = new StellarSdk.Account(serverKeypair.publicKey(), '0');
  
  const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase,
  })
    .addOperation(
      StellarSdk.Operation.manageData({
        name: 'vaccichain auth',
        value: nonce,
        source: clientPublicKey,
      })
    )
    .setTimeout(300)
    .build();

  tx.sign(serverKeypair);

  return {
    transaction: overrides.transaction || tx.toXDR(),
    nonce: overrides.nonce || nonce,
    ...overrides
  };
};

module.exports = sep10ChallengeFactory;
