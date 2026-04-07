const StellarSdk = require('@stellar/stellar-sdk');

const SOROBAN_RPC_URL = process.env.SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE =
  process.env.STELLAR_NETWORK === 'mainnet'
    ? StellarSdk.Networks.PUBLIC
    : StellarSdk.Networks.TESTNET;

const CONTRACT_ID = process.env.VACCINATIONS_CONTRACT_ID;

function getRpcServer() {
  return new StellarSdk.SorobanRpc.Server(SOROBAN_RPC_URL);
}

/**
 * Invoke a Soroban contract function.
 * @param {string} secretKey - Caller's secret key
 * @param {string} method - Contract method name
 * @param {StellarSdk.xdr.ScVal[]} args - Method arguments
 */
async function invokeContract(secretKey, method, args) {
  const rpc = getRpcServer();
  const keypair = StellarSdk.Keypair.fromSecret(secretKey);
  const account = await rpc.getAccount(keypair.publicKey());

  const contract = new StellarSdk.Contract(CONTRACT_ID);

  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  const prepared = await rpc.prepareTransaction(tx);
  prepared.sign(keypair);

  const response = await rpc.sendTransaction(prepared);
  if (response.status === 'ERROR') {
    throw new Error(`Contract invocation failed: ${JSON.stringify(response.errorResult)}`);
  }

  // Poll for result
  let result;
  for (let i = 0; i < 10; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    result = await rpc.getTransaction(response.hash);
    if (result.status !== 'NOT_FOUND') break;
  }

  if (result.status !== 'SUCCESS') {
    throw new Error(`Transaction failed: ${result.status}`);
  }

  return result.returnValue;
}

/**
 * Read-only contract call (no signing needed).
 */
async function simulateContract(method, args) {
  const rpc = getRpcServer();
  const contract = new StellarSdk.Contract(CONTRACT_ID);

  // Use a dummy account for simulation
  const dummyKeypair = StellarSdk.Keypair.random();
  const account = new StellarSdk.Account(dummyKeypair.publicKey(), '0');

  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  const sim = await rpc.simulateTransaction(tx);
  if (StellarSdk.SorobanRpc.Api.isSimulationError(sim)) {
    throw new Error(`Simulation failed: ${sim.error}`);
  }

  return sim.result?.retval;
}

module.exports = { invokeContract, simulateContract };
