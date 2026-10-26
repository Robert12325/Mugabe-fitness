import { confirmAccountOwner, removeLogin } from "./account";
import { deleteTracking } from "./daily";
import { unlinkUserEnquiries } from "./enquiry";
import { deleteMembership } from "./membership";

export type DeletionResult = "deleted" | "unauthorized" | "wrong-password";

/**
 * Permanently deletes the signed-in account, once its password is
 * confirmed: the daily log, weigh-ins, targets and coach notes; the
 * membership with its renewal screenshots; the link to its bookings; then
 * the profile, the email and the session.
 *
 * Bookings themselves stay, as the coach's booking and payment records,
 * linked to no account.
 *
 * The login goes last: if an earlier step fails, the member is still
 * signed in and can simply try again.
 */
export async function deleteAccount(request: Request, password: string): Promise<DeletionResult> {
  const owner = await confirmAccountOwner(request, password);

  if (!owner.ok) return owner.reason;

  await deleteTracking(owner.user.id);
  await deleteMembership(owner.user.id);
  await unlinkUserEnquiries(owner.user.id);
  await removeLogin(request, owner.user);

  return "deleted";
}
