"use client";

import { useEffect, useState } from "react";
import { onValue, ref, set } from "firebase/database";
import { database } from "@/firebase/config";
import {
  Store,
  Mail,
  MapPin,
  Phone,
  Save,
} from "lucide-react";

type GeneralSettings = {
  siteName: string;
  siteTagline: string;
  logo: string;
  favicon: string;
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

const defaultSettings: GeneralSettings = {
  siteName: "ZAYY Care",
  siteTagline: "Premium Korean Skincare in Bangladesh",
  logo: "/logo.png",
  favicon: "/favicon.ico",
  phone: "",
  whatsapp: "",
  email: "",
  address: "",
  facebook: "",
  instagram: "",
  tiktok: "",
  youtube: "",
  footerText: "Glow Naturally, Love Your Skin.",
};

export default function GeneralSettingsPage() {
  const [settings, setSettings] = useState<GeneralSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = onValue(ref(database, "settings/general"), (snapshot) => {
      const data = snapshot.val();

      if (data) {
        setSettings({
          ...defaultSettings,
          ...data,
        });
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateField = <K extends keyof GeneralSettings>(
    key: K,
    value: GeneralSettings[K]
  ) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      await set(ref(database, "settings/general"), {
        ...settings,
        updatedAt: Date.now(),
      });

      alert("General settings saved successfully.");
    } catch (error) {
      console.log(error);
      alert("Failed to save general settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-[30px] border border-white/65 bg-white/36 p-10 text-center shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
        Loading general settings...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-white/65 bg-white/36 p-6 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-[#172313]">
              General Settings
            </h1>

            <p className="mt-2 text-gray-600">
              Manage store branding, contact information and social links.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-2xl bg-[#556B2F] px-6 py-4 font-semibold text-white disabled:opacity-60"
          >
            <Save size={18} />
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_.7fr]">
        <div className="space-y-6">
          <div className="rounded-[30px] border border-white/65 bg-white/36 p-6 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
            <div className="mb-5 flex items-center gap-3">
              <Store className="text-[#556B2F]" />
              <h2 className="text-2xl font-bold text-[#172313]">
                Store Branding
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <input
                value={settings.siteName}
                onChange={(e) => updateField("siteName", e.target.value)}
                placeholder="Site Name"
                className="rounded-2xl border border-white/70 bg-white/60 px-5 py-4 outline-none"
              />

              <input
                value={settings.siteTagline}
                onChange={(e) => updateField("siteTagline", e.target.value)}
                placeholder="Site Tagline"
                className="rounded-2xl border border-white/70 bg-white/60 px-5 py-4 outline-none"
              />

              <input
                value={settings.logo}
                onChange={(e) => updateField("logo", e.target.value)}
                placeholder="Logo URL e.g. /logo.png"
                className="rounded-2xl border border-white/70 bg-white/60 px-5 py-4 outline-none"
              />

              <input
                value={settings.favicon}
                onChange={(e) => updateField("favicon", e.target.value)}
                placeholder="Favicon URL e.g. /favicon.ico"
                className="rounded-2xl border border-white/70 bg-white/60 px-5 py-4 outline-none"
              />
            </div>
          </div>

          <div className="rounded-[30px] border border-white/65 bg-white/36 p-6 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
            <div className="mb-5 flex items-center gap-3">
              <Phone className="text-[#556B2F]" />
              <h2 className="text-2xl font-bold text-[#172313]">
                Contact Information
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <input
                value={settings.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                placeholder="Phone Number"
                className="rounded-2xl border border-white/70 bg-white/60 px-5 py-4 outline-none"
              />

              <input
                value={settings.whatsapp}
                onChange={(e) => updateField("whatsapp", e.target.value)}
                placeholder="WhatsApp Number"
                className="rounded-2xl border border-white/70 bg-white/60 px-5 py-4 outline-none"
              />

              <input
                value={settings.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="Email Address"
                type="email"
                className="rounded-2xl border border-white/70 bg-white/60 px-5 py-4 outline-none"
              />

              <input
                value={settings.address}
                onChange={(e) => updateField("address", e.target.value)}
                placeholder="Business Address"
                className="rounded-2xl border border-white/70 bg-white/60 px-5 py-4 outline-none"
              />
            </div>
          </div>

          <div className="rounded-[30px] border border-white/65 bg-white/36 p-6 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
            <div className="mb-5 flex items-center gap-3">
              <span className="font-black text-[#556B2F]">IG</span>
              <h2 className="text-2xl font-bold text-[#172313]">
                Social Media
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <input
                value={settings.facebook}
                onChange={(e) => updateField("facebook", e.target.value)}
                placeholder="Facebook Page URL"
                className="rounded-2xl border border-white/70 bg-white/60 px-5 py-4 outline-none"
              />

              <input
                value={settings.instagram}
                onChange={(e) => updateField("instagram", e.target.value)}
                placeholder="Instagram URL"
                className="rounded-2xl border border-white/70 bg-white/60 px-5 py-4 outline-none"
              />

              <input
                value={settings.tiktok}
                onChange={(e) => updateField("tiktok", e.target.value)}
                placeholder="TikTok URL"
                className="rounded-2xl border border-white/70 bg-white/60 px-5 py-4 outline-none"
              />

              <input
                value={settings.youtube}
                onChange={(e) => updateField("youtube", e.target.value)}
                placeholder="YouTube URL"
                className="rounded-2xl border border-white/70 bg-white/60 px-5 py-4 outline-none"
              />

              <input
                value={settings.whatsapp}
                onChange={(e) => updateField("whatsapp", e.target.value)}
                placeholder="WhatsApp URL"
                className="rounded-2xl border border-white/70 bg-white/60 px-5 py-4 outline-none"
              />
            </div>
          </div>

          <div className="rounded-[30px] border border-white/65 bg-white/36 p-6 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
            <h2 className="mb-5 text-2xl font-bold text-[#172313]">
              Footer Text
            </h2>

            <textarea
              value={settings.footerText}
              onChange={(e) => updateField("footerText", e.target.value)}
              placeholder="Footer text"
              rows={4}
              className="w-full resize-none rounded-2xl border border-white/70 bg-white/60 px-5 py-4 outline-none"
            />
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-[30px] border border-white/65 bg-white/36 p-6 text-center shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
            <h2 className="mb-5 text-2xl font-bold text-[#172313]">
              Live Preview
            </h2>

            <div className="rounded-[28px] bg-white/45 p-8">
              <img
                src={settings.logo || "/logo.png"}
                alt={settings.siteName}
                className="mx-auto h-24 w-auto object-contain"
              />

              <h3 className="mt-5 text-3xl font-black text-[#172313]">
                {settings.siteName}
              </h3>

              <p className="mt-2 text-gray-600">
                {settings.siteTagline}
              </p>
            </div>
          </div>

          <div className="rounded-[30px] border border-white/65 bg-white/36 p-6 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
            <h2 className="mb-5 text-2xl font-bold text-[#172313]">
              Contact Preview
            </h2>

            <div className="space-y-4 text-sm text-gray-700">
              <p className="flex items-center gap-3">
                <Phone className="text-[#556B2F]" size={18} />
                {settings.phone || "No phone added"}
              </p>

              <p className="flex items-center gap-3">
                <Mail className="text-[#556B2F]" size={18} />
                {settings.email || "No email added"}
              </p>

              <p className="flex items-start gap-3">
                <MapPin className="mt-0.5 text-[#556B2F]" size={18} />
                {settings.address || "No address added"}
              </p>
            </div>
          </div>

          <div className="rounded-[30px] border border-white/65 bg-white/36 p-6 shadow-[0_20px_70px_rgba(31,43,20,0.12)] backdrop-blur-2xl">
            <h2 className="mb-5 text-2xl font-bold text-[#172313]">
              Social Preview
            </h2>

            <div className="flex flex-wrap gap-3">
              {settings.facebook && (
                <a
                  href={settings.facebook}
                  target="_blank"
                  className="rounded-full bg-white/45 p-3 text-[#556B2F]"
                >
                  <div>FB</div>
                </a>
              )}

              {settings.instagram && (
                <a
                  href={settings.instagram}
                  target="_blank"
                  className="rounded-full bg-white/45 p-3 text-[#556B2F]"
                >
                  <div>IG</div>
                </a>
              )}

              {settings.youtube && (
                <a
                  href={settings.youtube}
                  target="_blank"
                  className="rounded-full bg-white/45 p-3 text-[#556B2F]"
                >
                  <div>YT</div>
                </a>
              )}

              {settings.tiktok && (
                <a
                  href={settings.tiktok}
                  target="_blank"
                  className="rounded-full bg-white/45 p-3 text-[#556B2F]"
                >
                  TikTok
                </a>
              )}

              {settings.whatsapp && (
                <a
                  href={settings.whatsapp}
                  target="_blank"
                  className="rounded-full bg-white/45 p-3 text-[#556B2F]"
                >
                  WA
                </a>
              )}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}