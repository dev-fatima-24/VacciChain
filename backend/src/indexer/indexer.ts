/**
 * Event indexer — polls Soroban RPC for contract events and persists them.
 * Runs as a background loop alongside the Express server.
 */
import { SorobanRpc, xdr } from "@stellar/stellar-sdk";
import { rpcServer } from "../soroban";
import { upsertCampaign } from "../services/campaign.service";
import { upsertReward, recordTransaction } from "../services/reward.service";
import { pool } from "../db";

const REWARDS_CONTRACT = process.env.REWARDS_CONTRACT_ID ?? "";
const CAMPAIGN_CONTRACT = process.env.CAMPAIGN_CONTRACT_ID ?? "";
const POLL_INTERVAL_MS = 5_000;

// Persist cursor so we don't re-process events on restart
async function getCursor(): Promise<string | undefined> {
  const { rows } = await pool.query<{ value: string }>(
    `SELECT value FROM indexer_state WHERE key = 'cursor' LIMIT 1`
  );
  return rows[0]?.value;
}

async function saveCursor(cursor: string): Promise<void> {
  await pool.query(
    `INSERT INTO indexer_state (key, value) VALUES ('cursor', $1)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    [cursor]
  );
}

async function ensureIndexerTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS indexer_state (
      key   VARCHAR(64) PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);
}

function decodeAddress(val: xdr.ScVal): string {
  return val.address().toString();
}

function decodeI128(val: xdr.ScVal): number {
  const hi = val.i128().hi().toBigInt();
  const lo = val.i128().lo().toBigInt();
  return Number((hi << 64n) | lo);
}

function decodeU64(val: xdr.ScVal): number {
  return Number(val.u64().toBigInt());
}

async function processEvent(event: SorobanRpc.Api.RawEventResponse): Promise<void> {
  if (event.type !== "contract") return;

  const topics = event.topic.map((t) => xdr.ScVal.fromXDR(t, "base64"));
  const eventName = topics[0]?.sym() ?? "";

  if (event.contractId === CAMPAIGN_CONTRACT && eventName === "CAM_CRT") {
    // topics: [CAM_CRT, "id", id_val], value: merchant_address
    const id = decodeU64(topics[2]);
    const merchant = decodeAddress(xdr.ScVal.fromXDR(event.value, "base64"));
    await upsertCampaign({
      id,
      merchant,
      reward_amount: 0, // will be updated when we fetch from chain
      expiration: 0,
      active: true,
      total_claimed: 0,
      tx_hash: event.txHash,
    });
    await recordTransaction(event.txHash, "campaign_created", merchant, id, null, event.ledger);
    console.log(`[indexer] CampaignCreated id=${id} merchant=${merchant}`);
  }

  if (event.contractId === REWARDS_CONTRACT && eventName === "RWD_CLM") {
    // topics: [RWD_CLM, "user", user_addr], value: (campaign_id, amount)
    const user = decodeAddress(topics[2]);
    const valueVec = xdr.ScVal.fromXDR(event.value, "base64").vec()!;
    const campaignId = decodeU64(valueVec[0]);
    const amount = decodeI128(valueVec[1]);
    await upsertReward({ user_address: user, campaign_id: campaignId, amount, redeemed: false, redeemed_amount: 0 });
    await recordTransaction(event.txHash, "claim", user, campaignId, amount, event.ledger);
    console.log(`[indexer] RewardClaimed user=${user} campaign=${campaignId} amount=${amount}`);
  }

  if (event.contractId === REWARDS_CONTRACT && eventName === "RWD_RDM") {
    // topics: [RWD_RDM, "user", user_addr], value: amount
    const user = decodeAddress(topics[2]);
    const amount = decodeI128(xdr.ScVal.fromXDR(event.value, "base64"));
    await recordTransaction(event.txHash, "redeem", user, null, amount, event.ledger);
    console.log(`[indexer] RewardRedeemed user=${user} amount=${amount}`);
  }
}

/**
 * Starts the background event indexer.
 * It polls the Soroban RPC for contract events (Campaign creation, Reward claim/redeem)
 * and persists them to the local database.
 * 
 * @returns A promise that resolves when the indexer has started its initial poll.
 */
export async function startIndexer(): Promise<void> {
  await ensureIndexerTable();
  console.log("[indexer] started");

  const poll = async () => {
    try {
      const cursor = await getCursor();
      const filters: SorobanRpc.Api.EventFilter[] = [
        { type: "contract", contractIds: [CAMPAIGN_CONTRACT, REWARDS_CONTRACT] },
      ];

      const result = await rpcServer.getEvents({
        startLedger: cursor ? undefined : 1,
        cursor,
        filters,
        limit: 100,
      });

      for (const event of result.events) {
        await processEvent(event as SorobanRpc.Api.RawEventResponse);
      }

      if (result.events.length > 0) {
        const last = result.events[result.events.length - 1];
        await saveCursor((last as SorobanRpc.Api.RawEventResponse).pagingToken);
      }
    } catch (err) {
      console.error("[indexer] poll error:", err);
    }
  };

  // Run immediately then on interval
  await poll();
  setInterval(poll, POLL_INTERVAL_MS);
}
