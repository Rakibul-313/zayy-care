import { get, ref } from "firebase/database";
import { database } from "@/firebase/config";

export type AdminRole = "admin" | "super-admin";

export interface AdminData {
  uid: string;
  email: string;
  role: AdminRole;
  active?: boolean;
  createdAt?: number;
}

export async function getAdminData(
  uid: string
): Promise<AdminData | null> {
  if (!uid) return null;

  try {
    const snapshot = await get(ref(database, `admins/${uid}`));

    if (!snapshot.exists()) {
      return null;
    }

    return snapshot.val() as AdminData;
  } catch (error) {
    console.error("Failed to fetch admin data:", error);
    return null;
  }
}

export async function isAdminUser(
  uid: string
): Promise<boolean> {
  const admin = await getAdminData(uid);

  return Boolean(admin && admin.active !== false);
}

export async function isSuperAdminUser(
  uid: string
): Promise<boolean> {
  const admin = await getAdminData(uid);

  return Boolean(
    admin &&
      admin.active !== false &&
      admin.role === "super-admin"
  );
}