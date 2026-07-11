"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  updatePassword,
  updateProfile,
} from "firebase/auth";
import { onValue, ref, set, update } from "firebase/database";
import { auth, database } from "@/firebase/config";
import { getWishlistItems } from "@/lib/wishlist";
import { getCartCount } from "@/lib/cart";

import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  Pencil,
  Phone,
  Save,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";

type UserProfile = {
  uid?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  area?: string;
  photoURL?: string;
  dateOfBirth?: string;
  gender?: string;
  createdAt?: number;
  updatedAt?: number;
};

type Order = {
  id: string;
  orderNumber?: string;
  deleted?: boolean;
  customer?: {
    email?: string;
    name?: string;
    uid?: string;
  };
  total?: number;
  status?: string;
  createdAt?: number;
};

function money(value?: number) {
  return `৳${new Intl.NumberFormat("en-BD").format(Number(value || 0))}`;
}

function formatDate(value?: number) {
  if (!value) return "N/A";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function splitName(name?: string) {
  const parts = (name || "").trim().split(" ").filter(Boolean);
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" ") || "",
  };
}

export default function ProfilePage() {
  const router = useRouter();

  const [uid, setUid] = useState("");
  const [profile, setProfile] = useState<UserProfile>({});
  const [orders, setOrders] = useState<Order[]>([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setWishlistCount(getWishlistItems().length);
    setCartCount(getCartCount());

    const updateCounts = () => {
      setWishlistCount(getWishlistItems().length);
      setCartCount(getCartCount());
    };

    window.addEventListener("wishlistUpdated", updateCounts);
    window.addEventListener("cartUpdated", updateCounts);
    window.addEventListener("storage", updateCounts);

    return () => {
      window.removeEventListener("wishlistUpdated", updateCounts);
      window.removeEventListener("cartUpdated", updateCounts);
      window.removeEventListener("storage", updateCounts);
    };
  }, []);

  useEffect(() => {
    let unsubProfile: (() => void) | undefined;
    let unsubOrders: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      setUid(user.uid);

      const userRef = ref(database, `users/${user.uid}`);

      unsubProfile = onValue(userRef, async (snapshot) => {
        const data = snapshot.val();

        if (!data) {
          const nameParts = splitName(user.displayName || "ZAYY User");

          const initialProfile: UserProfile = {
            uid: user.uid,
            name: user.displayName || "ZAYY User",
            firstName: nameParts.firstName,
            lastName: nameParts.lastName,
            email: user.email || "",
            phone: "",
            address: "",
            city: "",
            area: "",
            photoURL: user.photoURL || "",
            dateOfBirth: "",
            gender: "",
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };

          await set(userRef, initialProfile);

          setProfile(initialProfile);
          setFirstName(initialProfile.firstName || "");
          setLastName(initialProfile.lastName || "");
          setPhone("");
          setAddress("");
          setCity("");
          setArea("");
          setDateOfBirth("");
          setGender("");
        } else {
          const nameParts = splitName(data.name || user.displayName || "");

          setProfile(data);
          setFirstName(data.firstName || nameParts.firstName || "");
          setLastName(data.lastName || nameParts.lastName || "");
          setPhone(data.phone || "");
          setAddress(data.address || "");
          setCity(data.city || "");
          setArea(data.area || "");
          setDateOfBirth(data.dateOfBirth || "");
          setGender(data.gender || "");
        }

        setLoading(false);
      });

      unsubOrders = onValue(ref(database, "orders"), (snapshot) => {
        const data = snapshot.val();

        if (!data) {
          setOrders([]);
          return;
        }

        const loaded = Object.entries(data)
          .map(([id, value]) => ({
            id,
            ...(value as Omit<Order, "id">),
          }))
          .filter((order) => {
            if (order.deleted === true) return false;

            const uidMatch = order.customer?.uid === user.uid;

            const emailMatch =
              order.customer?.email &&
              user.email &&
              order.customer.email.toLowerCase() === user.email.toLowerCase();

            return uidMatch || emailMatch;
          })
          .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));

        setOrders(loaded);
      });
    });

    return () => {
      unsubscribeAuth();
      if (unsubProfile) unsubProfile();
      if (unsubOrders) unsubOrders();
    };
  }, [router]);

  const totalSpent = useMemo(() => {
    return orders
      .filter((order) => order.status !== "cancelled")
      .reduce((sum, order) => sum + Number(order.total || 0), 0);
  }, [orders]);

  const fullName = `${firstName} ${lastName}`.trim() || profile.name || "";

  const handleSave = async () => {
    if (!uid) return;

    try {
      setSaving(true);

      const updatedProfile: UserProfile = {
        uid,
        name: fullName || "ZAYY User",
        firstName,
        lastName,
        email: profile.email || auth.currentUser?.email || "",
        phone,
        address,
        city,
        area,
        photoURL: profile.photoURL || "",
        dateOfBirth,
        gender,
        updatedAt: Date.now(),
        createdAt: profile.createdAt || Date.now(),
      };

      await update(ref(database, `users/${uid}`), updatedProfile);

      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: updatedProfile.name,
        });
      }

      setEditing(false);
      alert("Profile updated successfully");
    } catch (error) {
      console.error(error);
      alert("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (!auth.currentUser?.email) {
      alert("Please login again.");
      return;
    }

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
      setUpdatingPassword(true);

      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        currentPassword
      );

      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      alert("Password updated successfully.");
    } catch (error) {
      console.error(error);
      alert("Failed to update password. Check your current password.");
    } finally {
      setUpdatingPassword(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar cartCount={cartCount} wishlistCount={wishlistCount} />
        <main className="min-h-screen bg-[#fafaf7] px-4 pt-[140px]">
          <div className="mx-auto max-w-[800px] rounded-[6px] border border-[#0b3d2e]/10 bg-white p-10 text-center text-[#4f5f49]">
            Loading profile...
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar cartCount={cartCount} wishlistCount={wishlistCount} />

      <main className="min-h-screen bg-[#fafaf7]">
        <section className="px-4 pt-[110px] pb-10 sm:px-8 lg:px-14 lg:pt-[125px]">
          <div className="mx-auto grid max-w-[1500px] gap-6 lg:grid-cols-[1fr_330px]">

            <section className="space-y-6">
              <div>
                <h1 className="dream-font text-[42px] leading-none text-[#0b3d2e] sm:text-[54px]">
                  My Profile
                </h1>

                <p className="mt-2 text-sm text-[#4f5f49]">
                  Manage your personal information and account details.
                </p>
              </div>

              <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5 shadow-[0_8px_24px_rgba(11,61,46,0.06)]">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <h2 className="text-lg font-black text-[#102015]">
                    Personal Information
                  </h2>

                  <button
                    type="button"
                    onClick={() => (editing ? handleSave() : setEditing(true))}
                    disabled={saving}
                    className="flex h-9 items-center gap-2 rounded-[6px] border border-[#0b3d2e]/15 bg-[#fafaf7] px-4 text-xs font-black text-[#0b3d2e] disabled:opacity-60"
                  >
                    {editing ? <Save size={14} /> : <Pencil size={14} />}
                    {editing
                      ? saving
                        ? "Saving..."
                        : "Save Profile"
                      : "Edit Profile"}
                  </button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field
                    label="First Name"
                    value={firstName}
                    disabled={!editing}
                    onChange={setFirstName}
                  />

                  <Field
                    label="Last Name"
                    value={lastName}
                    disabled={!editing}
                    onChange={setLastName}
                  />

                  <Field
                    label="Email Address"
                    value={profile.email || ""}
                    disabled
                    onChange={() => {}}
                  />

                  <Field
                    label="Phone Number"
                    value={phone}
                    disabled={!editing}
                    onChange={setPhone}
                  />

                  <Field
                    label="Date of Birth"
                    type="date"
                    value={dateOfBirth}
                    disabled={!editing}
                    onChange={setDateOfBirth}
                  />

                  <label className="block">
                    <span className="mb-2 block text-xs font-black text-[#102015]">
                      Gender
                    </span>

                    <select
                      value={gender}
                      disabled={!editing}
                      onChange={(e) => setGender(e.target.value)}
                      className="h-11 w-full rounded-[6px] border border-[#0b3d2e]/10 bg-[#fafaf7] px-4 text-sm text-[#102015] outline-none disabled:opacity-70"
                    >
                      <option value="">Select Gender</option>
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                    </select>
                  </label>

                  <Field
                    label="Address"
                    value={address}
                    disabled={!editing}
                    onChange={setAddress}
                  />

                  <Field
                    label="City"
                    value={city}
                    disabled={!editing}
                    onChange={setCity}
                  />

                  <Field
                    label="Area"
                    value={area}
                    disabled={!editing}
                    onChange={setArea}
                  />
                </div>
              </div>

              <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5 shadow-[0_8px_24px_rgba(11,61,46,0.06)]">
                <h2 className="mb-5 text-lg font-black text-[#102015]">
                  Change Password
                </h2>

                <div className="grid gap-4 md:grid-cols-2">
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
                      disabled={updatingPassword}
                      className="h-11 w-full rounded-[6px] bg-[#0b3d2e] text-sm font-black uppercase text-white disabled:opacity-60"
                    >
                      {updatingPassword ? "Updating..." : "Update Password"}
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <aside className="space-y-6">
              <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5 shadow-[0_8px_24px_rgba(11,61,46,0.06)]">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-lg font-black text-[#102015]">
                    Recent Orders
                  </h2>

                  <Link
                    href="/profile/orders"
                    className="text-xs font-black text-[#0b3d2e]"
                  >
                    View all
                  </Link>
                </div>

                {orders.length === 0 ? (
                  <div className="rounded-[6px] bg-[#f5f1e8] p-4 text-sm text-[#4f5f49]">
                    No orders found.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.slice(0, 3).map((order) => (
                      <div
                        key={order.id}
                        className="grid grid-cols-[46px_1fr_auto] gap-3"
                      >
                        <div className="flex h-11 w-11 items-center justify-center rounded-[6px] bg-[#f5f1e8] text-[#0b3d2e]">
                          <ShoppingBag size={18} />
                        </div>

                        <div>
                          <p className="text-sm font-black text-[#102015]">
                            Order #{order.orderNumber || order.id.slice(0, 8)}
                          </p>

                          <p className="text-xs text-[#4f5f49]">
                            {formatDate(order.createdAt)}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-sm font-black text-[#102015]">
                            {money(order.total)}
                          </p>

                          <span className="rounded-[6px] bg-green-100 px-2 py-1 text-[10px] font-black capitalize text-green-700">
                            {order.status || "pending"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <Link
                  href="/profile/orders"
                  className="mt-5 flex h-10 items-center justify-center rounded-[6px] border border-[#0b3d2e]/15 bg-[#fafaf7] text-xs font-black text-[#0b3d2e]"
                >
                  View All Orders →
                </Link>
              </div>

              <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5 shadow-[0_8px_24px_rgba(11,61,46,0.06)]">
                <h2 className="mb-4 text-lg font-black text-[#102015]">
                  Account Preferences
                </h2>

                <Preference
                  icon={Mail}
                  title="Email Notifications"
                  text="Receive updates about orders and offers"
                />

                <Preference
                  icon={Phone}
                  title="SMS Notifications"
                  text="Receive SMS about order updates"
                />

                <Preference
                  icon={ShieldCheck}
                  title="Marketing Preferences"
                  text="Personalized offers and recommendations"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <StatCard label="Orders" value={orders.length} />
                <StatCard label="Wishlist" value={wishlistCount} />
                <StatCard label="Spent" value={money(totalSpent)} />
              </div>
            </aside>
          </div>
        </section>

        <Footer />
      </main>
    </>
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
    <label className="block">
      <span className="mb-2 block text-xs font-black text-[#102015]">
        {label}
      </span>

      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-[6px] border border-[#0b3d2e]/10 bg-[#fafaf7] px-4 text-sm text-[#102015] outline-none disabled:opacity-70"
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
    <label className="block">
      <span className="mb-2 block text-xs font-black text-[#102015]">
        {label}
      </span>

      <div className="flex h-11 items-center rounded-[6px] border border-[#0b3d2e]/10 bg-[#fafaf7] px-4">
        <Lock size={15} className="mr-2 text-[#4f5f49]" />

        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent text-sm outline-none"
        />

        <button type="button" onClick={() => setShow(!show)}>
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </label>
  );
}

function Preference({
  icon: Icon,
  title,
  text,
}: {
  icon: any;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-[#0b3d2e]/10 py-4 last:border-b-0">
      <div className="flex gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-[6px] bg-[#f5f1e8] text-[#0b3d2e]">
          <Icon size={16} />
        </div>

        <div>
          <p className="text-sm font-black text-[#102015]">{title}</p>
          <p className="text-xs text-[#4f5f49]">{text}</p>
        </div>
      </div>

      <span className="text-[#0b3d2e]">›</span>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-4 text-center">
      <p className="text-sm font-black text-[#0b3d2e]">{value}</p>
      <p className="mt-1 text-xs text-[#4f5f49]">{label}</p>
    </div>
  );
}