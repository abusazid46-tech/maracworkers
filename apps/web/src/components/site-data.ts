import type { ServiceIconKey } from "./ServiceIcon";

export type ServiceCategoryId =
  | "electrician"
  | "plumber"
  | "daily_worker"
  | "construction"
  | "carpenter"
  | "mason"
  | "painter"
  | "ac"
  | "deep"
  | "tank"
  | "toilet"
  | "kitchen"
  | "sofa"
  | "pest"
  | "salon"
  | "maid"
  | "security";

export type ServiceItem = {
  id: string | number;
  serviceId?: string;
  category: ServiceCategoryId;
  categoryLabel?: string;
  iconKey: ServiceIconKey;
  name: string;
  description: string;
  price: number;
  priceLabel?: string;
  originalPrice?: number;
  originalPriceLabel?: string;
  discountLabel?: string;
  groupLabel?: string;
  imageUrl?: string;
  durationLabel?: string;
  bookingCount?: number;
  bookedQuantity?: number;
};

export const categoryLabels: Record<ServiceCategoryId, string> = {
  electrician: "Electrician",
  plumber: "Plumber",
  daily_worker: "Daily Workers & Helpers",
  construction: "Construction Worker",
  carpenter: "Carpenter",
  mason: "Mason (Rajmistri)",
  painter: "Painter",
  ac: "AC & Appliances",
  deep: "Deep Home Clean",
  tank: "Tank Wash",
  toilet: "Toilet & Bath",
  sofa: "Sofa Clean",
  kitchen: "Kitchen & Chimney",
  pest: "Pest Control",
  salon: "Saloon & Spa",
  maid: "Aya and Housemaid",
  security: "Security Guard"
};

