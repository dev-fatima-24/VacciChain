import { Router, Request, Response } from "express";
import { z } from "zod";
import { getCampaigns, getCampaignById } from "../services/campaign.service";

export const campaignRouter = Router();

/**
 * GET /campaigns
 * Returns a list of all campaigns stored in the database.
 */
campaignRouter.get("/", async (_req: Request, res: Response) => {
  try {
    const campaigns = await getCampaigns();
    res.json({ campaigns });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch campaigns" });
  }
});

/**
 * GET /campaigns/:id
 * Returns a single campaign by its ID.
 */
campaignRouter.get("/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
  try {
    const campaign = await getCampaignById(id);
    if (!campaign) return res.status(404).json({ error: "Not found" });
    res.json({ campaign });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch campaign" });
  }
});
