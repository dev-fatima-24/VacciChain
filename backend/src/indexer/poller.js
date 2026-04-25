/**
 * Polls the Soroban RPC for contract events and stores them in SQLite.
 *
 * Soroban RPC: getEvents({ startLedger, filters: [{ contractIds, topics }] })
 * Indexed event types: VaccinationMinted, IssuerAdded, IssuerRevoked
 */
const StellarSdk = require('@stellar/stellar-sdk');
const { upsertEvents, getLatestLedger } = require('./db');

const SOROBAN_RPC_URL = process.env.SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org';
const CONTRACT_ID = process.env.VACCINATIONS_CONTRACT_ID;

// Map Soroban symbol_short event topic names to our internal event_type strings
const TOPIC_MAP = {
  minted:  'VaccinationMinted',
  iss_add: 'IssuerAdded',
  iss_rev: 'IssuerRevoked',
};

let timer = null;

function getRpc() {
  return new StellarSdk.SorobanRpc.Server(SOROBAN_RPC_URL);
}

/** Parse a raw Soroban event into our storage shape. Returns null if unrecognised. */
function parseEvent(raw) {
  try {
    const topicVal = raw.topic?.[0];
    if (!topicVal) return null;

    // topic[0] is a ScVal symbol — extract the string value
    const topicStr = topicVal.value?.toString?.() ?? topicVal.toString();
    const event_type = TOPIC_MAP[topicStr];
    if (!event_type) return null;

    return {
      id: raw.id,
      event_type,
      ledger: raw.ledger,
      timestamp: raw.ledgerClosedAt
        ? Math.floor(new Date(raw.ledgerClosedAt).getTime() / 1000)
        : 0,
      contract_id: raw.contractId ?? CONTRACT_ID,
      payload: raw.value ?? {},
    };
  } catch {
    return null;
  }
}

async function poll() {
  if (!CONTRACT_ID) {
    if (process.env.NODE_ENV !== 'test') {
      console.warn('[indexer] VACCINATIONS_CONTRACT_ID not set — skipping poll');
    }
    return;
  }

  try {
    const rpc = getRpc();
    const startLedger = getLatestLedger() + 1;

    const response = await rpc.getEvents({
      startLedger,
      filters: [{ contractIds: [CONTRACT_ID] }],
    });

    const events = (response.events ?? [])
      .map(parseEvent)
      .filter(Boolean);

    if (events.length) {
      upsertEvents(events);
      if (process.env.NODE_ENV !== 'test') {
        console.log(`[indexer] Stored ${events.length} new event(s) from ledger ${startLedger}`);
      }
    }
  } catch (err) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('[indexer] Poll error:', err.message);
    }
  }
}

/**
 * Start the background polling loop.
 * @param {number} intervalMs
 */
function startPoller(intervalMs) {
  if (timer) return;
  poll(); // immediate first run
  timer = setInterval(poll, intervalMs);
  if (process.env.NODE_ENV !== 'test') {
    console.log(`[indexer] Polling every ${intervalMs}ms`);
  }
}

function stopPoller() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

module.exports = { startPoller, stopPoller, poll, parseEvent };