export const services: ServiceItem[] = [
  // --- ELECTRICIAN ---
  {
    id: 101,
    category: "electrician",
    iconKey: "electrician",
    name: "Licensed Electrician General Visit",
    description: "Doorstep diagnostic & inspection for power trips, short circuits, voltage issues, and general repairs.",
    price: 199,
    originalPrice: 299,
    durationLabel: "30-45 mins",
    imageUrl: "/images/workers/electrician.jpg"
  },
  {
    id: 102,
    category: "electrician",
    iconKey: "electrician",
    name: "Switchboard & Socket Installation / Fix",
    description: "Replacement and wiring of modular switchboards, high-power 16A sockets, and isolators.",
    price: 149,
    originalPrice: 199,
    durationLabel: "25-30 mins",
    imageUrl: "/images/workers/electrician.jpg"
  },
  {
    id: 103,
    category: "electrician",
    iconKey: "electrician",
    name: "Inverter & Battery Wiring Setup",
    description: "Safe installation, wiring, and load balancing for home inverters and backup batteries.",
    price: 499,
    originalPrice: 699,
    durationLabel: "45-60 mins",
    imageUrl: "/images/workers/electrician.jpg"
  },
  {
    id: 104,
    category: "electrician",
    iconKey: "electrician",
    name: "Ceiling Fan / Chandelier Hanging",
    description: "Secure ceiling hook installation, rod assembly, wiring, and speed regulator connection.",
    price: 199,
    originalPrice: 299,
    durationLabel: "30 mins",
    imageUrl: "/images/workers/electrician.jpg"
  },
  {
    id: 105,
    category: "electrician",
    iconKey: "electrician",
    name: "Complete MCB / Distribution Board Repair",
    description: "Full circuit breaker check, phase balancing, neutral link tightening, and burnt wire replacement.",
    price: 349,
    originalPrice: 499,
    durationLabel: "45 mins",
    imageUrl: "/images/workers/electrician.jpg"
  },

  // --- PLUMBER ---
  {
    id: 201,
    category: "plumber",
    iconKey: "plumber",
    name: "Expert Plumber Diagnostic Visit",
    description: "Comprehensive inspection of internal concealed leaks, low water pressure, and pipe blockages.",
    price: 199,
    originalPrice: 299,
    durationLabel: "30 mins",
    imageUrl: "/images/workers/plumber.jpg"
  },
  {
    id: 202,
    category: "plumber",
    iconKey: "plumber",
    name: "Tap, Basin Mixer & Shower Fitting",
    description: "Installation or leak repair for kitchen sink faucets, wall mixers, overhead showers, and health faucets.",
    price: 249,
    originalPrice: 349,
    durationLabel: "30-45 mins",
    imageUrl: "/images/workers/plumber.jpg"
  },
  {
    id: 203,
    category: "plumber",
    iconKey: "plumber",
    name: "Toilet Flush Cistern & Commode Repair",
    description: "Fixing continuous water overflow, flush syphon replacement, commode re-sealing, and jet spray install.",
    price: 399,
    originalPrice: 549,
    durationLabel: "45-60 mins",
    imageUrl: "/images/workers/plumber.jpg"
  },
  {
    id: 204,
    category: "plumber",
    iconKey: "plumber",
    name: "Water Motor Pump & Pipeline Connection",
    description: "Submersible / monoblock motor piping, foot-valve installation, CPVC jointing, and check-valve setup.",
    price: 599,
    originalPrice: 799,
    durationLabel: "60-90 mins",
    imageUrl: "/images/workers/plumber.jpg"
  },
  {
    id: 205,
    category: "plumber",
    iconKey: "plumber",
    name: "Bathroom & Kitchen Drain Unclogging",
    description: "High-pressure mechanical snake clearing for choked floor traps, grease traps, and waste pipes.",
    price: 349,
    originalPrice: 499,
    durationLabel: "40 mins",
    imageUrl: "/images/workers/plumber.jpg"
  },

  // --- DAILY WORKERS & HELPERS ---
  {
    id: 301,
    category: "daily_worker",
    iconKey: "daily_worker",
    name: "Daily Wage Helper (Half Day - 4 Hours)",
    description: "Reliable helper for household chores, garden digging, sorting, moving, and general manual tasks.",
    price: 450,
    originalPrice: 550,
    durationLabel: "4 hours",
    imageUrl: "/images/workers/daily_workers.jpg"
  },
  {
    id: 302,
    category: "daily_worker",
    iconKey: "daily_worker",
    name: "Daily Wage Helper (Full Day - 8 Hours)",
    description: "Hardworking full-day helper for commercial warehouses, home shifting support, or property cleanup.",
    price: 750,
    originalPrice: 900,
    durationLabel: "8 hours",
    imageUrl: "/images/workers/daily_workers.jpg"
  },
  {
    id: 303,
    category: "daily_worker",
    iconKey: "daily_worker",
    name: "House Shifting & Heavy Goods Loader",
    description: "Experienced loader for carefully carrying heavy furniture, almirahs, appliances, and luggage.",
    price: 599,
    originalPrice: 799,
    durationLabel: "Per worker",
    imageUrl: "/images/workers/daily_workers.jpg"
  },
  {
    id: 304,
    category: "daily_worker",
    iconKey: "daily_worker",
    name: "Garden Soil Digging & Compound Clearing",
    description: "Ground leveling, heavy grass cutting, mud excavation, and debris removal helper.",
    price: 499,
    originalPrice: 650,
    durationLabel: "Half day",
    imageUrl: "/images/workers/daily_workers.jpg"
  },

  // --- CONSTRUCTION WORKER ---
  {
    id: 401,
    category: "construction",
    iconKey: "construction",
    name: "Construction Site Labor (Full Day)",
    description: "Trained site labor for shuttering support, material transport, sand/gravel carrying, and concrete mixing.",
    price: 800,
    originalPrice: 950,
    durationLabel: "8 hours",
    imageUrl: "/images/workers/construction.jpg"
  },
  {
    id: 402,
    category: "construction",
    iconKey: "construction",
    name: "Concrete Mixing & Shuttering Assistant",
    description: "Skilled handling of iron rebar ties, shuttering wood placement, and cement concrete pouring.",
    price: 850,
    originalPrice: 1000,
    durationLabel: "8 hours",
    imageUrl: "/images/workers/construction.jpg"
  },
  {
    id: 403,
    category: "construction",
    iconKey: "construction",
    name: "Site Contractor Inspection & Estimation",
    description: "On-site civil engineer / supervisor assessment for renovation, floor addition, or structural repairs.",
    price: 499,
    originalPrice: 700,
    durationLabel: "Site visit",
    imageUrl: "/images/workers/construction.jpg"
  },
  {
    id: 404,
    category: "construction",
    iconKey: "construction",
    name: "Demolition & Debris Removal Labor",
    description: "Safe demolition of non-load-bearing partition walls, tiles, and old plaster with quick debris disposal.",
    price: 899,
    originalPrice: 1100,
    durationLabel: "Full day",
    imageUrl: "/images/workers/construction.jpg"
  },

  // --- CARPENTER ---
  {
    id: 501,
    category: "carpenter",
    iconKey: "carpenter",
    name: "Master Carpenter Inspection & Repair Visit",
    description: "General woodworking repairs, misaligned cabinet doors, squeaky hinges, and minor alterations.",
    price: 299,
    originalPrice: 399,
    durationLabel: "45 mins",
    imageUrl: "/images/workers/carpenter.jpg"
  },
  {
    id: 502,
    category: "carpenter",
    iconKey: "carpenter",
    name: "Door Lock, Mortise Handle & Latch Install",
    description: "Precision chiseling and mounting for main door locks, Godrej locks, tower bolts, and hydraulic door closers.",
    price: 249,
    originalPrice: 349,
    durationLabel: "30-45 mins",
    imageUrl: "/images/workers/carpenter.jpg"
  },
  {
    id: 503,
    category: "carpenter",
    iconKey: "carpenter",
    name: "Furniture Repair & Joint Reinforcement",
    description: "Restoration of shaky wooden dining tables, bed frames, wooden chairs, and drawer sliding channels.",
    price: 399,
    originalPrice: 550,
    durationLabel: "60 mins",
    imageUrl: "/images/workers/carpenter.jpg"
  },
  {
    id: 504,
    category: "carpenter",
    iconKey: "carpenter",
    name: "Bed & Modular Wardrobe Dismantling / Assembly",
    description: "Careful unbolting and reassembly of engineered wood hydraulic beds, 3-door wardrobes, and modular desks.",
    price: 699,
    originalPrice: 950,
    durationLabel: "60-90 mins",
    imageUrl: "/images/workers/carpenter.jpg"
  },
  {
    id: 505,
    category: "carpenter",
    iconKey: "carpenter",
    name: "Custom Woodwork & Master Carpenter (Full Day)",
    description: "Dedicated master carpenter for custom wooden shelving, kitchen woodwork, and full-day carpentry projects.",
    price: 1100,
    originalPrice: 1350,
    durationLabel: "8 hours",
    imageUrl: "/images/workers/carpenter.jpg"
  },

  // --- MASON (RAJMISTRI) ---
  {
    id: 601,
    category: "mason",
    iconKey: "mason",
    name: "Master Mason / Rajmistri (Full Day - 8 Hours)",
    description: "Experienced head mason for brick masonry, lintel casting, plastering, and architectural masonry work.",
    price: 1100,
    originalPrice: 1300,
    durationLabel: "8 hours",
    imageUrl: "/images/workers/mason.jpg"
  },
  {
    id: 602,
    category: "mason",
    iconKey: "mason",
    name: "Bricklaying & Wall Construction (100 Sq Ft)",
    description: "Precision red brick or AAC block alignment with standard cement-sand mortar and plumb check.",
    price: 1499,
    originalPrice: 1850,
    durationLabel: "1-2 days",
    imageUrl: "/images/workers/mason.jpg"
  },
  {
    id: 603,
    category: "mason",
    iconKey: "mason",
    name: "Plastering & Cement Crack Patch Repair",
    description: "Smooth cement plaster application for uneven walls, peeling surfaces, water-damaged patches, and corners.",
    price: 699,
    originalPrice: 899,
    durationLabel: "Half day",
    imageUrl: "/images/workers/mason.jpg"
  },
  {
    id: 604,
    category: "mason",
    iconKey: "mason",
    name: "Floor & Wall Tile Laying / Replacement",
    description: "Skilled tiler for vitrified floor tiles, bathroom wall tiles, granite kitchen counter edges, and epoxy grouting.",
    price: 899,
    originalPrice: 1150,
    durationLabel: "Per area",
    imageUrl: "/images/workers/mason.jpg"
  },

  // --- PAINTER ---
  {
    id: 701,
    category: "painter",
    iconKey: "painting",
    name: "Master House Painter (Full Day)",
    description: "Skilled interior and exterior wall painter with roll & brush expertise, surface sanding, and masking.",
    price: 950,
    originalPrice: 1200,
    durationLabel: "8 hours",
    imageUrl: "/images/workers/painter.jpg"
  },
  {
    id: 702,
    category: "painter",
    iconKey: "painting",
    name: "1 BHK Interior Wall Fresh Painting",
    description: "Two coats of premium emulsion paint with minor putty touch-ups for 1 BHK flats and apartments.",
    price: 3499,
    originalPrice: 4200,
    durationLabel: "1-2 days",
    imageUrl: "/images/workers/painter.jpg"
  },
  {
    id: 703,
    category: "painter",
    iconKey: "painting",
    name: "Wall Putty, Primer & Sanding (Per Room)",
    description: "Full wall preparation with two coats of Birla/Asian acrylic putty and smooth orbital sanding.",
    price: 1299,
    originalPrice: 1600,
    durationLabel: "1 day",
    imageUrl: "/images/workers/painter.jpg"
  },
  {
    id: 704,
    category: "painter",
    iconKey: "painting",
    name: "Waterproofing & Anti-Damp Wall Treatment",
    description: "Chemical damp-proof barrier application to stop seepage, paint peeling, and white salt efflorescence.",
    price: 899,
    originalPrice: 1199,
    durationLabel: "Per wall",
    imageUrl: "/images/workers/painter.jpg"
  },

  // --- AC & APPLIANCES ---
  {
    id: 8,
    category: "ac",
    iconKey: "ac",
    name: "AC Deep Jet Servicing",
    description: "High-pressure foam jet coil wash, blower cleaning, drain tray flushing, and gas pressure test.",
    price: 499,
    originalPrice: 649,
    durationLabel: "45 mins"
  },
  {
    id: 10,
    category: "ac",
    iconKey: "ac",
    name: "AC Refrigerant Gas Refilling",
    description: "Complete leak identification, vacuum purge, and 100% genuine R32/R410A gas filling.",
    price: 2099,
    originalPrice: 2500,
    durationLabel: "60 mins"
  },
  {
    id: 11,
    category: "ac",
    iconKey: "ac",
    name: "Split AC Installation / Uninstallation",
    description: "Professional indoor & outdoor unit bracket mounting, copper pipe flare connection, and testing.",
    price: 1399,
    originalPrice: 1699,
    durationLabel: "60-90 mins"
  },

  // --- TANK WASH ---
  {
    id: 3,
    category: "tank",
    iconKey: "tank",
    name: "Sintex Overhead Tank Wash (500L - 1000L)",
    description: "Mechanical sludge extraction, high-pressure rotary scrubbing, UV sanitization, and antibacterial spray.",
    price: 499,
    originalPrice: 699,
    durationLabel: "45-60 mins"
  },
  {
    id: 5,
    category: "tank",
    iconKey: "tank",
    name: "Underground Water Reservoir Deep Wash",
    description: "Submersible pump dewatering, heavy algae wall scrub, bleaching powder wash, and bacterial disinfection.",
    price: 2500,
    originalPrice: 3200,
    durationLabel: "2-3 hours"
  },

  // --- DEEP CLEANING & TOILET ---
  {
    id: 17,
    category: "deep",
    iconKey: "home",
    name: "Complete Home Deep Cleaning (2 BHK)",
    description: "Full flat sanitization: 2 bathrooms, kitchen chimney exterior, balcony, windows, doors, and mechanized floor buffing.",
    price: 2299,
    originalPrice: 2899,
    durationLabel: "3-4 hours"
  },
  {
    id: 1,
    category: "toilet",
    iconKey: "bathroom",
    name: "Intense Bathroom & Toilet Descaling",
    description: "Deep chemical descaling of hard water stains from tiles, glass partitions, taps, and sanitaryware.",
    price: 399,
    originalPrice: 499,
    durationLabel: "45 mins"
  }
];

