import { get, ref } from "firebase/database";
import { database } from "@/firebase/config";

export type AdminRole = "admin" | "super-admin";

export async function getAdminData(uid: string) {
  if (!uid) return null;

  const snapshot = await get(ref(database, `admins/${uid}`));

  if (!snapshot.exists()) return null;

  return snapshot.val();
}

export async function isAdminUser(uid: string) {
  const admin = await getAdminData(uid);

  return !!admin && admin.active !== false;
}

export async function isSuperAdminUser(uid: string) {
  const admin = await getAdminData(uid);

  return !!admin && admin.active !== false && admin.role === "super-admin";
}