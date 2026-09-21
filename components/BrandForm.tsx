"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Brand } from "@/db/schema";

type FormState = {
  name: string;
  industry: string;
  website: string;
  location: string;
  description: string;
  targetAudience: string;
  products: string;
  services: string;
  usp: string;
  toneOfVoice: string;
  communicationStyle: string;
  primaryLanguage: string;
  secondaryLanguage: string;
  brandColors: string;
  typography: string;
  logoUrl: string;
  socialPlatforms: string;
  competitors: string;
  approvedCtas: string;
  forbiddenWords: string;
  requiredHashtags: string;
  contactInformation: string;
};

function parseJsonArray(value: string | null | undefined): string {
  if (!value) return "";
  try {
    const arr = JSON.parse(value);
    return Array.isArray(arr) ? arr.join(", ") : "";
  } catch {
    return "";
  }
}

function toArray(value: string): string[] {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function fromBrand(brand?: Brand): FormState {
  return {
    name: brand?.name ?? "",
    industry: brand?.industry ?? "",
    website: brand?.website ?? "",
    location: brand?.location ?? "",
    description: brand?.description ?? "",
    targetAudience: brand?.targetAudience ?? "",
    products: brand?.products ?? "",
    services: brand?.services ?? "",
    usp: brand?.usp ?? "",
    toneOfVoice: brand?.toneOfVoice ?? "",
    communicationStyle: brand?.communicationStyle ?? "",
    primaryLanguage: brand?.primaryLanguage ?? "English",
    secondaryLanguage: brand?.secondaryLanguage ?? "",
    brandColors: parseJsonArray(brand?.brandColors),
    typography: brand?.typography ?? "",
    logoUrl: brand?.logoUrl ?? "",
    socialPlatforms: parseJsonArray(brand?.socialPlatforms),
    competitors: parseJsonArray(brand?.competitors),
    approvedCtas: parseJsonArray(brand?.approvedCtas),
    forbiddenWords: parseJsonArray(brand?.forbiddenWords),
    requiredHashtags: parseJsonArray(brand?.requiredHashtags),
    contactInformation: brand?.contactInformation ?? "",
  };
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink">{label}</label>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-muted focus:border-indigo focus:outline-none focus:ring-1 focus:ring-indigo";

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-6 shadow-card">
      <h2 className="font-display text-lg text-ink">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

export function BrandForm({ brand }: { brand?: Brand }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(fromBrand(brand));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function set<K extends keyof FormState>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError("Brand name is required.");
      return;
    }

    setLoading(true);

    const payload = {
      name: form.name,
      industry: form.industry,
      website: form.website,
      location: form.location,
      description: form.description,
      targetAudience: form.targetAudience,
      products: form.products,
      services: form.services,
      usp: form.usp,
      toneOfVoice: form.toneOfVoice,
      communicationStyle: form.communicationStyle,
      primaryLanguage: form.primaryLanguage,
      secondaryLanguage: form.secondaryLanguage,
      brandColors: toArray(form.brandColors),
      typography: form.typography,
      logoUrl: form.logoUrl,
      socialPlatforms: toArray(form.socialPlatforms),
      competitors: toArray(form.competitors),
      approvedCtas: toArray(form.approvedCtas),
      forbiddenWords: toArray(form.forbiddenWords),
      requiredHashtags: toArray(form.requiredHashtags),
      contactInformation: form.contactInformation,
    };

    const res = await fetch(brand ? `/api/brands/${brand.id}` : "/api/brands", {
      method: brand ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      return;
    }

    router.push(`/brands/${data.brand.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Section title="Basics">
        <Field label="Brand name">
          <input
            required
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className={inputClass}
            placeholder="e.g. KIA Shehzore Smart"
          />
        </Field>
        <Field label="Industry">
          <input
            value={form.industry}
            onChange={(e) => set("industry", e.target.value)}
            className={inputClass}
            placeholder="e.g. Automotive"
          />
        </Field>
        <Field label="Website">
          <input
            value={form.website}
            onChange={(e) => set("website", e.target.value)}
            className={inputClass}
            placeholder="https://"
          />
        </Field>
        <Field label="Location">
          <input
            value={form.location}
            onChange={(e) => set("location", e.target.value)}
            className={inputClass}
            placeholder="e.g. Karachi, Pakistan"
          />
        </Field>
      </Section>

      <Section title="About the brand">
        <div className="sm:col-span-2">
          <Field label="Description">
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              className={inputClass}
              rows={3}
            />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Target audience">
            <textarea
              value={form.targetAudience}
              onChange={(e) => set("targetAudience", e.target.value)}
              className={inputClass}
              rows={2}
            />
          </Field>
        </div>
        <Field label="Products">
          <textarea
            value={form.products}
            onChange={(e) => set("products", e.target.value)}
            className={inputClass}
            rows={2}
          />
        </Field>
        <Field label="Services">
          <textarea
            value={form.services}
            onChange={(e) => set("services", e.target.value)}
            className={inputClass}
            rows={2}
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="USP (unique selling proposition)">
            <textarea
              value={form.usp}
              onChange={(e) => set("usp", e.target.value)}
              className={inputClass}
              rows={2}
            />
          </Field>
        </div>
      </Section>

      <Section
        title="Voice & visual identity"
        description="What every AI agent should sound and look like for this brand."
      >
        <Field label="Tone of voice">
          <input
            value={form.toneOfVoice}
            onChange={(e) => set("toneOfVoice", e.target.value)}
            className={inputClass}
            placeholder="e.g. Confident, warm, premium"
          />
        </Field>
        <Field label="Communication style">
          <input
            value={form.communicationStyle}
            onChange={(e) => set("communicationStyle", e.target.value)}
            className={inputClass}
            placeholder="e.g. Direct, conversational"
          />
        </Field>
        <Field label="Primary language">
          <input
            value={form.primaryLanguage}
            onChange={(e) => set("primaryLanguage", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Secondary language">
          <input
            value={form.secondaryLanguage}
            onChange={(e) => set("secondaryLanguage", e.target.value)}
            className={inputClass}
            placeholder="e.g. Urdu"
          />
        </Field>
        <Field label="Brand colors" hint="Comma separated hex codes">
          <input
            value={form.brandColors}
            onChange={(e) => set("brandColors", e.target.value)}
            className={inputClass}
            placeholder="#3552E0, #E7A33E"
          />
        </Field>
        <Field label="Typography">
          <input
            value={form.typography}
            onChange={(e) => set("typography", e.target.value)}
            className={inputClass}
            placeholder="e.g. Poppins / Inter"
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Logo URL">
            <input
              value={form.logoUrl}
              onChange={(e) => set("logoUrl", e.target.value)}
              className={inputClass}
              placeholder="https://"
            />
          </Field>
        </div>
      </Section>

      <Section title="Distribution">
        <Field label="Social platforms" hint="Comma separated">
          <input
            value={form.socialPlatforms}
            onChange={(e) => set("socialPlatforms", e.target.value)}
            className={inputClass}
            placeholder="Instagram, Facebook, LinkedIn"
          />
        </Field>
        <Field label="Competitors" hint="Comma separated">
          <input
            value={form.competitors}
            onChange={(e) => set("competitors", e.target.value)}
            className={inputClass}
          />
        </Field>
      </Section>

      <Section
        title="Guardrails"
        description="Agents check every piece of content against these before it moves forward."
      >
        <Field label="Approved CTAs" hint="Comma separated">
          <input
            value={form.approvedCtas}
            onChange={(e) => set("approvedCtas", e.target.value)}
            className={inputClass}
            placeholder="Shop now, Book a demo"
          />
        </Field>
        <Field label="Required hashtags" hint="Comma separated">
          <input
            value={form.requiredHashtags}
            onChange={(e) => set("requiredHashtags", e.target.value)}
            className={inputClass}
            placeholder="#AdPulseIMC"
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Forbidden words" hint="Comma separated — never used in generated content">
            <input
              value={form.forbiddenWords}
              onChange={(e) => set("forbiddenWords", e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
      </Section>

      <Section title="Contact">
        <div className="sm:col-span-2">
          <Field label="Contact information">
            <textarea
              value={form.contactInformation}
              onChange={(e) => set("contactInformation", e.target.value)}
              className={inputClass}
              rows={2}
            />
          </Field>
        </div>
      </Section>

      {error && (
        <p className="rounded-lg bg-danger-light px-4 py-2.5 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-indigo px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-dark disabled:opacity-60"
        >
          {loading ? "Saving…" : brand ? "Save changes" : "Create brand"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg px-5 py-2.5 text-sm font-medium text-muted hover:bg-canvas"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
