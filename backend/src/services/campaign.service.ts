import { pool } from "../db";

export interface Campaign {
  id: number;
  merchant: string;
  reward_amount: number;
  expiration: number;
  active: boolean;
  total_claimed: number;
  tx_hash?: string;
  created_at: Date;
}

/**
 * Inserts a new campaign or updates an existing one in the database.
 * 
 * @param c - The campaign object to upsert.
 * @returns A promise that resolves when the operation is complete.
 * @throws Will throw an error if the database query fails.
 */
export async function upsertCampaign(c: Omit<Campaign, "created_at">): Promise<void> {
  await pool.query(
    `INSERT INTO campaigns (id, merchant, reward_amount, expiration, active, total_claimed, tx_hash)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (id) DO UPDATE SET
       active = EXCLUDED.active,
       total_claimed = EXCLUDED.total_claimed,
       updated_at = NOW()`,
    [c.id, c.merchant, c.reward_amount, c.expiration, c.active, c.total_claimed, c.tx_hash ?? null]
  );
}

/**
 * Retrieves all campaigns from the database, ordered by creation date descending.
 * 
 * @returns A promise that resolves to an array of Campaign objects.
 * @throws Will throw an error if the database query fails.
 */
export async function getCampaigns(): Promise<Campaign[]> {
  const { rows } = await pool.query<Campaign>(
    `SELECT * FROM campaigns ORDER BY created_at DESC`
  );
  return rows;
}

/**
 * Retrieves a single campaign by its ID.
 * 
 * @param id - The unique identifier of the campaign.
 * @returns A promise that resolves to the Campaign object if found, or null otherwise.
 * @throws Will throw an error if the database query fails.
 */
export async function getCampaignById(id: number): Promise<Campaign | null> {
  const { rows } = await pool.query<Campaign>(
    `SELECT * FROM campaigns WHERE id = $1`,
    [id]
  );
  return rows[0] ?? null;
}
