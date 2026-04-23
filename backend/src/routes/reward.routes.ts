import { Router, Request, Response } from "express";
import { getRewardsByUser } from "../services/reward.service";

export const rewardRouter = Router();

/**
 * GET /user/:address/rewards
 * Returns all rewards associated with a specific Stellar address.
 * 
 * @param address - The 56-character Stellar public key.
 */
rewardRouter.get("/user/:address/rewards", async (req: Request, res: Response) => {
  const { address } = req.params;
  if (!address || address.length !== 56) {
    return res.status(400).json({ error: "Invalid Stellar address" });
  }
  try {
    const rewards = await getRewardsByUser(address);
    res.json({ rewards });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch rewards" });
  }
});
