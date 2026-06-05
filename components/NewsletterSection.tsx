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
      <div className="glass glass-premium mx-auto max-w-[1820px] overflow-hidden rounded-[40px] p-8 lg:p-12">
        <div className="grid items-center gap-8 lg:grid-cols-[1fr_.9fr]">
          <div>
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/45 text-[#31571f] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
              <Mail size={26} />
            </div>

            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#556B2F]">
              ZAYY Care Newsletter
            </p>

            <h2 className="dream-font mt-3 text-[44px] leading-none text-[#142012] sm:text-[58px]">
              Get skincare tips & exclusive offers
            </h2>

            <p className="mt-5 max-w-[720px] text-[16px] leading-8 text-[#435041]">
              Join our newsletter for Korean skincare routines, new arrivals,
              special discounts, and glow-focused beauty updates.
            </p>
          </div>

          <form
            onSubmit={handleSubscribe}
            className="glass-soft rounded-[32px] p-5 sm:p-6"
          >
            <label className="mb-3 block font-bold text-[#142012]">
              Email Address
            </label>

            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="min-h-[58px] flex-1 rounded-2xl bg-white/55 px-5 font-medium text-[#142012] outline-none placeholder:text-[#6b7568]"
              />

              <button
                type="submit"
                disabled={saving}
                className="inline-flex min-h-[58px] items-center justify-center gap-2 rounded-2xl bg-[#31571f] px-7 font-bold text-white shadow-[0_18px_40px_rgba(49,87,31,0.25)] transition hover:-translate-y-0.5 disabled:opacity-60"
              >
                <Send size={18} />
                {saving ? "Joining..." : "Join"}
              </button>
            </div>

            {message && (
              <p
                className={`mt-4 text-sm font-semibold ${
                  message.includes("successfully")
                    ? "text-[#31571f]"
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