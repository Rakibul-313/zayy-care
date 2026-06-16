"use client";

import { useEffect, useState } from "react";
import { onValue, ref, set } from "firebase/database";
import { database } from "@/firebase/config";
import { Store, Mail, MapPin, Phone, Save, Eye } from "lucide-react";

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
  siteTagline:
    "We’d love to hear from you! Whether you have a question about our products, need help with an order, or just want to say hello.",
  logo: "/logo.png",
  favicon: "/favicon.ico",
  phone: "+880 1234-567890",
  whatsapp: "",
  email: "support@zayycare.com",
  address: "House 12, Road 5, Dhanmondi, Dhaka 1205, Bangladesh",
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
      console.error(error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to save general settings."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-[#FCFCFA] p-10 text-center text-[#4f5f49] shadow-[0_8px_24px_rgba(11,61,46,0.08)]">
        Loading general settings...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[6px] border border-[#0b3d2e]/10 bg-[#FCFCFA] p-6 shadow-[0_8px_24px_rgba(11,61,46,0.08)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-[#102015]">
              General Settings
            </h1>

            <p className="mt-2 text-[#4f5f49]">
              Manage store branding, contact information, social links and
              footer text.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex h-12 items-center gap-2 rounded-[6px] bg-[#003f2a] px-6 text-sm font-black uppercase text-white disabled:opacity-60"
          >
            <Save size={18} />
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_.7fr]">
        <div className="space-y-6">
          <SettingsCard
            icon={Store}
            title="Store Branding"
            description="Control website name, tagline, logo and favicon."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Site Name"
                value={settings.siteName}
                onChange={(value) => updateField("siteName", value)}
              />

              <Field
                label="Site Tagline"
                value={settings.siteTagline}
                onChange={(value) => updateField("siteTagline", value)}
              />

              <Field
                label="Logo URL"
                value={settings.logo}
                onChange={(value) => updateField("logo", value)}
                placeholder="/logo.png"
              />

              <Field
                label="Favicon URL"
                value={settings.favicon}
                onChange={(value) => updateField("favicon", value)}
                placeholder="/favicon.ico"
              />
            </div>
          </SettingsCard>

          <SettingsCard
            icon={Phone}
            title="Contact Information"
            description="This data will show on the contact page in real-time."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Phone Number"
                value={settings.phone}
                onChange={(value) => updateField("phone", value)}
              />

              <Field
                label="WhatsApp Number / URL"
                value={settings.whatsapp}
                onChange={(value) => updateField("whatsapp", value)}
              />

              <Field
                label="Email Address"
                type="email"
                value={settings.email}
                onChange={(value) => updateField("email", value)}
              />

              <Field
                label="Business Address"
                value={settings.address}
                onChange={(value) => updateField("address", value)}
              />
            </div>
          </SettingsCard>

          <SettingsCard
            icon={Mail}
            title="Social Media"
            description="Footer and social preview links."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Facebook URL"
                value={settings.facebook}
                onChange={(value) => updateField("facebook", value)}
              />

              <Field
                label="Instagram URL"
                value={settings.instagram}
                onChange={(value) => updateField("instagram", value)}
              />

              <Field
                label="TikTok URL"
                value={settings.tiktok}
                onChange={(value) => updateField("tiktok", value)}
              />

              <Field
                label="YouTube URL"
                value={settings.youtube}
                onChange={(value) => updateField("youtube", value)}
              />
            </div>
          </SettingsCard>

          <SettingsCard
            icon={Mail}
            title="Footer Text"
            description="Short brand text for footer."
          >
            <textarea
              value={settings.footerText}
              onChange={(e) => updateField("footerText", e.target.value)}
              placeholder="Footer text"
              rows={4}
              className="w-full resize-none rounded-[6px] border border-[#0b3d2e]/10 bg-[#fafaf7] px-5 py-4 text-[#102015] outline-none placeholder:text-[#7c8777]"
            />
          </SettingsCard>
        </div>

        <aside className="space-y-6">
          <PreviewCard title="Live Preview" icon={Eye}>
            <div className="rounded-[6px] bg-[#f5f1e8] p-6 text-center">
              <img
                src={settings.logo || "/logo.png"}
                alt={settings.siteName}
                className="mx-auto h-24 w-auto object-contain"
              />

              <h3 className="mt-5 text-3xl font-black text-[#102015]">
                {settings.siteName}
              </h3>

              <p className="mt-2 text-sm leading-6 text-[#4f5f49]">
                {settings.siteTagline}
              </p>
            </div>
          </PreviewCard>

          <PreviewCard title="Contact Preview" icon={Phone}>
            <div className="space-y-4 text-sm text-[#4f5f49]">
              <PreviewLine
                icon={Phone}
                text={settings.phone || "No phone added"}
              />

              <PreviewLine
                icon={Mail}
                text={settings.email || "No email added"}
              />

              <PreviewLine
                icon={MapPin}
                text={settings.address || "No address added"}
              />
            </div>
          </PreviewCard>

          <PreviewCard title="Social Preview" icon={Mail}>
            <div className="flex flex-wrap gap-3">
              {settings.facebook && (
                <SocialLink href={settings.facebook} label="FB" />
              )}

              {settings.instagram && (
                <SocialLink href={settings.instagram} label="IG" />
              )}

              {settings.youtube && (
                <SocialLink href={settings.youtube} label="YT" />
              )}

              {settings.tiktok && (
                <SocialLink href={settings.tiktok} label="TikTok" />
              )}

              {settings.whatsapp && (
                <SocialLink href={settings.whatsapp} label="WA" />
              )}

              {!settings.facebook &&
                !settings.instagram &&
                !settings.youtube &&
                !settings.tiktok &&
                !settings.whatsapp && (
                  <p className="text-sm text-[#4f5f49]">
                    No social links added.
                  </p>
                )}
            </div>
          </PreviewCard>

          <PreviewCard title="Contact Page Map" icon={MapPin}>
            <div className="overflow-hidden rounded-[6px] border border-[#0b3d2e]/10">
              <iframe
                title="Contact map preview"
                src={`https://www.google.com/maps?q=${encodeURIComponent(
                  settings.address || "Dhanmondi Dhaka Bangladesh"
                )}&output=embed`}
                className="h-[220px] w-full border-0"
                loading="lazy"
              />
            </div>
          </PreviewCard>
        </aside>
      </section>
    </div>
  );
}

function SettingsCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: any;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-[#FCFCFA] p-6 shadow-[0_8px_24px_rgba(11,61,46,0.08)]">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[6px] bg-[#e9f6ed] text-[#0b3d2e]">
          <Icon size={20} />
        </div>

        <div>
          <h2 className="text-2xl font-black text-[#102015]">{title}</h2>
          <p className="mt-1 text-sm text-[#4f5f49]">{description}</p>
        </div>
      </div>

      {children}
    </div>
  );
}

function PreviewCard({
  icon: Icon,
  title,
  children,
}: {
  icon: any;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-[#FCFCFA] p-6 shadow-[0_8px_24px_rgba(11,61,46,0.08)]">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-[6px] bg-[#e9f6ed] text-[#0b3d2e]">
          <Icon size={18} />
        </div>

        <h2 className="text-2xl font-black text-[#102015]">{title}</h2>
      </div>

      {children}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-[#102015]">
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || label}
        className="h-12 w-full rounded-[6px] border border-[#0b3d2e]/10 bg-[#fafaf7] px-5 text-[#102015] outline-none placeholder:text-[#7c8777]"
      />
    </label>
  );
}

function PreviewLine({
  icon: Icon,
  text,
}: {
  icon: any;
  text: string;
}) {
  return (
    <p className="flex items-start gap-3">
      <Icon className="mt-0.5 text-[#0b3d2e]" size={18} />
      <span>{text}</span>
    </p>
  );
}

function SocialLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex h-10 items-center justify-center rounded-[6px] border border-[#0b3d2e]/10 bg-[#f5f1e8] px-3 text-sm font-black text-[#0b3d2e]"
    >
      {label}
    </a>
  );
}