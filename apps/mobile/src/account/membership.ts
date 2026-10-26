import type { CoachingMembership } from "@/api/account";
import { colors } from "@/theme";

/** How each coaching membership status reads, wherever it is shown. */
export const MEMBERSHIP_STATUS: Record<CoachingMembership["status"], { label: string; color: string }> = {
  none: { label: "No program yet", color: colors.textSecondary },
  trial: { label: "Free trial", color: colors.gold },
  paid: { label: "Active", color: colors.success },
  due: { label: "Payment due", color: colors.warning },
  expired: { label: "Expired", color: colors.danger },
};
