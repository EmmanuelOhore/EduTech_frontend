import { ShieldCheck, ShieldAlert, ShieldX, Clock } from "lucide-react";
import type { KycStatus } from "../types/TypeChecks";

/**
 * Verification badge derived from an instructor's KYC status (PRD §3).
 *   APPROVED      → "Verified"
 *   UNDER_REVIEW  → "Provisional"
 *   PENDING       → "Pending"
 *   REJECTED      → "Rejected"
 */
const CONFIG: Record<
  string,
  { label: string; cls: string; Icon: typeof ShieldCheck }
> = {
  APPROVED: { label: "Verified", cls: "bg-emerald-50 text-emerald-700", Icon: ShieldCheck },
  UNDER_REVIEW: { label: "Provisional", cls: "bg-[#e0f2fe] text-[#184e77]", Icon: ShieldAlert },
  PENDING: { label: "Pending", cls: "bg-amber-50 text-amber-700", Icon: Clock },
  REJECTED: { label: "Rejected", cls: "bg-red-50 text-red-700", Icon: ShieldX },
};

const KycBadge = ({
  status,
  size = "md",
}: {
  status?: KycStatus;
  size?: "sm" | "md";
}) => {
  const cfg = CONFIG[status ?? "PENDING"] ?? CONFIG["PENDING"]!;
  const Icon = cfg.Icon;
  const pad = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-bold ${pad} ${cfg.cls}`}>
      <Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      {cfg.label}
    </span>
  );
};

export default KycBadge;
