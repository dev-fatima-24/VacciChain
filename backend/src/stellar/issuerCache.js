const StellarSdk = require('@stellar/stellar-sdk');
const { simulateContract } = require('./soroban');

const cache = new Map();
const TTL = 30 * 1000; // 30 seconds

/**
 * Check if a wallet address is an authorized issuer on-chain.
 * Results are cached for 30 seconds.
 * @param {string} wallet 
 * @returns {Promise<boolean>}
 */
async function isAuthorizedIssuer(wallet) {
  const now = Date.now();
  const cached = cache.get(wallet);

  if (cached && (now - cached.timestamp < TTL)) {
    return cached.value;
  }

  try {
    const args = [StellarSdk.Address.fromString(wallet).toScVal()];
    const result = await simulateContract('is_issuer', args);
    const isAuthorized = StellarSdk.scValToNative(result);

    cache.set(wallet, {
      value: !!isAuthorized,
      timestamp: now
    });

    return !!isAuthorized;
  } catch (error) {
    // If simulation fails, we don't cache to allow retry
    throw error;
  }
}

/**
 * Invalidate the cache for a specific wallet or clear the entire cache.
 * @param {string} [wallet] 
 */
function invalidateCache(wallet) {
  if (wallet) {
    cache.delete(wallet);
  } else {
    cache.clear();
  }
}

module.exports = { isAuthorizedIssuer, invalidateCache };
