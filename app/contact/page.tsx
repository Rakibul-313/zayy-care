"use client";

import { useEffect, useState } from "react";
import { Clock, ExternalLink, Mail, MapPin, MessageCircle, Phone, Send } from "lucide-react";
import { onValue, push, ref, set } from "firebase/database";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { database } from "@/firebase/config";
import { getCartCount } from "@/lib/cart";
import { getWishlistCount } from "@/lib/wishlist";

type ContactSettings = {
  siteName: string;
  siteTagline: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
};

const defaultSettings: ContactSettings = {
  siteName: "ZAYY Care",
  siteTagline:
    "We’d love to hear from you! Whether you have a question about our products, need help with an order, or just want to say hello.",
  phone: "+880 1234-567890",
  whatsapp: "",
  email: "support@zayycare.com",
  address: "House 12, Road 5, Dhanmondi, Dhaka 1205, Bangladesh",
};

export default function ContactPage() {
  const [settings, setSettings] = useState<ContactSettings>(defaultSettings);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  const [fullName, setFullName] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setCartCount(getCartCount());
    setWishlistCount(getWishlistCount());

    const unsubscribe = onValue(ref(database, "settings/general"), (snapshot) => {
      const data = snapshot.val();
      if (data) setSettings({ ...defaultSettings, ...data });
    });

    const updateCounts = () => {
      setCartCount(getCartCount());
      setWishlistCount(getWishlistCount());
    };

    window.addEventListener("cartUpdated", updateCounts);
    window.addEventListener("wishlistUpdated", updateCounts);
    window.addEventListener("storage", updateCounts);

    return () => {
      unsubscribe();
      window.removeEventListener("cartUpdated", updateCounts);
      window.removeEventListener("wishlistUpdated", updateCounts);
      window.removeEventListener("storage", updateCounts);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!fullName.trim() || !emailAddress.trim() || !subject.trim() || !message.trim()) {
      alert("Please fill all fields");
      return;
    }

    try {
      setSending(true);

      const messageRef = push(ref(database, "contactMessages"));

      await set(messageRef, {
        firebaseId: messageRef.key,
        fullName: fullName.trim(),
        email: emailAddress.trim(),
        subject: subject.trim(),
        message: message.trim(),
        status: "unread",
        createdAt: Date.now(),
      });

      alert("Message sent successfully");

      setFullName("");
      setEmailAddress("");
      setSubject("");
      setMessage("");
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Navbar cartCount={cartCount} wishlistCount={wishlistCount} />

      <main className="min-h-screen bg-[#fafaf7]">
        <section className="px-4 pt-[105px] sm:px-8 lg:px-14 lg:pt-[115px]">
          <div className="mx-auto max-w-[1200px] py-8 text-center">
            <h1 className="dream-font text-[44px] leading-none text-[#0b3d2e] sm:text-[58px]">
              Contact Us
            </h1>

            <p className="mx-auto mt-3 max-w-[620px] text-sm leading-7 text-[#4f5f49]">
              {settings.siteTagline}
            </p>
          </div>
        </section>

        <section className="px-4 pb-6 sm:px-8 lg:px-14">
          <div className="mx-auto grid max-w-[1200px] overflow-hidden rounded-[6px] border border-[#0b3d2e]/10 bg-white lg:grid-cols-[0.75fr_1.25fr]">
            <aside className="border-b border-[#0b3d2e]/10 p-6 lg:border-b-0 lg:border-r">
              <h2 className="text-xl font-black text-[#102015]">Get in Touch</h2>
              <p className="mt-2 text-sm text-[#4f5f49]">
                Our customer care team is here to help you.
              </p>

              <div className="mt-6 space-y-5">
                <ContactItem
                  icon={Phone}
                  title="Phone"
                  text={settings.phone}
                  subText="Mon - Fri, 9:00 AM - 6:00 PM (GMT+6)"
                />

                <ContactItem
                  icon={Mail}
                  title="Email"
                  text={settings.email}
                  subText="We usually reply within 24 hours"
                />

                <ContactItem
                  icon={MessageCircle}
                  title="Live Chat"
                  text="Chat with our team in real-time"
                  subText="Start Live Chat →"
                />

                <ContactItem
                  icon={MapPin}
                  title="Address"
                  text={settings.address}
                  subText="Bangladesh"
                />
              </div>
            </aside>

            <form onSubmit={handleSubmit} className="p-6">
              <h2 className="text-xl font-black text-[#102015]">
                Send Us a Message
              </h2>
              <p className="mt-2 text-sm text-[#4f5f49]">
                Fill out the form and we’ll get back to you soon.
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <input
                  type="text"
                  placeholder="Your Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-11 rounded-[6px] border border-[#0b3d2e]/10 bg-[#fafaf7] px-4 text-sm outline-none"
                />

                <input
                  type="email"
                  placeholder="Email Address"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  className="h-11 rounded-[6px] border border-[#0b3d2e]/10 bg-[#fafaf7] px-4 text-sm outline-none"
                />

                <input
                  type="text"
                  placeholder="Subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="h-11 rounded-[6px] border border-[#0b3d2e]/10 bg-[#fafaf7] px-4 text-sm outline-none sm:col-span-2"
                />

                <textarea
                  placeholder="Message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={7}
                  className="resize-none rounded-[6px] border border-[#0b3d2e]/10 bg-[#fafaf7] px-4 py-3 text-sm outline-none sm:col-span-2"
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                className="mt-5 flex h-11 items-center justify-center gap-2 rounded-[6px] bg-[#0b3d2e] px-6 text-sm font-black uppercase text-white disabled:opacity-60"
              >
                {sending ? "Sending..." : "Send Message"}
                <Send size={16} />
              </button>
            </form>
          </div>
        </section>

        <section className="px-4 pb-10 sm:px-8 lg:px-14">
          <div className="mx-auto max-w-[1200px] overflow-hidden rounded-[6px] border border-[#0b3d2e]/10 bg-white">
            <div className="relative min-h-[230px] bg-[#e9efe7]">
              <iframe
                title="ZAYY Care Location"
                src={`https://www.google.com/maps?q=${encodeURIComponent(
                  settings.address || "Dhanmondi Dhaka Bangladesh"
                )}&output=embed`}
                className="absolute inset-0 h-full w-full border-0"
                loading="lazy"
              />

              <div className="absolute left-5 top-5 w-[250px] rounded-[6px] bg-white p-5 shadow-[0_10px_30px_rgba(11,61,46,0.14)]">
                <h3 className="text-lg font-black text-[#102015]">Visit Us</h3>
                <p className="mt-2 text-xs leading-5 text-[#4f5f49]">
                  We welcome you to visit our office.
                </p>

                <p className="mt-4 text-sm font-black text-[#102015]">
                  Zayy Care Office
                </p>

                <p className="mt-1 text-xs leading-5 text-[#4f5f49]">
                  {settings.address}
                </p>

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    settings.address || "Dhanmondi Dhaka Bangladesh"
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 flex h-10 items-center justify-center gap-2 rounded-[6px] border border-[#0b3d2e]/20 bg-[#fafaf7] text-xs font-black text-[#0b3d2e]"
                >
                  Get Directions
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 pb-10 sm:px-8 lg:px-14">
          <div className="mx-auto grid max-w-[1200px] grid-cols-2 gap-3 rounded-[6px] border border-[#0b3d2e]/10 bg-[#f5f1e8] p-4 lg:grid-cols-4">
            {[
              ["100% Authentic", "Korean Skincare Products"],
              ["Free Delivery", "on orders over ৳1,500"],
              ["Secure Payment", "100% Safe Checkout"],
              ["Easy Returns", "7 Days Hassle-free Returns"],
            ].map(([title, text]) => (
              <div key={title} className="flex items-center gap-3 p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-[6px] bg-white text-[#0b3d2e]">
                  <Clock size={17} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-[#102015]">{title}</h4>
                  <p className="text-xs text-[#4f5f49]">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
}

function ContactItem({
  icon: Icon,
  title,
  text,
  subText,
}: {
  icon: any;
  title: string;
  text?: string;
  subText?: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[6px] bg-[#e9f6ed] text-[#0b3d2e]">
        <Icon size={18} />
      </div>

      <div>
        <h3 className="text-sm font-black text-[#102015]">{title}</h3>
        <p className="mt-1 whitespace-pre-line text-sm font-semibold leading-6 text-[#4f5f49]">
          {text || "Not available"}
        </p>
        {subText && <p className="mt-1 text-xs text-[#6b7568]">{subText}</p>}
      </div>
    </div>
  );
}