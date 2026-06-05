import type { User } from "firebase/auth";
import { get, ref, set, update } from "firebase/database";
import { database } from "@/firebase/config";
import type { AdminRole } from "@/lib/admin";

export async function acceptAdminInvite(user: User): Promise<boolean> {
  if (!user.email) return false;

  const snap = await get(ref(database, "adminInvites"));
  if (!snap.exists()) return false;

  let matchedInviteId = "";
  let matchedRole: AdminRole = "admin";

  snap.forEach((child) => {
    const invite = child.val();

    if (
      invite.email?.toLowerCase() === user.email?.toLowerCase() &&
      invite.active !== false
    ) {
      matchedInviteId = child.key || "";
      matchedRole = invite.role || "admin";
    }
  });

  if (!matchedInviteId) return false;

  await set(ref(database, `admins/${user.uid}`), {
    uid: user.uid,
    name: user.displayName || "Admin",
    email: user.email,
    role: matchedRole,
    active: true,
    createdAt: Date.now(),
    acceptedInviteId: matchedInviteId,
  });

  await update(ref(database, `adminInvites/${matchedInviteId}`), {
    active: false,
    acceptedAt: Date.now(),
    acceptedBy: user.uid,
  });

  return true;
}