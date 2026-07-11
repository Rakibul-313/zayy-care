"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import {
  ArrowLeft,
  CheckCircle2,
  Mail,
  ShieldCheck,
  X,
} from "lucide-react";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { auth } from "@/firebase/config";
import { getCartCount } from "@/lib/cart";
import { getWishlistCount } from "@/lib/wishlist";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sentEmail, setSentEmail] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleResetPassword = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setLoading(true);

      await sendPasswordResetEmail(auth, cleanEmail);

      setSentEmail(cleanEmail);
      setEmailSent(true);
    } catch (err: unknown) {
      console.error("Password reset error:", err);

      const firebaseError = err as {
        code?: string;
      };

      if (firebaseError.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else if (firebaseError.code === "auth/user-not-found") {
        setError("No account was found with this email address.");
      } else if (firebaseError.code === "auth/user-disabled") {
        setError("This account has been disabled.");
      } else if (
        firebaseError.code === "auth/network-request-failed"
      ) {
        setError(
          "Network error. Please check your internet connection."
        );
      } else if (firebaseError.code === "auth/too-many-requests") {
        setError(
          "Too many requests. Please wait and try again later."
        );
      } else if (
        firebaseError.code === "auth/operation-not-allowed"
      ) {
        setError(
          "Password reset is currently unavailable. Please contact support."
        );
      } else {
        setError(
          "Password reset email could not be sent. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTryAnotherEmail = () => {
    setEmail("");
    setSentEmail("");
    setError("");
    setEmailSent(false);
  };

  return (
    <>
      <Navbar
        cartCount={getCartCount()}
        wishlistCount={getWishlistCount()}
      />

      <main className="min-h-screen bg-[#fafaf7]">
        <section className="flex min-h-[calc(100vh-120px)] items-center justify-center px-4 pb-12 pt-[115px] sm:px-8 lg:px-14 lg:pt-[130px]">
          <div className="w-full max-w-[680px]">
            <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-6 shadow-[0_12px_34px_rgba(11,61,46,0.08)] sm:p-10">
              {emailSent ? (
                <div className="py-10 text-center sm:py-16">
                  <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-[#e9f6ed] text-[#0b3d2e]">
                    <CheckCircle2 size={62} />
                  </div>

                  <h1 className="mt-9 text-3xl font-black text-[#0b3d2e] sm:text-4xl">
                    Check Your Email
                  </h1>

                  <p className="mx-auto mt-4 max-w-[500px] text-base leading-7 text-[#4f5f49] sm:text-lg">
                    We sent a password reset link to
                  </p>

                  <p className="mt-2 break-all font-black text-[#0b3d2e]">
                    {sentEmail}
                  </p>

                  <div className="mt-7 rounded-[6px] border border-[#0b3d2e]/10 bg-[#f5f1e8] p-5 text-left">
                    <p className="flex items-start gap-3 text-sm font-bold leading-6 text-[#0b3d2e]">
                      <CheckCircle2
                        size={18}
                        className="mt-1 shrink-0"
                      />
                      Open your email inbox and click the password reset
                      link.
                    </p>

                    <p className="mt-3 flex items-start gap-3 text-sm font-bold leading-6 text-[#0b3d2e]">
                      <CheckCircle2
                        size={18}
                        className="mt-1 shrink-0"
                      />
                      Enter and confirm your new password.
                    </p>

                    <p className="mt-3 flex items-start gap-3 text-sm font-bold leading-6 text-[#0b3d2e]">
                      <CheckCircle2
                        size={18}
                        className="mt-1 shrink-0"
                      />
                      Check your spam or junk folder if you cannot find
                      the email.
                    </p>
                  </div>

                  <Link
                    href="/login"
                    className="mt-8 flex h-14 items-center justify-center rounded-[6px] bg-[#0b3d2e] text-sm font-black uppercase tracking-wide text-white transition hover:bg-[#062a18]"
                  >
                    Back To Login
                  </Link>

                  <button
                    type="button"
                    onClick={handleTryAnotherEmail}
                    className="mt-4 flex h-14 w-full items-center justify-center rounded-[6px] border border-[#0b3d2e]/30 text-sm font-black uppercase tracking-wide text-[#0b3d2e] transition hover:bg-[#f5f1e8]"
                  >
                    Try Another Email
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-10 text-center">
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#e9f6ed] text-[#0b3d2e]">
                      <ShieldCheck size={42} />
                    </div>

                    <h1 className="dream-font text-[42px] leading-none text-[#0b3d2e] sm:text-[54px]">
                      Forgot Password?
                    </h1>

                    <p className="mx-auto mt-4 max-w-[500px] leading-7 text-[#4f5f49]">
                      Enter the email address connected to your ZAYY
                      Care account. We will send you a password reset
                      link.
                    </p>
                  </div>

                  <form onSubmit={handleResetPassword}>
                    <label className="block">
                      <span className="mb-2 block text-sm font-bold text-[#102015]">
                        Email Address
                      </span>

                      <div className="flex h-14 items-center gap-3 rounded-[6px] border border-[#0b3d2e]/15 bg-[#fafaf7] px-4 transition focus-within:border-[#0b3d2e]/50">
                        <Mail
                          size={20}
                          className="shrink-0 text-[#7c8777]"
                        />

                        <input
                          type="email"
                          placeholder="Enter your registered email"
                          value={email}
                          onChange={(event) => {
                            setEmail(event.target.value);
                            setError("");
                          }}
                          autoComplete="email"
                          disabled={loading}
                          className="w-full bg-transparent text-[#102015] outline-none placeholder:text-[#7c8777] disabled:cursor-not-allowed"
                        />

                        {email && !loading && (
                          <button
                            type="button"
                            onClick={() => {
                              setEmail("");
                              setError("");
                            }}
                            aria-label="Clear email address"
                          >
                            <X
                              size={18}
                              className="text-[#7c8777]"
                            />
                          </button>
                        )}
                      </div>
                    </label>

                    {error && (
                      <p
                        role="alert"
                        className="mt-4 rounded-[6px] bg-red-50 px-4 py-3 text-sm font-bold text-red-600"
                      >
                        {error}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="mt-7 flex h-14 w-full items-center justify-center rounded-[6px] bg-[#0b3d2e] text-sm font-black uppercase tracking-wide text-white transition hover:bg-[#062a18] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading
                        ? "Sending Reset Link..."
                        : "Send Reset Link"}
                    </button>
                  </form>

                  <Link
                    href="/login"
                    className="mt-5 flex items-center justify-center gap-2 text-sm font-black text-[#0b3d2e] hover:underline"
                  >
                    <ArrowLeft size={17} />
                    Back To Login
                  </Link>

                  <div className="mt-8 rounded-[6px] bg-[#f5f1e8] p-5">
                    <p className="text-center text-sm font-bold leading-6 text-[#4f5f49]">
                      For your security, ZAYY Care will never ask for
                      your current password through email or message.
                    </p>
                  </div>
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