export const searchTerms = [
  "Electrician",
  "Plumber",
  "Daily Worker",
  "Helper",
  "Construction Worker",
  "Carpenter",
  "Mason",
  "Rajmistri",
  "House Painter",
  "AC Repair"
];

export const quickServices: Array<{ label: string; iconKey: ServiceIconKey; badge?: string; category: ServiceCategoryId }> = [
  { label: "Electrician", iconKey: "electrician", badge: "Fast Match", category: "electrician" },
  { label: "Plumber", iconKey: "plumber", badge: "30 Mins", category: "plumber" },
  { label: "Daily Workers", iconKey: "daily_worker", badge: "Daily Wage", category: "daily_worker" },
  { label: "Construction", iconKey: "construction", badge: "Skilled", category: "construction" },
  { label: "Carpenter", iconKey: "carpenter", badge: "Artisan", category: "carpenter" },
  { label: "Mason (Rajmistri)", iconKey: "mason", badge: "Master", category: "mason" },
  { label: "Painter", iconKey: "painting", badge: "Top Rated", category: "painter" },
  { label: "AC Repair", iconKey: "ac", badge: "Same Day", category: "ac" },
  { label: "Tank Wash", iconKey: "tank", category: "tank" },
  { label: "Deep Clean", iconKey: "home", category: "deep" },
  { label: "Toilet & Bath", iconKey: "bathroom", category: "toilet" },
  { label: "Security", iconKey: "security", category: "security" }
];

