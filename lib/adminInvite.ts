import type { User } from "firebase/auth";
import { get, ref, set, update } from "firebase/database";
import { database } from "@/firebase/config";
import type { AdminRole } from "@/lib/admin";

export async function acceptAdminInvite(
  user: User
): Promise<boolean> {
  if (!user.email) {
    return false;
  }

  const userEmail = user.email.toLowerCase();

  try {
    const inviteSnapshot = await get(ref(database, "adminInvites"));

    if (!inviteSnapshot.exists()) {
      return false;
    }

    let matchedInviteId = "";
    let matchedRole: AdminRole = "admin";

    inviteSnapshot.forEach((child) => {
      const invite = child.val();

      if (
        invite?.email?.toLowerCase() === userEmail &&
        invite?.active !== false
      ) {
        matchedInviteId = child.key ?? "";

        matchedRole =
          invite.role === "super-admin"
            ? "super-admin"
            : "admin";
      }
    });

    if (!matchedInviteId) {
      return false;
    }

    const adminRef = ref(database, `admins/${user.uid}`);

    // Prevent duplicate admin creation
    const existingAdmin = await get(adminRef);

    if (existingAdmin.exists()) {
      return true;
    }

    await set(adminRef, {
      uid: user.uid,
      name: user.displayName || "Admin",
      email: user.email,
      role: matchedRole,
      active: true,
      createdAt: Date.now(),
      acceptedInviteId: matchedInviteId,
    });

    await update(
      ref(database, `adminInvites/${matchedInviteId}`),
      {
        active: false,
        acceptedAt: Date.now(),
        acceptedBy: user.uid,
      }
    );

    return true;
  } catch (error) {
    console.error("Failed to accept admin invite:", error);
    return false;
  }
}