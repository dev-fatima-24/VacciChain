"use client";

import { Campaign } from "@/lib/api";

interface Props {
  campaign: Campaign;
  onClaim?: (id: number) => void;
  claiming?: boolean;
}

export function CampaignCard({ campaign, onClaim, claiming }: Props) {
  const now = Date.now() / 1000;
  const expired = now > campaign.expiration;
  const status = !campaign.active ? "Inactive" : expired ? "Expired" : "Active";
  const canClaim = campaign.active && !expired;

  const secondsLeft = campaign.expiration - now;
  const daysLeft = Math.floor(secondsLeft / 86400);
  const hoursLeft = Math.floor((secondsLeft % 86400) / 3600);

  let urgency: "low" | "medium" | "high" | "expired" = "low";
  if (expired) urgency = "expired";
  else if (daysLeft < 1) urgency = "high";
  else if (daysLeft < 3) urgency = "medium";

  const expiryText = expired
    ? "Expired"
    : daysLeft > 0
    ? `${daysLeft}d ${hoursLeft}h left`
    : `${hoursLeft}h left`;

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="campaign-title">Campaign #{campaign.id}</h3>
        <span className="badge" data-status={status.toLowerCase()}>
          {status}
        </span>
      </div>
      <div className="card-body">
        <div className="reward-container">
          <p className="reward-label">Reward Amount</p>
          <p className="reward-highlight">{campaign.reward_amount.toLocaleString()} LYT</p>
        </div>
        
        <p className="expiry-text">
          <span className="expiry-dot" data-urgency={urgency}></span>
          {expiryText}
        </p>

        <p className="campaign-id">
          Merchant: <span className="mono">{campaign.merchant.slice(0, 8)}…{campaign.merchant.slice(-4)}</span>
        </p>
      </div>
      {onClaim && (
        <div className="card-footer">
          <button
            onClick={() => onClaim(campaign.id)}
            disabled={!canClaim || claiming}
            className="btn btn-primary"
          >
            {claiming ? "Claiming…" : "Claim Reward"}
          </button>
        </div>
      )}
    </div>
  );
}
