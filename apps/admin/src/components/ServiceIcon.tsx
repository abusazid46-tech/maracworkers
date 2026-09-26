"use client";

import React from "react";

export type ServiceIconKey =
  | "all"
  | "bathroom"
  | "cleaning"
  | "tank"
  | "ac"
  | "sofa"
  | "home"
  | "kitchen"
  | "appliance"
  | "electrician"
  | "plumber"
  | "carpenter"
  | "mason"
  | "construction"
  | "daily_worker"
  | "pest"
  | "painting"
  | "salon"
  | "security";

export const serviceIconOptions: Array<{ key: ServiceIconKey; label: string }> = [
  { key: "electrician", label: "Electrician" },
  { key: "plumber", label: "Plumber" },
  { key: "daily_worker", label: "Daily Worker" },
  { key: "construction", label: "Construction" },
  { key: "carpenter", label: "Carpenter" },
  { key: "mason", label: "Mason (Rajmistri)" },
  { key: "painting", label: "Painting" },
  { key: "ac", label: "AC & Appliance" },
  { key: "tank", label: "Water Tank" },
  { key: "bathroom", label: "Bathroom" },
  { key: "home", label: "Deep Clean" },
  { key: "sofa", label: "Sofa" },
  { key: "kitchen", label: "Kitchen" },
  { key: "pest", label: "Pest" },
  { key: "salon", label: "Salon & Spa" },
  { key: "security", label: "Security" },
  { key: "cleaning", label: "Cleaning" }
];

const iconKeys: ServiceIconKey[] = [
  "all",
  "bathroom",
  "cleaning",
  "tank",
  "ac",
  "sofa",
  "home",
  "kitchen",
  "appliance",
  "electrician",
  "plumber",
  "carpenter",
  "mason",
  "construction",
  "daily_worker",
  "pest",
  "painting",
  "salon",
  "security"
];

const aliases: Record<string, ServiceIconKey> = {
  sparkle: "cleaning",
  stars: "cleaning",
  clean: "cleaning",
  toilet: "bathroom",
  bath: "bathroom",
  water: "tank",
  droplet: "tank",
  snow: "ac",
  cooling: "ac",
  repair: "appliance",
  tool: "appliance",
  tools: "appliance",
  fridge: "appliance",
  refrigerator: "appliance",
  chimney: "kitchen",
  couch: "sofa",
  carpet: "sofa",
  deep: "home",
  house: "home",
  paint: "painting",
  waterproofing: "painting",
  guard: "security",
  shield: "security",
  spa: "salon",
  beauty: "salon",
  barber: "salon",
  helper: "daily_worker",
  labor: "daily_worker",
  worker: "daily_worker",
  site: "construction",
  demolition: "construction",
  rajmistri: "mason",
  brick: "mason",
  tile: "mason"
};

export function normalizeServiceIconKey(value?: string | null, fallback: ServiceIconKey = "cleaning"): ServiceIconKey {
  const normalized = normalizeIconToken(value);
  if (iconKeys.includes(normalized as ServiceIconKey)) return normalized as ServiceIconKey;
  return aliases[normalized] ?? fallback;
}

export function resolveServiceIconKey(icon: string | null | undefined, searchableText: string, fallback: ServiceIconKey = "cleaning"): ServiceIconKey {
  const normalized = normalizeIconToken(icon);
  if (iconKeys.includes(normalized as ServiceIconKey) && normalized !== "all") return normalized as ServiceIconKey;
  return inferServiceIconKey([searchableText, icon].filter(Boolean).join(" "), fallback);
}

export function inferServiceIconKey(value: string, fallback: ServiceIconKey = "cleaning"): ServiceIconKey {
  const text = value.toLowerCase();
  if (/\b(toilet|bath|bathroom|washroom|sanit)/.test(text)) return "bathroom";
  if (/\b(tank|water|sintex|reservoir)/.test(text)) return "tank";
  if (/\b(ac|air conditioner|cooling|jet clean)/.test(text)) return "ac";
  if (/\b(sofa|couch|mattress|carpet)/.test(text)) return "sofa";
  if (/\b(kitchen|chimney)/.test(text)) return "kitchen";
  if (/\b(fridge|refrigerator|washing machine|appliance)/.test(text)) return "appliance";
  if (/\b(electric|electrician|wiring|light|fan|mcb|switchboard)/.test(text)) return "electrician";
  if (/\b(plumber|plumbing|leak|tap|basin|drain|pipe|commode|cistern)/.test(text)) return "plumber";
  if (/\b(carpenter|wood|door|furniture|lock|wardrobe|bed)/.test(text)) return "carpenter";
  if (/\b(mason|rajmistri|brick|plaster|cement|mortar)/.test(text)) return "mason";
  if (/\b(construction|shuttering|demolition|rebar|debris)/.test(text)) return "construction";
  if (/\b(daily|helper|loader|shifting|digging|labor)/.test(text)) return "daily_worker";
  if (/\b(pest|cockroach|ant|bug|termite)/.test(text)) return "pest";
  if (/\b(paint|painting|waterproof|putty)/.test(text)) return "painting";
  if (/\b(salon|spa|grooming|haircut|massage)/.test(text)) return "salon";
  if (/\b(security|guard|facility|bouncer)/.test(text)) return "security";
  if (/\b(home|deep|room|bhk)/.test(text)) return "home";
  return normalizeServiceIconKey(value, fallback);
}

function normalizeIconToken(value?: string | null) {
  return value?.trim().toLowerCase().replace(/^bi\s+/, "").replace(/^bi-/, "").replace(/[^a-z0-9_]+/g, "-") ?? "";
}

