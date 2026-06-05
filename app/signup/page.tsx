"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";

import { auth, googleProvider } from "@/firebase/config";

import {
  Mail,
  Lock,
  Eye,
  User,
  ArrowRight,
  ShieldCheck,
  Truck,
  RefreshCcw,
  LockKeyhole,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

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

  const handleSignup = async () => {
    setError("");

    if (!name || !email || !password || !confirmPassword) {
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

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      await updateProfile(userCredential.user, {
        displayName: name,
      });

      router.push("/shop");
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered. Please login.");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email address.");
      } else if (err.code === "auth/weak-password") {
        setError("Password must be at least 6 characters.");
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

      await signInWithPopup(auth, googleProvider);

      router.push("/shop");
    } catch {
      setError("Google signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden flex items-center justify-center px-4 py-10">
      <div
        className="fixed inset-0 -z-20 bg-cover bg-center"
        style={{ backgroundImage: "url('/nature-bg.png')" }}
      />

      <div className="fixed inset-0 -z-10 bg-[#f5f1e8]/70 backdrop-blur-[3px]" />

      <section className="glass rounded-[46px] max-w-[720px] w-full p-6 sm:p-10 text-center">
        <Image
          src="/logo.png"
          alt="ZAYY Care"
          width={280}
          height={150}
          priority
          className="mx-auto mb-8"
        />

        <div className="glass-soft rounded-[40px] p-7 sm:p-10">
          <h1 className="dream-font text-[48px] sm:text-[60px] text-[#1f2a1f] leading-none">
            Create Account
          </h1>

          <div className="flex items-center justify-center gap-3 mt-4 mb-6 text-[#556B2F]">
            <span className="h-px w-20 bg-[#556B2F]/40" />
            <Sparkles size={18} />
            <span className="h-px w-20 bg-[#556B2F]/40" />
          </div>

          <p className="text-gray-600 mb-8">
            Join ZAYY Care and start your premium skincare journey.
          </p>

          <div className="space-y-4">
            <div className="glass rounded-2xl px-5 py-4 flex items-center gap-3">
              <User size={20} className="text-[#556B2F]" />
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-transparent outline-none flex-1 text-[#1f2a1f]"
              />
            </div>

            <div className="glass rounded-2xl px-5 py-4 flex items-center gap-3">
              <Mail size={20} className="text-[#556B2F]" />
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-transparent outline-none flex-1 text-[#1f2a1f]"
              />
            </div>

            <div className="glass rounded-2xl px-5 py-4 flex items-center gap-3">
              <Lock size={20} className="text-[#556B2F]" />
              <input
                type={showPass ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-transparent outline-none flex-1 text-[#1f2a1f]"
              />
              <button type="button" onClick={() => setShowPass(!showPass)}>
                <Eye size={18} />
              </button>
            </div>

            <div className="glass rounded-2xl px-5 py-4 flex items-center gap-3">
              <Lock size={20} className="text-[#556B2F]" />
              <input
                type={showConfirmPass ? "text" : "password"}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-transparent outline-none flex-1 text-[#1f2a1f]"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPass(!showConfirmPass)}
              >
                <Eye size={18} />
              </button>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm mt-4">{error}</p>}

          <div className="space-y-3 text-left mt-6 text-sm">
            {[
              "Get exclusive offers & discounts",
              "Track your orders easily",
              "Personalized skincare recommendations",
            ].map((item) => (
              <p key={item} className="flex items-center gap-2 text-[#556B2F]">
                <CheckCircle2 size={18} />
                {item}
              </p>
            ))}
          </div>

          <button
            onClick={handleSignup}
            disabled={loading}
            className="mt-8 w-full bg-[#556B2F] text-white rounded-full py-4 font-semibold premium-hover flex items-center justify-center gap-3 shadow-[0_20px_45px_rgba(85,107,47,0.25)] disabled:opacity-60"
          >
            {loading ? "Creating..." : "Create Account"}
            <ArrowRight size={20} />
          </button>

          <div className="flex items-center gap-4 my-7">
            <span className="h-px flex-1 bg-black/10" />
            <span className="text-gray-600 text-sm">or sign up with</span>
            <span className="h-px flex-1 bg-black/10" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={handleGoogleSignup}
              disabled={loading}
              className="glass rounded-2xl py-4 font-medium premium-hover disabled:opacity-60"
            >
              Google
            </button>

            <button
              type="button"
              disabled
              className="glass rounded-2xl py-4 font-medium opacity-50 cursor-not-allowed"
            >
              Facebook
            </button>
          </div>

          <p className="mt-7 text-gray-600">
            Already have an account?{" "}
            <Link href="/login" className="text-[#556B2F] font-semibold">
              Login →
            </Link>
          </p>
        </div>

        <div className="glass rounded-[28px] mt-8 p-4 grid sm:grid-cols-2 gap-4 text-sm">
          <p className="flex items-center justify-center gap-2">
            <ShieldCheck className="text-[#556B2F]" /> 100% Authentic
          </p>

          <p className="flex items-center justify-center gap-2">
            <Truck className="text-[#556B2F]" /> Free Delivery ৳1500+
          </p>

          <p className="flex items-center justify-center gap-2">
            <RefreshCcw className="text-[#556B2F]" /> Easy Return
          </p>

          <p className="flex items-center justify-center gap-2">
            <LockKeyhole className="text-[#556B2F]" /> Secure Payment
          </p>
        </div>
      </section>
    </main>
  );
}