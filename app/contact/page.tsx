"use client";

import { useEffect, useState } from "react";
import { Clock, Mail, MapPin, MessageCircle, Phone, Send } from "lucide-react";
import { onValue, push, ref, set } from "firebase/database";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { database } from "@/firebase/config";

type ContactSettings = {
  siteName: string;
  siteTagline: string;

  phone: string;
  whatsapp: string;
  email: string;
  address: string;

  facebook: string;
  instagram: string;
  tiktok: string;
  youtube: string;

  footerText: string;
};

const defaultSettings: ContactSettings = {
  siteName: "ZAYY Care",
  siteTagline: "Premium Korean Skincare in Bangladesh",

  phone: "",
  whatsapp: "",
  email: "",
  address: "",

  facebook: "",
  instagram: "",
  tiktok: "",
  youtube: "",

  footerText: "",
};

export default function ContactPage() {
  const [settings, setSettings] = useState<ContactSettings>(defaultSettings);
  const [fullName, setFullName] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const settingsRef = ref(database, "settings/general");

    const unsubscribe = onValue(settingsRef, (snapshot) => {
      const data = snapshot.val();

      if (data) {
        setSettings({
          ...defaultSettings,
          ...data,
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const contactMethods = [
    {
      icon: Phone,
      title: "Call",
      text: settings.phone,
    },
    {
      icon: MessageCircle,
      title: "WhatsApp",
      text: settings.whatsapp,
    },
    {
      icon: Mail,
      title: "Email",
      text: settings.email,
    },
    {
      icon: MapPin,
      title: "Location",
      text: settings.address,
    },
  ];

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
        fullName,
        email: emailAddress,
        subject,
        message,
        status: "unread",
        createdAt: Date.now(),
      });

      alert("Message sent successfully");

      setFullName("");
      setEmailAddress("");
      setSubject("");
      setMessage("");
    } catch (error) {
      console.log(error);
      alert("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div
        className="fixed inset-0 -z-20 bg-cover bg-center"
        style={{ backgroundImage: "url('/nature-bg.png')" }}
      />
      <div className="fixed inset-0 -z-10 bg-[#f5f1e8]/70 backdrop-blur-[2px]" />

      <Navbar />

      <div className="pt-[175px] pb-10 px-4 sm:px-8 lg:px-14">
        <div className="max-w-[1820px] mx-auto space-y-8">
          <section className="glass rounded-[34px] p-8 lg:p-10">
            <p className="text-[#556B2F] font-medium mb-2">
              {settings.siteName}
            </p>

            <h1 className="dream-font text-[48px] sm:text-[64px] text-black">
              Contact
            </h1>

            <p className="text-gray-600 leading-8 max-w-[720px] mt-4">
              {settings.siteTagline}
            </p>
          </section>

          <section className="grid lg:grid-cols-[0.9fr_1.1fr] gap-8">
            <div className="grid sm:grid-cols-2 gap-5">
              {contactMethods.map((method) => {
                const Icon = method.icon;

                return (
                  <article key={method.title} className="glass rounded-[28px] p-6">
                    <div className="w-13 h-13 rounded-2xl bg-white/40 flex items-center justify-center text-[#556B2F] mb-5">
                      <Icon size={25} />
                    </div>

                    <h2 className="text-2xl font-semibold text-black">
                      {method.title}
                    </h2>

                    <p className="text-gray-600 leading-7 mt-2">
                      {method.text}
                    </p>
                  </article>
                );
              })}
            </div>

            <form onSubmit={handleSubmit} className="glass rounded-[34px] p-7 space-y-5">
              <h2 className="text-3xl font-semibold text-black">
                Send a message
              </h2>

              <div className="grid sm:grid-cols-2 gap-5">
                <input
                  type="text"
                  placeholder="Full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="glass-soft rounded-full px-5 py-4 outline-none bg-transparent"
                />

                <input
                  type="email"
                  placeholder="Email address"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  className="glass-soft rounded-full px-5 py-4 outline-none bg-transparent"
                />
              </div>

              <input
                type="text"
                placeholder="Subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="glass-soft w-full rounded-full px-5 py-4 outline-none bg-transparent"
              />

              <textarea
                placeholder="How can we help?"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="glass-soft w-full rounded-[24px] px-5 py-4 outline-none min-h-[150px] bg-transparent"
              />

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
                <p className="flex items-center gap-2 text-gray-600">
                  <Clock size={18} className="text-[#556B2F]" />
                   Typical reply time: 24 hours
                </p>

                <button
                  type="submit"
                  disabled={sending}
                  className="inline-flex items-center justify-center gap-2 bg-[#556B2F] text-white rounded-full px-8 py-4 premium-hover text-center disabled:opacity-60"
                >
                  <Send size={18} />
                  {sending ? "Sending..." : "Submit Message"}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>

      <Footer />
    </main>
  );
}