export const toiletBathDetailServices: ServiceItem[] = [
  {
    id: "bath-combo-1",
    category: "toilet",
    iconKey: "bathroom",
    groupLabel: "Bathroom Cleaning",
    name: "One attached toilet and bathroom cleaning",
    description: "Complete cleaning for one attached toilet and bathroom.",
    price: 699,
    imageUrl: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500&q=85&fit=crop&crop=center"
  },
  {
    id: "bath-combo-2",
    category: "toilet",
    iconKey: "bathroom",
    groupLabel: "Bathroom Cleaning",
    name: "Two attached toilet and bathroom cleaning",
    description: "Combo cleaning for two attached toilets and bathrooms.",
    price: 1188.3,
    priceLabel: "1188.3",
    originalPrice: 1398,
    discountLabel: "15% discount",
    imageUrl: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?w=500&q=85&fit=crop&crop=center"
  },
  {
    id: "bath-combo-3",
    category: "toilet",
    iconKey: "bathroom",
    groupLabel: "Bathroom Cleaning",
    name: "Three attached toilet and bathroom cleaning",
    description: "Combo cleaning for three attached toilets and bathrooms.",
    price: 1572.7,
    priceLabel: "1572.7",
    originalPrice: 2097,
    discountLabel: "25% discount",
    imageUrl: "https://images.unsplash.com/photo-1564540586988-aa4e53c3d799?w=500&q=85&fit=crop&crop=center"
  }
];
