"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithPopup,
  signOut,
  updateProfile,
  type User as FirebaseUser,
} from "firebase/auth";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  X,
} from "lucide-react";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { auth, googleProvider } from "@/firebase/config";
import { isAdminUser } from "@/lib/admin";
import { acceptAdminInvite } from "@/lib/adminInvite";
import { getCartCount } from "@/lib/cart";
import { getWishlistCount } from "@/lib/wishlist";

type FirebaseAuthError = {
  code?: string;
  message?: string;
};

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [error, setError] = useState("");
  const [accountAlreadyExists, setAccountAlreadyExists] =
    useState(false);

  const [loading, setLoading] = useState(false);

  const [verificationSent, setVerificationSent] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  const clearError = () => {
    setError("");
    setAccountAlreadyExists(false);
  };

  /*
   * Google account দিয়ে signup/login হলে user সরাসরি
   * shop অথবা admin dashboard-এ যাবে।
   */
  const goAfterGoogleSignup = async (user: FirebaseUser) => {
    try {
      await acceptAdminInvite(user);

      const admin = await isAdminUser(user.uid);

      router.push(admin ? "/admin" : "/shop");
    } catch {
      router.push("/shop");
    }
  };

  const handleSignup = async () => {
    clearError();

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || !cleanEmail || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (cleanName.length < 2) {
      setError("Please enter your full name.");
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

      // Firebase account তৈরি
      const result = await createUserWithEmailAndPassword(
        auth,
        cleanEmail,
        password
      );

      // Firebase profile-এ নাম save
      await updateProfile(result.user, {
        displayName: cleanName,
      });

      // Verification email পাঠানো
      await sendEmailVerification(result.user);

      setRegisteredEmail(result.user.email || cleanEmail);

      // Signup শেষে user logout করা
      await signOut(auth);

      setVerificationSent(true);
    } catch (err: unknown) {
      const firebaseError = err as FirebaseAuthError;

      /*
       * Expected Firebase errors console.error করা হচ্ছে না।
       * তাই development mode-এ কালো error overlay আসবে না।
       */
      if (firebaseError.code === "auth/email-already-in-use") {
        setAccountAlreadyExists(true);
        setError(
          "This email is already registered. Please login or reset your password."
        );
      } else if (firebaseError.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else if (firebaseError.code === "auth/weak-password") {
        setError("Password must be at least 6 characters.");
      } else if (
        firebaseError.code === "auth/operation-not-allowed"
      ) {
        setError(
          "Email and password signup is currently disabled. Please contact support."
        );
      } else if (
        firebaseError.code === "auth/network-request-failed"
      ) {
        setError(
          "Network error. Please check your internet connection."
        );
      } else if (firebaseError.code === "auth/too-many-requests") {
        setError(
          "Too many attempts. Please wait a while and try again."
        );
      } else {
        // শুধু অজানা error console-এ log হবে
        console.warn("Unexpected signup error:", firebaseError);
        setError("Signup failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    clearError();

    try {
      setLoading(true);

      const result = await signInWithPopup(auth, googleProvider);

      await goAfterGoogleSignup(result.user);
    } catch (err: unknown) {
      const firebaseError = err as FirebaseAuthError;

      if (firebaseError.code === "auth/popup-closed-by-user") {
        setError("Google signup was cancelled.");
      } else if (firebaseError.code === "auth/popup-blocked") {
        setError(
          "Google popup was blocked. Please allow popups and try again."
        );
      } else if (
        firebaseError.code ===
        "auth/account-exists-with-different-credential"
      ) {
        setAccountAlreadyExists(true);
        setError(
          "An account already exists with this email using another login method."
        );
      } else if (
        firebaseError.code === "auth/network-request-failed"
      ) {
        setError(
          "Network error. Please check your internet connection."
        );
      } else {
        console.warn(
          "Unexpected Google signup error:",
          firebaseError
        );
        setError("Google signup failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!loading) {
      void handleSignup();
    }
  };

  const handleUseAnotherEmail = () => {
    setVerificationSent(false);
    setRegisteredEmail("");

    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");

    setShowPass(false);
    setShowConfirmPass(false);

    clearError();
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
              {verificationSent ? (
                <div className="py-10 text-center sm:py-16">
                  <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-[#e9f6ed] text-[#0b3d2e]">
                    <Mail size={58} />
                  </div>

                  <h1 className="mt-9 text-3xl font-black text-[#0b3d2e] sm:text-4xl">
                    Verify Your Email
                  </h1>

                  <p className="mx-auto mt-4 max-w-[500px] text-base leading-7 text-[#4f5f49] sm:text-lg">
                    We sent a verification link to
                  </p>

                  <p className="mt-2 break-all font-black text-[#0b3d2e]">
                    {registeredEmail}
                  </p>

                  <div className="mt-7 rounded-[6px] border border-[#0b3d2e]/10 bg-[#f5f1e8] p-5 text-left">
                    <p className="flex items-start gap-3 text-sm font-bold leading-6 text-[#0b3d2e]">
                      <CheckCircle2
                        size={19}
                        className="mt-0.5 shrink-0"
                      />
                      Open your email inbox and click the verification
                      link.
                    </p>

                    <p className="mt-3 flex items-start gap-3 text-sm font-bold leading-6 text-[#0b3d2e]">
                      <CheckCircle2
                        size={19}
                        className="mt-0.5 shrink-0"
                      />
                      After verifying your email, return to ZAYY Care
                      and login.
                    </p>

                    <p className="mt-3 flex items-start gap-3 text-sm font-bold leading-6 text-[#0b3d2e]">
                      <CheckCircle2
                        size={19}
                        className="mt-0.5 shrink-0"
                      />
                      Check your spam or junk folder if you cannot find
                      the email.
                    </p>
                  </div>

                  <Link
                    href={`/login?email=${encodeURIComponent(
                      registeredEmail
                    )}`}
                    className="mt-8 flex h-14 items-center justify-center rounded-[6px] bg-[#0b3d2e] text-sm font-black uppercase tracking-wide text-white transition hover:bg-[#062a18]"
                  >
                    Go To Login
                  </Link>

                  <button
                    type="button"
                    onClick={handleUseAnotherEmail}
                    className="mt-4 flex h-14 w-full items-center justify-center rounded-[6px] border border-[#0b3d2e]/30 text-sm font-black uppercase tracking-wide text-[#0b3d2e] transition hover:bg-[#f5f1e8]"
                  >
                    Use Another Email
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-10 text-center">
                    <h1 className="dream-font text-[42px] leading-none text-[#0b3d2e] sm:text-[54px]">
                      Create Account
                    </h1>

                    <p className="mt-4 text-[#4f5f49]">
                      Join ZAYY Care and start your premium skincare
                      journey.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit}>
                    <div className="space-y-5">
                      <label className="block">
                        <span className="mb-2 block text-sm font-bold text-[#102015]">
                          Full Name
                        </span>

                        <div className="flex h-14 items-center gap-3 rounded-[6px] border border-[#0b3d2e]/15 bg-[#fafaf7] px-4 transition focus-within:border-[#0b3d2e]/50">
                          <User
                            size={20}
                            className="shrink-0 text-[#7c8777]"
                          />

                          <input
                            type="text"
                            placeholder="Enter your full name"
                            value={name}
                            onChange={(event) => {
                              setName(event.target.value);
                              clearError();
                            }}
                            autoComplete="name"
                            disabled={loading}
                            className="w-full bg-transparent text-[#102015] outline-none placeholder:text-[#7c8777] disabled:cursor-not-allowed"
                          />

                          {name && !loading && (
                            <button
                              type="button"
                              onClick={() => {
                                setName("");
                                clearError();
                              }}
                              aria-label="Clear full name"
                            >
                              <X
                                size={18}
                                className="text-[#7c8777]"
                              />
                            </button>
                          )}
                        </div>
                      </label>

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
                            placeholder="Enter your email"
                            value={email}
                            onChange={(event) => {
                              setEmail(event.target.value);
                              clearError();
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
                                clearError();
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

                      <label className="block">
                        <span className="mb-2 block text-sm font-bold text-[#102015]">
                          Password
                        </span>

                        <div className="flex h-14 items-center gap-3 rounded-[6px] border border-[#0b3d2e]/15 bg-[#fafaf7] px-4 transition focus-within:border-[#0b3d2e]/50">
                          <Lock
                            size={20}
                            className="shrink-0 text-[#7c8777]"
                          />

                          <input
                            type={showPass ? "text" : "password"}
                            placeholder="Enter your password"
                            value={password}
                            onChange={(event) => {
                              setPassword(event.target.value);
                              clearError();
                            }}
                            autoComplete="new-password"
                            disabled={loading}
                            className="w-full bg-transparent text-[#102015] outline-none placeholder:text-[#7c8777] disabled:cursor-not-allowed"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              setShowPass((current) => !current)
                            }
                            aria-label={
                              showPass
                                ? "Hide password"
                                : "Show password"
                            }
                            disabled={loading}
                          >
                            {showPass ? (
                              <EyeOff
                                size={19}
                                className="text-[#7c8777]"
                              />
                            ) : (
                              <Eye
                                size={19}
                                className="text-[#7c8777]"
                              />
                            )}
                          </button>
                        </div>
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-sm font-bold text-[#102015]">
                          Confirm Password
                        </span>

                        <div className="flex h-14 items-center gap-3 rounded-[6px] border border-[#0b3d2e]/15 bg-[#fafaf7] px-4 transition focus-within:border-[#0b3d2e]/50">
                          <Lock
                            size={20}
                            className="shrink-0 text-[#7c8777]"
                          />

                          <input
                            type={
                              showConfirmPass ? "text" : "password"
                            }
                            placeholder="Confirm your password"
                            value={confirmPassword}
                            onChange={(event) => {
                              setConfirmPassword(event.target.value);
                              clearError();
                            }}
                            autoComplete="new-password"
                            disabled={loading}
                            className="w-full bg-transparent text-[#102015] outline-none placeholder:text-[#7c8777] disabled:cursor-not-allowed"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              setShowConfirmPass(
                                (current) => !current
                              )
                            }
                            aria-label={
                              showConfirmPass
                                ? "Hide confirm password"
                                : "Show confirm password"
                            }
                            disabled={loading}
                          >
                            {showConfirmPass ? (
                              <EyeOff
                                size={19}
                                className="text-[#7c8777]"
                              />
                            ) : (
                              <Eye
                                size={19}
                                className="text-[#7c8777]"
                              />
                            )}
                          </button>
                        </div>
                      </label>
                    </div>

                    {error && (
                      <div
                        role="alert"
                        className="mt-4 rounded-[6px] border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700"
                      >
                        <div className="flex items-start gap-3">
                          <AlertCircle
                            size={19}
                            className="mt-0.5 shrink-0"
                          />

                          <div className="flex-1">
                            <p className="font-bold leading-6">
                              {error}
                            </p>

                            {accountAlreadyExists && (
                              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                <Link
                                  href={`/login?email=${encodeURIComponent(
                                    email.trim()
                                  )}`}
                                  className="flex h-11 items-center justify-center rounded-[6px] bg-[#0b3d2e] px-4 text-xs font-black uppercase tracking-wide text-white transition hover:bg-[#062a18]"
                                >
                                  Login
                                </Link>

                                <Link
                                  href={`/forgot-password?email=${encodeURIComponent(
                                    email.trim()
                                  )}`}
                                  className="flex h-11 items-center justify-center rounded-[6px] border border-[#0b3d2e]/25 bg-white px-4 text-xs font-black uppercase tracking-wide text-[#0b3d2e] transition hover:bg-[#f5f1e8]"
                                >
                                  Forgot Password
                                </Link>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="mt-6 space-y-3 rounded-[6px] bg-[#f5f1e8] p-4 text-sm font-bold text-[#0b3d2e]">
                      <p className="flex items-center gap-2">
                        <CheckCircle2
                          size={17}
                          className="shrink-0"
                        />
                        Get exclusive offers &amp; discounts
                      </p>

                      <p className="flex items-center gap-2">
                        <CheckCircle2
                          size={17}
                          className="shrink-0"
                        />
                        Track your orders easily
                      </p>

                      <p className="flex items-center gap-2">
                        <CheckCircle2
                          size={17}
                          className="shrink-0"
                        />
                        Personalized skincare recommendations
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="mt-7 flex h-14 w-full items-center justify-center rounded-[6px] bg-[#0b3d2e] text-sm font-black uppercase tracking-wide text-white transition hover:bg-[#062a18] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading
                        ? "Creating Account..."
                        : "Create Account"}
                    </button>
                  </form>

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
                      onClick={() => void handleGoogleSignup()}
                      disabled={loading}
                      className="flex h-12 items-center justify-center rounded-[6px] border border-[#0b3d2e]/15 bg-white font-bold text-[#102015] transition hover:bg-[#f5f1e8] disabled:cursor-not-allowed disabled:opacity-60"
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
                    <Link
                      href="/login"
                      className="font-black text-[#0b3d2e] hover:underline"
                    >
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