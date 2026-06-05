"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, updateProfile } from "firebase/auth";
import { onValue, ref, set, update } from "firebase/database";
import { auth, database } from "@/firebase/config";
import { getWishlistItems } from "@/lib/wishlist";
import Link from "next/link";

import {
  User,
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
  Heart,
  Settings,
  LogOut,
  Save,
} from "lucide-react";

type UserProfile = {
  uid?: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  area?: string;
  photoURL?: string;
  createdAt?: number;
  updatedAt?: number;
};

type Order = {
  id: string;
  customer?: {
    email?: string;
    name?: string;
  };
  shippingAddress?: {
    fullName?: string;
    phone?: string;
    city?: string;
    area?: string;
  };
  total?: number;
  status?: string;
  createdAt?: number;
};

function money(value?: number) {
  return `৳${new Intl.NumberFormat("en-BD").format(Number(value || 0))}`;
}

export default function ProfilePage() {
  const router = useRouter();

  const [uid, setUid] = useState("");
  const [profile, setProfile] = useState<UserProfile>({});
  const [orders, setOrders] = useState<Order[]>([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");

  useEffect(() => {
    setWishlistCount(getWishlistItems().length);

    const updateWishlist = () => setWishlistCount(getWishlistItems().length);
    window.addEventListener("wishlistUpdated", updateWishlist);
    window.addEventListener("storage", updateWishlist);

    return () => {
      window.removeEventListener("wishlistUpdated", updateWishlist);
      window.removeEventListener("storage", updateWishlist);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      setUid(user.uid);

      const userRef = ref(database, `users/${user.uid}`);

      const unsubProfile = onValue(userRef, async (snapshot) => {
        const data = snapshot.val();

        if (!data) {
          const initialProfile: UserProfile = {
            uid: user.uid,
            name: user.displayName || "ZAYY User",
            email: user.email || "",
            phone: "",
            address: "",
            city: "",
            area: "",
            photoURL: user.photoURL || "",
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };

          await set(userRef, initialProfile);
          setProfile(initialProfile);
          setName(initialProfile.name || "");
        } else {
          setProfile(data);
          setName(data.name || "");
          setPhone(data.phone || "");
          setAddress(data.address || "");
          setCity(data.city || "");
          setArea(data.area || "");
        }

        setLoading(false);
      });

      const unsubOrders = onValue(ref(database, "orders"), (snapshot) => {
        const data = snapshot.val();

        if (!data) {
          setOrders([]);
          return;
        }

        const loaded = Object.entries(data)
          .map(([id, value]: any) => ({ id, ...value }))
          .filter((order: Order) => {
            const emailMatch =
              order.customer?.email &&
              user.email &&
              order.customer.email.toLowerCase() === user.email.toLowerCase();

            const phoneMatch =
              phone &&
              order.shippingAddress?.phone &&
              order.shippingAddress.phone === phone;

            return emailMatch || phoneMatch;
          })
          .sort((a: Order, b: Order) => (b.createdAt || 0) - (a.createdAt || 0));

        setOrders(loaded);
      });

      return () => {
        unsubProfile();
        unsubOrders();
      };
    });

    return () => unsubscribe();
  }, [router, phone]);

  const totalSpent = useMemo(() => {
    return orders
      .filter((order) => order.status !== "cancelled")
      .reduce((sum, order) => sum + Number(order.total || 0), 0);
  }, [orders]);

  const getMemberLevel = (amount: number) => {
    if (amount >= 50000) return "Premium Member";
    if (amount >= 20000) return "Diamond Member";
    if (amount >= 10000) return "Gold Member";
    if (amount >= 5000) return "Bronze Member";
    return "General Member";
  };

  const handleSave = async () => {
    if (!uid) return;

    const updatedProfile = {
      uid,
      name,
      email: profile.email || auth.currentUser?.email || "",
      phone,
      address,
      city,
      area,
      photoURL: profile.photoURL || "",
      updatedAt: Date.now(),
      createdAt: profile.createdAt || Date.now(),
    };

    await update(ref(database, `users/${uid}`), updatedProfile);

    if (auth.currentUser) {
      await updateProfile(auth.currentUser, {
        displayName: name,
      });
    }

    setEditing(false);
    alert("Profile updated successfully");
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  if (loading) {
    return (
      <main className="relative min-h-screen overflow-hidden">
        <Navbar />
        <div className="pt-[180px] px-4">
          <div className="glass glass-premium mx-auto max-w-[700px] rounded-[34px] p-10 text-center">
            Loading profile...
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div
        className="fixed inset-0 -z-20 bg-cover bg-center"
        style={{ backgroundImage: "url('/nature-bg.png')" }}
      />

      <div className="fixed inset-0 -z-10 bg-[#f5f1e8]/70 backdrop-blur-[2px]" />
      <div className="page-glow" />

      <Navbar />

      <div className="pt-[170px] pb-12 px-4 sm:px-8 lg:px-14">
        <div className="max-w-[1820px] mx-auto">
          <section className="glass glass-premium rounded-[40px] p-8 lg:p-12">
            <div className="flex flex-col lg:flex-row gap-10">
              <div className="lg:w-[390px]">
                <div className="glass-soft rounded-[34px] p-8 text-center">
                  <div className="mx-auto h-28 w-28 rounded-full bg-[#31571f] flex items-center justify-center text-white text-4xl font-bold shadow-[0_24px_70px_rgba(49,87,31,0.25)]">
                    {(profile.name || profile.email || "Z").slice(0, 1).toUpperCase()}
                  </div>

                  <h2 className="mt-5 text-3xl font-bold text-black">
                    {profile.name || "ZAYY User"}
                  </h2>

                  <p className="text-gray-600 mt-2">
                    {getMemberLevel(totalSpent)}
                  </p>

                  <button
                    onClick={() => setEditing(!editing)}
                    className="mt-6 bg-[#31571f] text-white px-6 py-3 rounded-full font-bold"
                  >
                    {editing ? "Cancel Edit" : "Edit Profile"}
                  </button>

                  <button
                    onClick={handleLogout}
                    className="mt-3 glass-soft w-full rounded-full px-6 py-3 font-bold text-red-500 flex items-center justify-center gap-2"
                  >
                    <LogOut size={18} />
                    Logout
                  </button>
                </div>
              </div>

              <div className="flex-1 space-y-8">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="glass-soft rounded-[30px] p-7">
                    <div className="flex items-center gap-3 mb-5">
                      <User className="text-[#31571f]" />
                      <h3 className="font-bold text-xl">Account Info</h3>
                    </div>

                    {editing ? (
                      <div className="space-y-4">
                        <input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Full Name"
                          className="w-full rounded-2xl bg-white/45 px-5 py-4 outline-none"
                        />

                        <input
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="Phone Number"
                          className="w-full rounded-2xl bg-white/45 px-5 py-4 outline-none"
                        />

                        <button
                          onClick={handleSave}
                          className="flex items-center gap-2 rounded-full bg-[#31571f] px-6 py-3 font-bold text-white"
                        >
                          <Save size={18} />
                          Save Profile
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4 text-gray-700">
                        <p className="flex items-center gap-2">
                          <User size={18} className="text-[#31571f]" />
                          {profile.name || "No name"}
                        </p>

                        <p className="flex items-center gap-2">
                          <Mail size={18} className="text-[#31571f]" />
                          {profile.email || "No email"}
                        </p>

                        <p className="flex items-center gap-2">
                          <Phone size={18} className="text-[#31571f]" />
                          {profile.phone || "No phone added"}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="glass-soft rounded-[30px] p-7">
                    <div className="flex items-center gap-3 mb-5">
                      <MapPin className="text-[#31571f]" />
                      <h3 className="font-bold text-xl">Shipping Address</h3>
                    </div>

                    {editing ? (
                      <div className="space-y-4">
                        <input
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="Full Address"
                          className="w-full rounded-2xl bg-white/45 px-5 py-4 outline-none"
                        />

                        <div className="grid grid-cols-2 gap-3">
                          <input
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder="City"
                            className="rounded-2xl bg-white/45 px-5 py-4 outline-none"
                          />

                          <input
                            value={area}
                            onChange={(e) => setArea(e.target.value)}
                            placeholder="Area"
                            className="rounded-2xl bg-white/45 px-5 py-4 outline-none"
                          />
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-700 leading-7">
                        {profile.address
                          ? `${profile.address}, ${profile.area}, ${profile.city}`
                          : "No address added yet."}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="glass-soft rounded-[30px] p-7 text-center">
                    <ShoppingBag className="mx-auto text-[#31571f]" size={34} />
                    <h3 className="mt-4 text-3xl font-bold">{orders.length}</h3>
                    <p className="text-gray-600">Orders</p>
                  </div>

                  <div className="glass-soft rounded-[30px] p-7 text-center">
                    <Heart className="mx-auto text-[#31571f]" size={34} />
                    <h3 className="mt-4 text-3xl font-bold">{wishlistCount}</h3>
                    <p className="text-gray-600">Wishlist</p>
                  </div>

                  <div className="glass-soft rounded-[30px] p-7 text-center">
                    <Settings className="mx-auto text-[#31571f]" size={34} />
                    <h3 className="mt-4 text-3xl font-bold">{money(totalSpent)}</h3>
                    <p className="text-gray-600">Total Spent</p>
                  </div>
                </div>

                <div className="glass-soft rounded-[30px] p-8">
                  <div className="mb-6 flex flex-wrap gap-3">
                  <Link
                    href="/profile/orders"
                    className="rounded-full bg-[#31571f] px-6 py-3 font-bold text-white"
                  >
                    View All Orders
                  </Link>

                  <Link
                    href="/profile/reviews"
                    className="rounded-full bg-white/45 px-6 py-3 font-bold text-[#31571f]"
                  >
                    Write Reviews
                  </Link>
                </div>
                  <h3 className="text-2xl font-bold mb-6">
                    Recent Orders
                  </h3>

                  {orders.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      No orders found.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.slice(0, 5).map((order) => (
                        <div
                          key={order.id}
                          className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white/35 p-5"
                        >
                          <div>
                            <p className="font-bold text-[#142012]">
                              Order #{order.id.slice(0, 8)}
                            </p>
                            <p className="text-sm text-gray-600">
                              {order.createdAt
                                ? new Date(order.createdAt).toLocaleDateString()
                                : "N/A"}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="font-bold text-[#31571f]">
                              {money(order.total)}
                            </p>
                            <p className="text-sm capitalize text-gray-600">
                              {order.status || "pending"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <Footer />
    </main>
  );
}