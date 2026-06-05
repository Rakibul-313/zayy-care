"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { onValue, push, ref, remove, set, update } from "firebase/database";
import { useRouter } from "next/navigation";
import {
  Mail,
  Plus,
  ShieldCheck,
  Trash2,
  UserCog,
  UserPlus,
} from "lucide-react";

import { auth, database } from "@/firebase/config";
import { isSuperAdminUser, type AdminRole } from "@/lib/admin";

type AdminUser = {
  uid: string;
  name?: string;
  email?: string;
  role?: AdminRole;
  active?: boolean;
  createdAt?: number;
};

type AdminInvite = {
  id: string;
  email?: string;
  role?: AdminRole;
  active?: boolean;
  createdAt?: number;
};

export default function AdminAccessPage() {
  const router = useRouter();

  const [currentUid, setCurrentUid] = useState("");
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [invites, setInvites] = useState<AdminInvite[]>([]);

  const [checking, setChecking] = useState(true);
  const [creating, setCreating] = useState(false);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AdminRole>("admin");

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      const allowed = await isSuperAdminUser(user.uid);

      if (!allowed) {
        router.push("/admin");
        return;
      }

      setCurrentUid(user.uid);
      setChecking(false);
    });

    return () => unsubAuth();
  }, [router]);

  useEffect(() => {
    if (checking) return;

    const unsubAdmins = onValue(ref(database, "admins"), (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setAdmins([]);
        return;
      }

      const loaded = Object.entries(data)
        .map(([uid, value]: any) => ({
          uid,
          ...value,
        }))
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

      setAdmins(loaded);
    });

    const unsubInvites = onValue(ref(database, "adminInvites"), (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setInvites([]);
        return;
      }

      const loaded = Object.entries(data)
        .map(([id, value]: any) => ({
          id,
          ...value,
        }))
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

      setInvites(loaded);
    });

    return () => {
      unsubAdmins();
      unsubInvites();
    };
  }, [checking]);

  const activeSuperAdmins = useMemo(() => {
    return admins.filter(
      (admin) => admin.role === "super-admin" && admin.active !== false
    );
  }, [admins]);

  const resetForm = () => {
    setEmail("");
    setRole("admin");
  };

  const handleCreateInvite = async () => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      alert("Email required");
      return;
    }

    const alreadyAdmin = admins.some(
      (admin) => admin.email?.toLowerCase() === cleanEmail
    );

    if (alreadyAdmin) {
      alert("This user is already an admin.");
      return;
    }

    const alreadyInvited = invites.some(
      (invite) =>
        invite.email?.toLowerCase() === cleanEmail && invite.active !== false
    );

    if (alreadyInvited) {
      alert("This email already has an active invite.");
      return;
    }

    try {
      setCreating(true);

      const inviteRef = push(ref(database, "adminInvites"));

      await set(inviteRef, {
        email: cleanEmail,
        role,
        active: true,
        createdAt: Date.now(),
      });

      alert("Admin invite created successfully.");
      resetForm();
    } catch (error: any) {
      console.log(error);
      alert(error.message || "Failed to create invite.");
    } finally {
      setCreating(false);
    }
  };

  const toggleAdminStatus = async (admin: AdminUser) => {
    if (admin.uid === currentUid) {
      alert("You cannot disable your own super admin account.");
      return;
    }

    if (
      admin.role === "super-admin" &&
      admin.active !== false &&
      activeSuperAdmins.length <= 1
    ) {
      alert("At least one active super admin must remain.");
      return;
    }

    await update(ref(database, `admins/${admin.uid}`), {
      active: admin.active === false,
      updatedAt: Date.now(),
    });
  };

  const changeRole = async (admin: AdminUser, newRole: AdminRole) => {
    if (admin.uid === currentUid && newRole !== "super-admin") {
      alert("You cannot remove your own super admin role.");
      return;
    }

    if (
      admin.role === "super-admin" &&
      newRole !== "super-admin" &&
      admin.active !== false &&
      activeSuperAdmins.length <= 1
    ) {
      alert("At least one active super admin must remain.");
      return;
    }

    await update(ref(database, `admins/${admin.uid}`), {
      role: newRole,
      updatedAt: Date.now(),
    });
  };

  const deleteAdmin = async (admin: AdminUser) => {
    if (admin.uid === currentUid) {
      alert("You cannot delete your own admin access.");
      return;
    }

    if (
      admin.role === "super-admin" &&
      admin.active !== false &&
      activeSuperAdmins.length <= 1
    ) {
      alert("At least one active super admin must remain.");
      return;
    }

    const ok = confirm(`Remove admin access for ${admin.email}?`);
    if (!ok) return;

    await remove(ref(database, `admins/${admin.uid}`));
  };

  const toggleInvite = async (invite: AdminInvite) => {
    await update(ref(database, `adminInvites/${invite.id}`), {
      active: invite.active === false,
      updatedAt: Date.now(),
    });
  };

  const deleteInvite = async (invite: AdminInvite) => {
    const ok = confirm(`Delete invite for ${invite.email}?`);
    if (!ok) return;

    await remove(ref(database, `adminInvites/${invite.id}`));
  };

  if (checking) {
    return (
      <div className="rounded-[30px] border border-white/65 bg-white/36 p-10 text-center shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
        Checking super admin access...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-white/65 bg-white/36 p-6 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
        <div className="flex items-center gap-3">
          <ShieldCheck className="text-[#556B2F]" size={32} />

          <div>
            <h1 className="text-4xl font-bold text-[#172313]">
              Admin Access
            </h1>

            <p className="mt-2 text-gray-600">
              Invite admins safely without logging out the current super admin.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        <div className="rounded-[26px] border border-white/65 bg-white/36 p-6 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
          <UserCog className="text-[#556B2F]" size={30} />
          <p className="mt-4 text-sm text-gray-600">Total Admins</p>
          <h2 className="text-3xl font-black text-[#172313]">
            {admins.length}
          </h2>
        </div>

        <div className="rounded-[26px] border border-white/65 bg-white/36 p-6 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
          <ShieldCheck className="text-[#556B2F]" size={30} />
          <p className="mt-4 text-sm text-gray-600">Super Admins</p>
          <h2 className="text-3xl font-black text-[#172313]">
            {activeSuperAdmins.length}
          </h2>
        </div>

        <div className="rounded-[26px] border border-white/65 bg-white/36 p-6 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
          <Mail className="text-[#556B2F]" size={30} />
          <p className="mt-4 text-sm text-gray-600">Active Invites</p>
          <h2 className="text-3xl font-black text-[#172313]">
            {invites.filter((invite) => invite.active !== false).length}
          </h2>
        </div>
      </section>

      <section className="rounded-[30px] border border-white/65 bg-white/36 p-6 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
        <h2 className="mb-5 text-2xl font-bold text-[#172313]">
          Create Admin Invite
        </h2>

        <div className="grid gap-4 md:grid-cols-[1fr_260px]">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Admin email address"
            type="email"
            className="rounded-2xl bg-white/60 px-5 py-4 outline-none"
          />

          <select
            value={role}
            onChange={(e) => setRole(e.target.value as AdminRole)}
            className="rounded-2xl bg-white/60 px-5 py-4 outline-none"
          >
            <option value="admin">Admin</option>
            <option value="super-admin">Super Admin</option>
          </select>
        </div>

        <button
          onClick={handleCreateInvite}
          disabled={creating}
          className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#556B2F] px-6 py-4 font-semibold text-white disabled:opacity-60"
        >
          <Plus size={18} />
          {creating ? "Creating..." : "Create Invite"}
        </button>
      </section>

      <section className="rounded-[30px] border border-white/65 bg-white/36 p-6 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
        <h2 className="mb-5 text-2xl font-bold text-[#172313]">
          Admin Users
        </h2>

        {admins.length === 0 ? (
          <div className="rounded-2xl bg-white/35 p-10 text-center text-gray-600">
            No admin users found.
          </div>
        ) : (
          <div className="grid gap-4">
            {admins.map((admin) => (
              <div
                key={admin.uid}
                className="flex flex-wrap items-center justify-between gap-4 rounded-[24px] bg-white/35 p-5"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#556B2F] text-white">
                    <UserCog size={24} />
                  </div>

                  <div>
                    <h3 className="font-bold text-[#172313]">
                      {admin.name || "Admin"}
                    </h3>
                    <p className="text-sm text-gray-600">{admin.email}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      UID: {admin.uid.slice(0, 14)}...
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={admin.role || "admin"}
                    onChange={(e) =>
                      changeRole(admin, e.target.value as AdminRole)
                    }
                    className="rounded-xl bg-white/70 px-4 py-3 outline-none"
                  >
                    <option value="admin">Admin</option>
                    <option value="super-admin">Super Admin</option>
                  </select>

                  <button
                    onClick={() => toggleAdminStatus(admin)}
                    className={`rounded-xl px-4 py-3 text-xs font-bold ${
                      admin.active === false
                        ? "bg-red-100 text-red-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {admin.active === false ? "OFF" : "ACTIVE"}
                  </button>

                  <button
                    onClick={() => deleteAdmin(admin)}
                    className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 text-red-700"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-[30px] border border-white/65 bg-white/36 p-6 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
        <h2 className="mb-5 text-2xl font-bold text-[#172313]">
          Pending Invites
        </h2>

        {invites.length === 0 ? (
          <div className="rounded-2xl bg-white/35 p-10 text-center text-gray-600">
            No admin invites found.
          </div>
        ) : (
          <div className="grid gap-4">
            {invites.map((invite) => (
              <div
                key={invite.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-[24px] bg-white/35 p-5"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#556B2F] text-white">
                    <UserPlus size={24} />
                  </div>

                  <div>
                    <h3 className="font-bold text-[#172313]">
                      {invite.email}
                    </h3>
                    <p className="text-sm capitalize text-gray-600">
                      Role: {invite.role || "admin"}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Created:{" "}
                      {invite.createdAt
                        ? new Date(invite.createdAt).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => toggleInvite(invite)}
                    className={`rounded-xl px-4 py-3 text-xs font-bold ${
                      invite.active === false
                        ? "bg-red-100 text-red-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {invite.active === false ? "OFF" : "ACTIVE"}
                  </button>

                  <button
                    onClick={() => deleteInvite(invite)}
                    className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 text-red-700"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}