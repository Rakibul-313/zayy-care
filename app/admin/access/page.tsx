"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { onValue, push, ref, set, update } from "firebase/database";
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
  deleted?: boolean;
  updatedAt?: number;
};

type AdminInvite = {
  id: string;
  email?: string;
  role?: AdminRole;
  active?: boolean;
  createdAt?: number;
  deleted?: boolean;
  updatedAt?: number;
  acceptedAt?: number;
  acceptedBy?: string;
};

function dateText(value?: number) {
  if (!value) return "N/A";
  return new Date(value).toLocaleDateString();
}

export default function AdminAccessPage() {
  const router = useRouter();

  const [currentUid, setCurrentUid] = useState("");
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [invites, setInvites] = useState<AdminInvite[]>([]);

  const [checking, setChecking] = useState(true);
  const [loadingData, setLoadingData] = useState(true);
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

    let adminsLoaded = false;
    let invitesLoaded = false;

    const checkLoading = () => {
      if (adminsLoaded && invitesLoaded) {
        setLoadingData(false);
      }
    };

    const unsubAdmins = onValue(ref(database, "admins"), (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setAdmins([]);
        adminsLoaded = true;
        checkLoading();
        return;
      }

      const loaded = Object.entries(data)
        .map(([uid, value]) => ({
          uid,
          ...(value as Omit<AdminUser, "uid">),
        }))
        .filter((admin) => admin.deleted !== true)
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

      setAdmins(loaded);
      adminsLoaded = true;
      checkLoading();
    });

    const unsubInvites = onValue(ref(database, "adminInvites"), (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setInvites([]);
        invitesLoaded = true;
        checkLoading();
        return;
      }

      const loaded = Object.entries(data)
        .map(([id, value]) => ({
          id,
          ...(value as Omit<AdminInvite, "id">),
        }))
        .filter((invite) => invite.deleted !== true)
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

      setInvites(loaded);
      invitesLoaded = true;
      checkLoading();
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

  const activeAdmins = useMemo(() => {
    return admins.filter((admin) => admin.active !== false).length;
  }, [admins]);

  const activeInvites = useMemo(() => {
    return invites.filter((invite) => invite.active !== false).length;
  }, [invites]);

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
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error ? error.message : "Failed to create invite."
      );
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

    const ok = confirm(`Remove admin access for ${admin.email || "Admin"}?`);
    if (!ok) return;

    await update(ref(database, `admins/${admin.uid}`), {
      deleted: true,
      active: false,
      deletedAt: Date.now(),
      updatedAt: Date.now(),
    });
  };

  const toggleInvite = async (invite: AdminInvite) => {
    await update(ref(database, `adminInvites/${invite.id}`), {
      active: invite.active === false,
      updatedAt: Date.now(),
    });
  };

  const deleteInvite = async (invite: AdminInvite) => {
    const ok = confirm(`Delete invite for ${invite.email || "this email"}?`);
    if (!ok) return;

    await update(ref(database, `adminInvites/${invite.id}`), {
      deleted: true,
      active: false,
      deletedAt: Date.now(),
      updatedAt: Date.now(),
    });
  };

  if (checking) {
    return (
      <main className="space-y-6 bg-[#fafaf7] text-[#263421]">
        <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-10 text-center font-bold text-[#4f5f49] shadow-[0_8px_24px_rgba(11,61,46,0.06)]">
          Checking super admin access...
        </div>
      </main>
    );
  }

  return (
    <main className="space-y-6 bg-[#fafaf7] text-[#263421]">
      <section className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-6 shadow-[0_8px_24px_rgba(11,61,46,0.06)] sm:p-8">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-[6px] bg-[#f5f1e8] text-[#0b3d2e]">
            <ShieldCheck size={28} />
          </div>

          <div>
            <h1 className="text-3xl font-black text-[#102015] sm:text-4xl">
              Admin Access
            </h1>

            <p className="mt-2 text-sm font-medium text-[#4f5f49]">
              Invite admins safely without logging out the current super admin.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5 shadow-[0_8px_24px_rgba(11,61,46,0.06)]">
          <UserCog className="text-[#556B2F]" size={28} />
          <p className="mt-4 text-xs font-bold uppercase tracking-wide text-[#4f5f49]">
            Total Admins
          </p>
          <h2 className="mt-2 text-4xl font-black text-[#102015]">
            {admins.length}
          </h2>
        </div>

        <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5 shadow-[0_8px_24px_rgba(11,61,46,0.06)]">
          <ShieldCheck className="text-[#556B2F]" size={28} />
          <p className="mt-4 text-xs font-bold uppercase tracking-wide text-[#4f5f49]">
            Super Admins
          </p>
          <h2 className="mt-2 text-4xl font-black text-[#102015]">
            {activeSuperAdmins.length}
          </h2>
        </div>

        <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5 shadow-[0_8px_24px_rgba(11,61,46,0.06)]">
          <UserCog className="text-[#556B2F]" size={28} />
          <p className="mt-4 text-xs font-bold uppercase tracking-wide text-[#4f5f49]">
            Active Admins
          </p>
          <h2 className="mt-2 text-4xl font-black text-[#102015]">
            {activeAdmins}
          </h2>
        </div>

        <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5 shadow-[0_8px_24px_rgba(11,61,46,0.06)]">
          <Mail className="text-[#556B2F]" size={28} />
          <p className="mt-4 text-xs font-bold uppercase tracking-wide text-[#4f5f49]">
            Active Invites
          </p>
          <h2 className="mt-2 text-4xl font-black text-[#102015]">
            {activeInvites}
          </h2>
        </div>
      </section>

      <section className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5 shadow-[0_8px_24px_rgba(11,61,46,0.06)] sm:p-6">
        <h2 className="mb-5 text-2xl font-black text-[#102015]">
          Create Admin Invite
        </h2>

        <div className="grid gap-4 md:grid-cols-[1fr_260px]">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#4f5f49]">
              Admin Email
            </label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Admin email address"
              type="email"
              className="w-full rounded-[6px] border border-[#0b3d2e]/10 bg-[#f5f1e8] px-5 py-4 text-sm font-medium text-[#263421] outline-none placeholder:text-[#4f5f49] focus:border-[#0b3d2e]/30"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#4f5f49]">
              Admin Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as AdminRole)}
              className="w-full rounded-[6px] border border-[#0b3d2e]/10 bg-[#f5f1e8] px-5 py-4 text-sm font-bold text-[#263421] outline-none focus:border-[#0b3d2e]/30"
            >
              <option value="admin">Admin</option>
              <option value="super-admin">Super Admin</option>
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCreateInvite}
          disabled={creating}
          className="mt-6 inline-flex items-center gap-2 rounded-[6px] bg-[#003f2a] px-6 py-4 text-sm font-bold text-white transition hover:bg-[#062A18] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Plus size={18} />
          {creating ? "Creating..." : "Create Invite"}
        </button>
      </section>

      <section className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5 shadow-[0_8px_24px_rgba(11,61,46,0.06)] sm:p-6">
        <h2 className="mb-5 text-2xl font-black text-[#102015]">
          Admin Users
        </h2>

        {loadingData ? (
          <div className="rounded-[6px] bg-[#f5f1e8] p-10 text-center font-bold text-[#4f5f49]">
            Loading admin users...
          </div>
        ) : admins.length === 0 ? (
          <div className="rounded-[6px] bg-[#f5f1e8] p-10 text-center font-bold text-[#4f5f49]">
            No admin users found.
          </div>
        ) : (
          <div className="grid gap-4">
            {admins.map((admin) => (
              <div
                key={admin.uid}
                className="flex flex-wrap items-center justify-between gap-4 rounded-[6px] bg-[#f5f1e8] p-5"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[6px] bg-[#003f2a] text-white">
                    <UserCog size={24} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-black text-[#102015]">
                        {admin.name || "Admin"}
                      </h3>

                      <span
                        className={`rounded-[6px] px-3 py-1 text-xs font-bold ${
                          admin.role === "super-admin"
                            ? "bg-yellow-50 text-yellow-700"
                            : "bg-green-50 text-green-700"
                        }`}
                      >
                        {admin.role === "super-admin" ? "Super Admin" : "Admin"}
                      </span>
                    </div>

                    <p className="mt-1 break-all text-sm font-medium text-[#263421]">
                      {admin.email || "No email"}
                    </p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-wide text-[#4f5f49]">
                      UID: {admin.uid.slice(0, 14)}... • Created:{" "}
                      {dateText(admin.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={admin.role || "admin"}
                    onChange={(e) =>
                      changeRole(admin, e.target.value as AdminRole)
                    }
                    className="rounded-[6px] border border-[#0b3d2e]/10 bg-white px-4 py-3 text-sm font-bold text-[#263421] outline-none"
                  >
                    <option value="admin">Admin</option>
                    <option value="super-admin">Super Admin</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => toggleAdminStatus(admin)}
                    className={`rounded-[6px] px-4 py-3 text-xs font-bold ${
                      admin.active === false
                        ? "bg-red-50 text-red-700"
                        : "bg-green-50 text-green-700"
                    }`}
                  >
                    {admin.active === false ? "OFF" : "ACTIVE"}
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteAdmin(admin)}
                    className="flex h-11 w-11 items-center justify-center rounded-[6px] bg-red-50 text-red-700 transition hover:bg-red-100"
                    aria-label="Delete admin"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5 shadow-[0_8px_24px_rgba(11,61,46,0.06)] sm:p-6">
        <h2 className="mb-5 text-2xl font-black text-[#102015]">
          Pending Invites
        </h2>

        {loadingData ? (
          <div className="rounded-[6px] bg-[#f5f1e8] p-10 text-center font-bold text-[#4f5f49]">
            Loading admin invites...
          </div>
        ) : invites.length === 0 ? (
          <div className="rounded-[6px] bg-[#f5f1e8] p-10 text-center font-bold text-[#4f5f49]">
            No admin invites found.
          </div>
        ) : (
          <div className="grid gap-4">
            {invites.map((invite) => (
              <div
                key={invite.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-[6px] bg-[#f5f1e8] p-5"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[6px] bg-[#003f2a] text-white">
                    <UserPlus size={24} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="break-all font-black text-[#102015]">
                        {invite.email || "No email"}
                      </h3>

                      <span
                        className={`rounded-[6px] px-3 py-1 text-xs font-bold ${
                          invite.role === "super-admin"
                            ? "bg-yellow-50 text-yellow-700"
                            : "bg-green-50 text-green-700"
                        }`}
                      >
                        {invite.role === "super-admin" ? "Super Admin" : "Admin"}
                      </span>
                    </div>

                    <p className="mt-1 text-sm font-medium capitalize text-[#263421]">
                      Role: {invite.role || "admin"}
                    </p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-wide text-[#4f5f49]">
                      Created: {dateText(invite.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleInvite(invite)}
                    className={`rounded-[6px] px-4 py-3 text-xs font-bold ${
                      invite.active === false
                        ? "bg-red-50 text-red-700"
                        : "bg-green-50 text-green-700"
                    }`}
                  >
                    {invite.active === false ? "OFF" : "ACTIVE"}
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteInvite(invite)}
                    className="flex h-11 w-11 items-center justify-center rounded-[6px] bg-red-50 text-red-700 transition hover:bg-red-100"
                    aria-label="Delete invite"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}