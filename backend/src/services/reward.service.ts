import { pool } from "../db";

export interface Reward {
  id: string;
  user_address: string;
  campaign_id: number;
  amount: number;
  redeemed: boolean;
  redeemed_amount: number;
  claimed_at: Date;
  redeemed_at?: Date;
}

/**
 * Inserts a new reward or updates an existing one for a specific user and campaign.
 * Also ensures the user exists in the users table.
 * 
 * @param r - The reward object to upsert.
 * @returns A promise that resolves when the operation is complete.
 * @throws Will throw an error if the database query fails.
 */
export async function upsertReward(r: Omit<Reward, "id" | "claimed_at">): Promise<void> {
  // Ensure user row exists
  await pool.query(
    `INSERT INTO users (address) VALUES ($1) ON CONFLICT DO NOTHING`,
    [r.user_address]
  );
  await pool.query(
    `INSERT INTO rewards (user_address, campaign_id, amount, redeemed, redeemed_amount)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (user_address, campaign_id) DO UPDATE SET
       redeemed = EXCLUDED.redeemed,
       redeemed_amount = EXCLUDED.redeemed_amount,
       redeemed_at = CASE WHEN EXCLUDED.redeemed THEN NOW() ELSE rewards.redeemed_at END`,
    [r.user_address, r.campaign_id, r.amount, r.redeemed, r.redeemed_amount]
  );
}

/**
 * Retrieves all rewards associated with a specific user address.
 * 
 * @param address - The Stellar public key of the user.
 * @returns A promise that resolves to an array of Reward objects.
 * @throws Will throw an error if the database query fails.
 */
export async function getRewardsByUser(address: string): Promise<Reward[]> {
  const { rows } = await pool.query<Reward>(
    `SELECT r.*, c.reward_amount as campaign_reward
     FROM rewards r
     JOIN campaigns c ON c.id = r.campaign_id
     WHERE r.user_address = $1
     ORDER BY r.claimed_at DESC`,
    [address]
  );
  return rows;
}

/**
 * Records a blockchain transaction in the local database for auditing and indexing.
 * 
 * @param txHash - The unique hash of the transaction.
 * @param type - The type of transaction (e.g., 'claim', 'redeem', 'create_campaign').
 * @param userAddress - The address of the user involved, if any.
 * @param campaignId - The ID of the related campaign, if any.
 * @param amount - The amount involved in the transaction, if any.
 * @param ledger - The ledger sequence number.
 * @returns A promise that resolves when the record is inserted.
 * @throws Will throw an error if the database query fails.
 */
export async function recordTransaction(
  txHash: string,
  type: string,
  userAddress: string | null,
  campaignId: number | null,
  amount: number | null,
  ledger: number | null
): Promise<void> {
  await pool.query(
    `INSERT INTO transactions (tx_hash, type, user_address, campaign_id, amount, ledger)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (tx_hash) DO NOTHING`,
    [txHash, type, userAddress, campaignId, amount, ledger]
  );
}
