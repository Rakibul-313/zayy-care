"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  updateEmail,
  updatePassword,
  deleteUser,
  signOut,
} from "firebase/auth";
import { ref, update } from "firebase/database";
import { auth, database } from "@/firebase/config";
import { getCartCount } from "@/lib/cart";
import { getWishlistCount } from "@/lib/wishlist";

import {
  AlertTriangle,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  Trash2,
} from "lucide-react";

export default function AccountSettingsPage() {
  const router = useRouter();

  const [uid, setUid] = useState("");
  const [currentEmail, setCurrentEmail] = useState("");

  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [deletePassword, setDeletePassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setCartCount(getCartCount());
    setWishlistCount(getWishlistCount());

    const updateCounts = () => {
      setCartCount(getCartCount());
      setWishlistCount(getWishlistCount());
    };

    window.addEventListener("cartUpdated", updateCounts);
    window.addEventListener("wishlistUpdated", updateCounts);
    window.addEventListener("storage", updateCounts);

    return () => {
      window.removeEventListener("cartUpdated", updateCounts);
      window.removeEventListener("wishlistUpdated", updateCounts);
      window.removeEventListener("storage", updateCounts);
    };
  }, []);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      setUid(user.uid);
      setCurrentEmail(user.email || "");
      setNewEmail(user.email || "");
    });

    return () => unsubAuth();
  }, [router]);

  const reAuth = async (password: string) => {
    if (!auth.currentUser?.email) throw new Error("Please login again.");

    const credential = EmailAuthProvider.credential(
      auth.currentUser.email,
      password
    );

    await reauthenticateWithCredential(auth.currentUser, credential);
  };

  const handleEmailUpdate = async () => {
    if (!newEmail.trim() || !emailPassword.trim()) {
      alert("Please enter new email and current password.");
      return;
    }

    try {
      setSavingEmail(true);

      await reAuth(emailPassword);
      await updateEmail(auth.currentUser!, newEmail.trim());

      await update(ref(database, `users/${uid}`), {
        email: newEmail.trim(),
        updatedAt: Date.now(),
      });

      setCurrentEmail(newEmail.trim());
      setEmailPassword("");
      alert("Email updated successfully.");
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to update email.");
    } finally {
      setSavingEmail(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      alert("Please fill all password fields.");
      return;
    }

    if (newPassword.length < 6) {
      alert("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("New password and confirm password do not match.");
      return;
    }

    try {
      setSavingPassword(true);

      await reAuth(currentPassword);
      await updatePassword(auth.currentUser!, newPassword);

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      alert("Password updated successfully.");
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error ? error.message : "Failed to update password."
      );
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    const ok = confirm(
      "Are you sure you want to delete your account? This action cannot be undone."
    );

    if (!ok) return;

    if (!deletePassword.trim()) {
      alert("Please enter your current password.");
      return;
    }

    try {
      setDeleting(true);

      await reAuth(deletePassword);

      await update(ref(database, `users/${uid}`), {
        deleted: true,
        deletedAt: Date.now(),
      });

      await deleteUser(auth.currentUser!);
      alert("Account deleted.");
      router.push("/");
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error ? error.message : "Failed to delete account."
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  return (
    <>
      <Navbar cartCount={cartCount} wishlistCount={wishlistCount} />

      <main className="min-h-screen bg-[#fafaf7]">
        <section className="px-4 pt-[120px] pb-10 sm:px-8 lg:px-14 lg:pt-[135px]">
          <div className="mx-auto max-w-[1500px] space-y-6">
            <div>
              <h1 className="dream-font text-[42px] leading-none text-[#0b3d2e] sm:text-[54px]">
                Account Settings
              </h1>

              <p className="mt-2 text-sm text-[#4f5f49]">
                Manage login email, password and account security.
              </p>
            </div>

            <SettingsCard
              icon={Mail}
              title="Email Address"
              description="Update your login email address."
            >
              <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_auto]">
                <Field
                  label="Current Email"
                  value={currentEmail}
                  disabled
                  onChange={() => {}}
                />

                <Field
                  label="New Email"
                  value={newEmail}
                  onChange={setNewEmail}
                  type="email"
                />

                <PasswordField
                  label="Current Password"
                  value={emailPassword}
                  show={showPassword}
                  setShow={setShowPassword}
                  onChange={setEmailPassword}
                />

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleEmailUpdate}
                    disabled={savingEmail}
                    className="h-11 w-full rounded-[6px] bg-[#0b3d2e] px-6 text-sm font-black uppercase text-white disabled:opacity-60"
                  >
                    {savingEmail ? "Updating..." : "Update Email"}
                  </button>
                </div>
              </div>
            </SettingsCard>

            <SettingsCard
              icon={Lock}
              title="Password"
              description="Change your account password."
            >
              <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_auto]">
                <PasswordField
                  label="Current Password"
                  value={currentPassword}
                  show={showPassword}
                  setShow={setShowPassword}
                  onChange={setCurrentPassword}
                />

                <PasswordField
                  label="New Password"
                  value={newPassword}
                  show={showPassword}
                  setShow={setShowPassword}
                  onChange={setNewPassword}
                />

                <PasswordField
                  label="Confirm Password"
                  value={confirmPassword}
                  show={showPassword}
                  setShow={setShowPassword}
                  onChange={setConfirmPassword}
                />

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handlePasswordUpdate}
                    disabled={savingPassword}
                    className="h-11 w-full rounded-[6px] bg-[#0b3d2e] px-6 text-sm font-black uppercase text-white disabled:opacity-60"
                  >
                    {savingPassword ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </div>
            </SettingsCard>

            <SettingsCard
              icon={ShieldCheck}
              title="Session"
              description="Logout from your current account session."
            >
              <button
                type="button"
                onClick={handleLogout}
                className="h-11 rounded-[6px] border border-[#0b3d2e]/15 bg-[#fafaf7] px-6 text-sm font-black text-[#0b3d2e]"
              >
                Logout
              </button>
            </SettingsCard>

            <div className="rounded-[6px] border border-red-200 bg-red-50 p-5">
              <div className="mb-5 flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[6px] bg-white text-red-500">
                  <AlertTriangle size={20} />
                </div>

                <div>
                  <h2 className="text-xl font-black text-red-700">
                    Danger Zone
                  </h2>

                  <p className="mt-1 text-sm text-red-600">
                    Delete account is permanent. Your profile will be marked as
                    deleted.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
                <PasswordField
                  label="Current Password"
                  value={deletePassword}
                  show={showPassword}
                  setShow={setShowPassword}
                  onChange={setDeletePassword}
                />

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    disabled={deleting}
                    className="flex h-11 items-center justify-center gap-2 rounded-[6px] bg-red-600 px-6 text-sm font-black uppercase text-white disabled:opacity-60"
                  >
                    <Trash2 size={16} />
                    {deleting ? "Deleting..." : "Delete Account"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
}

function SettingsCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: any;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5 shadow-[0_8px_24px_rgba(11,61,46,0.06)]">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[6px] bg-[#f5f1e8] text-[#0b3d2e]">
          <Icon size={20} />
        </div>

        <div>
          <h2 className="text-xl font-black text-[#102015]">{title}</h2>
          <p className="mt-1 text-sm text-[#4f5f49]">{description}</p>
        </div>
      </div>

      {children}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  disabled,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  type?: string;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 block text-xs font-black text-[#102015]">
        {label}
      </span>

      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full min-w-0 rounded-[6px] border border-[#0b3d2e]/10 bg-[#fafaf7] px-4 text-sm text-[#102015] outline-none disabled:opacity-70"
      />
    </label>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  show,
  setShow,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  setShow: (value: boolean) => void;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 block text-xs font-black text-[#102015]">
        {label}
      </span>

      <div className="flex h-11 min-w-0 items-center rounded-[6px] border border-[#0b3d2e]/10 bg-[#fafaf7] px-4">
        <Lock size={15} className="mr-2 shrink-0 text-[#4f5f49]" />

        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full min-w-0 bg-transparent text-sm outline-none"
        />

        <button type="button" onClick={() => setShow(!show)}>
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </label>
  );
}