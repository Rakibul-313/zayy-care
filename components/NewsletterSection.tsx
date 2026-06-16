"use client";

import { useState } from "react";
import { get, push, ref, set } from "firebase/database";
import { database } from "@/firebase/config";
import { Mail, Send } from "lucide-react";

export default function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubscribe = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes("@")) {
      setMessage("Please enter a valid email address.");
      return;
    }

    try {
      setSaving(true);

      const snapshot = await get(ref(database, "subscribers"));
      const data = snapshot.val();

      const exists =
        data &&
        Object.values(data).some(
          (item: any) => item.email?.toLowerCase() === cleanEmail
        );

      if (exists) {
        setMessage("You are already subscribed.");
        return;
      }

      const subscriberRef = push(ref(database, "subscribers"));

      await set(subscriberRef, {
        email: cleanEmail,
        source: "newsletter",
        createdAt: Date.now(),
      });

      setEmail("");
      setMessage("Thanks! You have subscribed successfully.");
    } catch (error) {
      console.log(error);
      setMessage("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="px-4 sm:px-8 lg:px-14">
      <div className="mx-auto max-w-[1820px] rounded-[6px] border border-[#0b3d2e]/10 bg-[#f5f1e8] p-5 shadow-[0_14px_40px_rgba(11,61,46,0.08)] sm:p-7 lg:p-8">
        <div className="grid items-center gap-6 lg:grid-cols-[1fr_.8fr]">
          <div>
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-[6px] bg-[#edf3f0] text-[#0b3d2e]">
              <Mail size={22} />
            </div>

            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#0b3d2e]">
              ZAYY Care Newsletter
            </p>

            <h2 className="dream-font mt-3 text-[34px] leading-none text-[#142012] sm:text-[46px]">
              Get skincare tips & exclusive offers
            </h2>

            <p className="mt-4 max-w-[720px] text-[14px] leading-7 text-[#435041] sm:text-[15px]">
              Join our newsletter for Korean skincare routines, new arrivals,
              special discounts, and glow-focused beauty updates.
            </p>
          </div>

          <form
            onSubmit={handleSubscribe}
            className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-4 shadow-[0_8px_24px_rgba(11,61,46,0.06)] sm:p-5"
          >
            <label className="mb-3 block text-sm font-bold text-[#142012]">
              Email Address
            </label>

            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="min-h-[50px] flex-1 rounded-[6px] border border-[#0b3d2e]/10 bg-[#fafaf7] px-4 text-sm font-medium text-[#142012] outline-none placeholder:text-[#6b7568] focus:border-[#0b3d2e]/30"
              />

              <button
                type="submit"
                disabled={saving}
                className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-[6px] bg-[linear-gradient(90deg,#062a18_0%,#0b3d2e_50%,#062a18_100%)] px-6 text-sm font-black text-white shadow-[0_12px_28px_rgba(11,61,46,0.22)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_38px_rgba(11,61,46,0.3)] disabled:opacity-60"
              >
                <Send size={17} />
                {saving ? "Joining..." : "Join"}
              </button>
            </div>

            {message && (
              <p
                className={`mt-4 text-sm font-semibold ${
                  message.includes("successfully")
                    ? "text-[#0b3d2e]"
                    : "text-red-500"
                }`}
              >
                {message}
              </p>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}