export function ServiceIcon({ name, className, title }: { name?: string | null; className?: string; title?: string }) {
  const key = normalizeServiceIconKey(name);
  return (
    <svg className={className} viewBox="0 0 24 24" role="img" aria-label={title ?? key} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {icons[key]}
    </svg>
  );
}

const icons: Record<ServiceIconKey, React.ReactNode> = {
  all: (
    <>
      <rect x="4" y="4" width="6" height="6" rx="1.5" />
      <rect x="14" y="4" width="6" height="6" rx="1.5" />
      <rect x="4" y="14" width="6" height="6" rx="1.5" />
      <rect x="14" y="14" width="6" height="6" rx="1.5" />
    </>
  ),
  bathroom: (
    <>
      <path d="M5 11h14v3a5 5 0 0 1-5 5h-4a5 5 0 0 1-5-5v-3Z" />
      <path d="M7 11V6.7A2.7 2.7 0 0 1 9.7 4H11" />
      <path d="M4 11h16" />
      <path d="M8 19l-1 2" />
      <path d="M16 19l1 2" />
    </>
  ),
  cleaning: (
    <>
      <path d="M12 3l1.3 4.2L17.5 8l-4.2 1.3L12 13.5l-1.3-4.2L6.5 8l4.2-1.3L12 3Z" />
      <path d="M5 14l.7 2.3L8 17l-2.3.7L5 20l-.7-2.3L2 17l2.3-.7L5 14Z" />
      <path d="M18 14l.9 2.6 2.6.9-2.6.9L18 21l-.9-2.6-2.6-.9 2.6-.9L18 14Z" />
    </>
  ),
  tank: (
    <>
      <path d="M6 8c0-2.2 2.7-4 6-4s6 1.8 6 4v8c0 2.2-2.7 4-6 4s-6-1.8-6-4V8Z" />
      <path d="M6 8c0 2.2 2.7 4 6 4s6-1.8 6-4" />
      <path d="M9 15c.7.5 1.7.8 3 .8s2.3-.3 3-.8" />
    </>
  ),
  ac: (
    <>
      <rect x="4" y="5" width="16" height="8" rx="2" />
      <path d="M7 10h10" />
      <path d="M8 17h.01" />
      <path d="M12 17h.01" />
      <path d="M16 17h.01" />
      <path d="M9 13v2" />
      <path d="M15 13v2" />
    </>
  ),
  sofa: (
    <>
      <path d="M6 11V8a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v3" />
      <path d="M5 11h14a2 2 0 0 1 2 2v5H3v-5a2 2 0 0 1 2-2Z" />
      <path d="M5 18v2" />
      <path d="M19 18v2" />
    </>
  ),
  home: (
    <>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 10.5V20h13v-9.5" />
      <path d="M9.5 20v-5h5v5" />
    </>
  ),
  kitchen: (
    <>
      <path d="M6 4h12l-1 8H7L6 4Z" />
      <path d="M8 12h8v8H8v-8Z" />
      <path d="M10 7h4" />
      <path d="M10 16h4" />
    </>
  ),
  appliance: (
    <>
      <rect x="7" y="3" width="10" height="18" rx="2" />
      <circle cx="12" cy="14" r="3" />
      <path d="M10 7h4" />
      <path d="M15 19h.01" />
    </>
  ),
  electrician: (
    <>
      <path d="M13 2 5 13h6l-1 9 9-12h-6l1-8Z" />
    </>
  ),
  plumber: (
    <>
      <path d="M4 7h9a3 3 0 0 1 3 3v1" />
      <path d="M16 11h4v5a4 4 0 0 1-8 0v-1h4v1a0 0 0 0 0 0 0" />
      <path d="M4 5v4" />
      <path d="M7 5v4" />
    </>
  ),
  carpenter: (
    <>
      <path d="M4 20 15.5 8.5" />
      <path d="m13 6 5-2 2 2-2 5" />
      <path d="m12 8 4 4" />
      <path d="M6 18l-2 2" />
    </>
  ),
  mason: (
    <>
      <rect x="3" y="14" width="8" height="4" rx="0.5" />
      <rect x="13" y="14" width="8" height="4" rx="0.5" />
      <rect x="7" y="8" width="10" height="4" rx="0.5" />
      <path d="M3 20h18" />
    </>
  ),
  construction: (
    <>
      <path d="M2 18h20" />
      <path d="M5 18V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v10" />
      <path d="M9 18V9h6v9" />
      <path d="M12 3v3" />
    </>
  ),
  daily_worker: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  pest: (
    <>
      <ellipse cx="12" cy="13" rx="4" ry="6" />
      <path d="M9 8a3 3 0 0 1 6 0" />
      <path d="M4 10h4" />
      <path d="M16 10h4" />
      <path d="M5 16h3" />
      <path d="M16 16h3" />
      <path d="M12 7v12" />
    </>
  ),
  painting: (
    <>
      <path d="M4 5h11a3 3 0 0 1 0 6H8v3" />
      <rect x="6" y="14" width="4" height="7" rx="1" />
      <path d="M17 5v6" />
    </>
  ),
  salon: (
    <>
      <circle cx="12" cy="8" r="3" />
      <path d="M7 21a5 5 0 0 1 10 0" />
      <path d="M5 5l3 3" />
      <path d="M19 5l-3 3" />
      <path d="M7 13c1.3 1 3 1.5 5 1.5s3.7-.5 5-1.5" />
    </>
  ),
  security: (
    <>
      <path d="M12 3 5 6v5c0 4.5 3 8.4 7 10 4-1.6 7-5.5 7-10V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  )
};
