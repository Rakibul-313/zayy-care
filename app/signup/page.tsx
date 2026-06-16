"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  type User as FirebaseUser,
} from "firebase/auth";
import { CheckCircle2, Eye, Lock, Mail, User, X } from "lucide-react";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { auth, googleProvider } from "@/firebase/config";
import { isAdminUser } from "@/lib/admin";
import { acceptAdminInvite } from "@/lib/adminInvite";
import { getCartCount } from "@/lib/cart";
import { getWishlistCount } from "@/lib/wishlist";

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const goAfterSignup = async (user: FirebaseUser) => {
    try {
      await acceptAdminInvite(user);
      const admin = await isAdminUser(user.uid);

      setSuccess(true);

      setTimeout(() => {
        router.push(admin ? "/admin" : "/shop");
      }, 900);
    } catch (error) {
      console.error(error);
      setSuccess(true);

      setTimeout(() => {
        router.push("/shop");
      }, 900);
    }
  };

  const handleSignup = async () => {
    setError("");

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setError("Please fill all fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const result = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      await updateProfile(result.user, {
        displayName: name.trim(),
      });

      await goAfterSignup(result.user);
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered. Please login.");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email address.");
      } else if (err.code === "auth/weak-password") {
        setError("Password must be at least 6 characters.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many attempts. Please try again later.");
      } else {
        setError("Signup failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError("");

    try {
      setLoading(true);

      const result = await signInWithPopup(auth, googleProvider);

      await goAfterSignup(result.user);
    } catch (error) {
      console.error(error);
      setError("Google signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar cartCount={getCartCount()} wishlistCount={getWishlistCount()} />

      <main className="min-h-screen bg-[#fafaf7]">
        <section className="flex min-h-[calc(100vh-120px)] items-center justify-center px-4 pt-[115px] pb-12 sm:px-8 lg:px-14 lg:pt-[130px]">
          <div className="w-full max-w-[680px]">
            <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-6 shadow-[0_12px_34px_rgba(11,61,46,0.08)] sm:p-10">
              {success ? (
                <div className="py-16 text-center">
                  <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-[#e9f6ed] text-[#0b3d2e]">
                    <CheckCircle2 size={64} />
                  </div>

                  <h1 className="mt-9 text-4xl font-black text-[#0b3d2e]">
                    Account Created!
                  </h1>

                  <p className="mt-4 text-lg text-[#4f5f49]">
                    Welcome to Zayy Care 💚
                  </p>

                  <Link
                    href="/shop"
                    className="mt-10 flex h-14 items-center justify-center rounded-[6px] bg-[#0b3d2e] text-sm font-black uppercase tracking-wide text-white"
                  >
                    Continue Shopping
                  </Link>

                  <Link
                    href="/profile"
                    className="mt-4 flex h-14 items-center justify-center rounded-[6px] border border-[#0b3d2e]/30 text-sm font-black uppercase tracking-wide text-[#0b3d2e]"
                  >
                    Go To My Account
                  </Link>
                </div>
              ) : (
                <>
                  <div className="mb-10 text-center">
                    <h1 className="dream-font text-[42px] leading-none text-[#0b3d2e] sm:text-[54px]">
                      Create Account
                    </h1>

                    <p className="mt-4 text-[#4f5f49]">
                      Join ZAYY Care and start your premium skincare journey.
                    </p>
                  </div>

                  <div className="space-y-5">
                    <label className="block">
                      <span className="mb-2 block text-sm font-bold text-[#102015]">
                        Full Name
                      </span>

                      <div className="flex h-14 items-center gap-3 rounded-[6px] border border-[#0b3d2e]/15 bg-[#fafaf7] px-4">
                        <User size={20} className="text-[#7c8777]" />

                        <input
                          type="text"
                          placeholder="Enter your full name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full bg-transparent text-[#102015] outline-none placeholder:text-[#7c8777]"
                        />

                        {name && (
                          <button type="button" onClick={() => setName("")}>
                            <X size={18} className="text-[#7c8777]" />
                          </button>
                        )}
                      </div>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-bold text-[#102015]">
                        Email Address
                      </span>

                      <div className="flex h-14 items-center gap-3 rounded-[6px] border border-[#0b3d2e]/15 bg-[#fafaf7] px-4">
                        <Mail size={20} className="text-[#7c8777]" />

                        <input
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-transparent text-[#102015] outline-none placeholder:text-[#7c8777]"
                        />

                        {email && (
                          <button type="button" onClick={() => setEmail("")}>
                            <X size={18} className="text-[#7c8777]" />
                          </button>
                        )}
                      </div>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-bold text-[#102015]">
                        Password
                      </span>

                      <div className="flex h-14 items-center gap-3 rounded-[6px] border border-[#0b3d2e]/15 bg-[#fafaf7] px-4">
                        <Lock size={20} className="text-[#7c8777]" />

                        <input
                          type={showPass ? "text" : "password"}
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-transparent text-[#102015] outline-none placeholder:text-[#7c8777]"
                        />

                        <button
                          type="button"
                          onClick={() => setShowPass(!showPass)}
                        >
                          <Eye size={19} className="text-[#7c8777]" />
                        </button>
                      </div>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-bold text-[#102015]">
                        Confirm Password
                      </span>

                      <div className="flex h-14 items-center gap-3 rounded-[6px] border border-[#0b3d2e]/15 bg-[#fafaf7] px-4">
                        <Lock size={20} className="text-[#7c8777]" />

                        <input
                          type={showConfirmPass ? "text" : "password"}
                          placeholder="Confirm your password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full bg-transparent text-[#102015] outline-none placeholder:text-[#7c8777]"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPass(!showConfirmPass)
                          }
                        >
                          <Eye size={19} className="text-[#7c8777]" />
                        </button>
                      </div>
                    </label>
                  </div>

                  {error && (
                    <p className="mt-4 rounded-[6px] bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
                      {error}
                    </p>
                  )}

                  <div className="mt-6 space-y-3 rounded-[6px] bg-[#f5f1e8] p-4 text-sm font-bold text-[#0b3d2e]">
                    <p className="flex items-center gap-2">
                      <CheckCircle2 size={17} />
                      Get exclusive offers & discounts
                    </p>

                    <p className="flex items-center gap-2">
                      <CheckCircle2 size={17} />
                      Track your orders easily
                    </p>

                    <p className="flex items-center gap-2">
                      <CheckCircle2 size={17} />
                      Personalized skincare recommendations
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleSignup}
                    disabled={loading}
                    className="mt-7 flex h-14 w-full items-center justify-center rounded-[6px] bg-[#0b3d2e] text-sm font-black uppercase tracking-wide text-white disabled:opacity-60"
                  >
                    {loading ? "Creating..." : "Create Account"}
                  </button>

                  <div className="my-7 flex items-center gap-4">
                    <span className="h-px flex-1 bg-[#0b3d2e]/10" />

                    <span className="text-sm text-[#4f5f49]">
                      or continue with
                    </span>

                    <span className="h-px flex-1 bg-[#0b3d2e]/10" />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <button
                      type="button"
                      onClick={handleGoogleSignup}
                      disabled={loading}
                      className="flex h-12 items-center justify-center rounded-[6px] border border-[#0b3d2e]/15 bg-white font-bold text-[#102015] disabled:opacity-60"
                    >
                      Google
                    </button>

                    <button
                      type="button"
                      disabled
                      className="flex h-12 items-center justify-center rounded-[6px] border border-[#0b3d2e]/15 bg-white font-bold text-[#102015] opacity-60"
                    >
                      Apple
                    </button>

                    <button
                      type="button"
                      disabled
                      className="flex h-12 items-center justify-center rounded-[6px] border border-[#0b3d2e]/15 bg-white font-bold text-[#102015] opacity-60"
                    >
                      Facebook
                    </button>
                  </div>

                  <p className="mt-8 text-center text-[#4f5f49]">
                    Already have an account?{" "}
                    <Link href="/login" className="font-black text-[#0b3d2e]">
                      Login
                    </Link>
                  </p>
                </>
              )}
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
}