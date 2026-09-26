export type DefaultCategorySeed = {
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
};

export type DefaultServiceSeed = {
  categorySlug: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  basePrice: number;
  originalPrice?: number;
  durationMin?: number;
  sortOrder: number;
  groupLabel?: string;
  priceLabel?: string;
  originalPriceLabel?: string;
  discountLabel?: string;
};

export const defaultCategories: DefaultCategorySeed[] = [
  { name: "Electrician", slug: "electrician", description: "Wiring, short circuits, switchboards, MCB, inverter, and electrical installations.", sortOrder: 1 },
  { name: "Plumber", slug: "plumber", description: "Diagnostic visits, leaks, taps, commode, pump piping, and drain unclogging.", sortOrder: 2 },
  { name: "Daily Workers & Helpers", slug: "daily-worker", description: "Half-day and full-day manual labor, loading, shifting, and ground clearing.", sortOrder: 3 },
  { name: "Construction Worker", slug: "construction", description: "Site labor, concrete mixing, shuttering support, and debris removal.", sortOrder: 4 },
  { name: "Carpenter", slug: "carpenter", description: "Furniture repairs, lock installation, door alignment, and custom woodwork.", sortOrder: 5 },
  { name: "Mason (Rajmistri)", slug: "mason", description: "Brick masonry, wall construction, cement plastering, and tile laying.", sortOrder: 6 },
  { name: "Painter", slug: "painter", description: "Master house painters, full flat painting, putty, and damp waterproofing.", sortOrder: 7 },
  { name: "AC & Appliances", slug: "ac-repair", description: "AC deep foam jet servicing, gas filling, and unit installation.", sortOrder: 8 },
  { name: "Deep Clean", slug: "deep-clean", description: "Complete home, flat, and room deep cleaning packages.", sortOrder: 9 },
  { name: "Tank Wash", slug: "tank-wash", description: "Overhead and underground water tank deep wash packages.", sortOrder: 10 },
  { name: "Toilet & Bath", slug: "toilet-bath", description: "Toilet, bathroom, and hard water descaling packages.", sortOrder: 11 },
  { name: "Sofa Clean", slug: "sofa-clean", description: "Sofa, couch, upholstery, and fabric cleaning.", sortOrder: 12 },
  { name: "Kitchen & Appliances", slug: "kitchen-appliances", description: "Kitchen, chimney, and appliance cleaning services.", sortOrder: 13 },
  { name: "Aya and Housemaid", slug: "aya-housemaid", description: "Maid, aya, baby care, and patient care services.", sortOrder: 14 },
  { name: "Pest Control", slug: "pest-control", description: "Pest control packages for homes and commercial spaces.", sortOrder: 15 },
  { name: "Saloon & Spa", slug: "saloon-spa", description: "Salon, spa, grooming, and massage services.", sortOrder: 16 },
  { name: "Security Guard", slug: "security", description: "Uniformed security guard and facility management services.", sortOrder: 17 }
];

export const defaultServices: DefaultServiceSeed[] = [
  // --- ELECTRICIAN ---
  {
    categorySlug: "electrician",
    name: "Licensed Electrician General Visit",
    slug: "licensed-electrician-general-visit",
    description: "Doorstep diagnostic & inspection for power trips, short circuits, voltage issues, and general repairs.",
    icon: "electrician",
    basePrice: 199,
    originalPrice: 299,
    durationMin: 40,
    sortOrder: 1
  },
  {
    categorySlug: "electrician",
    name: "Switchboard & Socket Installation / Fix",
    slug: "switchboard-socket-installation-fix",
    description: "Replacement and wiring of modular switchboards, high-power 16A sockets, and isolators.",
    icon: "electrician",
    basePrice: 149,
    originalPrice: 199,
    durationMin: 30,
    sortOrder: 2
  },
  {
    categorySlug: "electrician",
    name: "Inverter & Battery Wiring Setup",
    slug: "inverter-battery-wiring-setup",
    description: "Safe installation, wiring, and load balancing for home inverters and backup batteries.",
    icon: "electrician",
    basePrice: 499,
    originalPrice: 699,
    durationMin: 60,
    sortOrder: 3
  },
  {
    categorySlug: "electrician",
    name: "Ceiling Fan / Chandelier Hanging",
    slug: "ceiling-fan-chandelier-hanging",
    description: "Secure ceiling hook installation, rod assembly, wiring, and speed regulator connection.",
    icon: "electrician",
    basePrice: 199,
    originalPrice: 299,
    durationMin: 30,
    sortOrder: 4
  },
  {
    categorySlug: "electrician",
    name: "Complete MCB / Distribution Board Repair",
    slug: "complete-mcb-distribution-board-repair",
    description: "Full circuit breaker check, phase balancing, neutral link tightening, and burnt wire replacement.",
    icon: "electrician",
    basePrice: 349,
    originalPrice: 499,
    durationMin: 45,
    sortOrder: 5
  },

  // --- PLUMBER ---
  {
    categorySlug: "plumber",
    name: "Expert Plumber Diagnostic Visit",
    slug: "expert-plumber-diagnostic-visit",
    description: "Comprehensive inspection of internal concealed leaks, low water pressure, and pipe blockages.",
    icon: "plumber",
    basePrice: 199,
    originalPrice: 299,
    durationMin: 30,
    sortOrder: 6
  },
  {
    categorySlug: "plumber",
    name: "Tap, Basin Mixer & Shower Fitting",
    slug: "tap-basin-mixer-shower-fitting",
    description: "Installation or leak repair for kitchen sink faucets, wall mixers, overhead showers, and health faucets.",
    icon: "plumber",
    basePrice: 249,
    originalPrice: 349,
    durationMin: 40,
    sortOrder: 7
  },
  {
    categorySlug: "plumber",
    name: "Toilet Flush Cistern & Commode Repair",
    slug: "toilet-flush-cistern-commode-repair",
    description: "Fixing continuous water overflow, flush syphon replacement, commode re-sealing, and jet spray install.",
    icon: "plumber",
    basePrice: 399,
    originalPrice: 549,
    durationMin: 60,
    sortOrder: 8
  },
  {
    categorySlug: "plumber",
    name: "Water Motor Pump & Pipeline Connection",
    slug: "water-motor-pump-pipeline-connection",
    description: "Submersible / monoblock motor piping, foot-valve installation, CPVC jointing, and check-valve setup.",
    icon: "plumber",
    basePrice: 599,
    originalPrice: 799,
    durationMin: 90,
    sortOrder: 9
  },
  {
    categorySlug: "plumber",
    name: "Bathroom & Kitchen Drain Unclogging",
    slug: "bathroom-kitchen-drain-unclogging",
    description: "High-pressure mechanical snake clearing for choked floor traps, grease traps, and waste pipes.",
    icon: "plumber",
    basePrice: 349,
    originalPrice: 499,
    durationMin: 40,
    sortOrder: 10
  },

  // --- DAILY WORKERS & HELPERS ---
  {
    categorySlug: "daily-worker",
    name: "Daily Wage Helper (Half Day - 4 Hours)",
    slug: "daily-wage-helper-half-day",
    description: "Reliable helper for household chores, garden digging, sorting, moving, and general manual tasks.",
    icon: "daily_worker",
    basePrice: 450,
    originalPrice: 550,
    durationMin: 240,
    sortOrder: 11
  },
  {
    categorySlug: "daily-worker",
    name: "Daily Wage Helper (Full Day - 8 Hours)",
    slug: "daily-wage-helper-full-day",
    description: "Hardworking full-day helper for commercial warehouses, home shifting support, or property cleanup.",
    icon: "daily_worker",
    basePrice: 750,
    originalPrice: 900,
    durationMin: 480,
    sortOrder: 12
  },
  {
    categorySlug: "daily-worker",
    name: "House Shifting & Heavy Goods Loader",
    slug: "house-shifting-heavy-goods-loader",
    description: "Experienced loader for carefully carrying heavy furniture, almirahs, appliances, and luggage.",
    icon: "daily_worker",
    basePrice: 599,
    originalPrice: 799,
    durationMin: 180,
    sortOrder: 13
  },
  {
    categorySlug: "daily-worker",
    name: "Garden Soil Digging & Compound Clearing",
    slug: "garden-soil-digging-compound-clearing",
    description: "Ground leveling, heavy grass cutting, mud excavation, and debris removal helper.",
    icon: "daily_worker",
    basePrice: 499,
    originalPrice: 650,
    durationMin: 240,
    sortOrder: 14
  },

  // --- CONSTRUCTION WORKER ---
  {
    categorySlug: "construction",
    name: "Construction Site Labor (Full Day)",
    slug: "construction-site-labor-full-day",
    description: "Trained site labor for shuttering support, material transport, sand/gravel carrying, and concrete mixing.",
    icon: "construction",
    basePrice: 800,
    originalPrice: 950,
    durationMin: 480,
    sortOrder: 15
  },
  {
    categorySlug: "construction",
    name: "Concrete Mixing & Shuttering Assistant",
    slug: "concrete-mixing-shuttering-assistant",
    description: "Skilled handling of iron rebar ties, shuttering wood placement, and cement concrete pouring.",
    icon: "construction",
    basePrice: 850,
    originalPrice: 1000,
    durationMin: 480,
    sortOrder: 16
  },
  {
    categorySlug: "construction",
    name: "Site Contractor Inspection & Estimation",
    slug: "site-contractor-inspection-estimation",
    description: "On-site civil engineer / supervisor assessment for renovation, floor addition, or structural repairs.",
    icon: "construction",
    basePrice: 499,
    originalPrice: 700,
    durationMin: 60,
    sortOrder: 17
  },
  {
    categorySlug: "construction",
    name: "Demolition & Debris Removal Labor",
    slug: "demolition-debris-removal-labor",
    description: "Safe demolition of non-load-bearing partition walls, tiles, and old plaster with quick debris disposal.",
    icon: "construction",
    basePrice: 899,
    originalPrice: 1100,
    durationMin: 480,
    sortOrder: 18
  },

  // --- CARPENTER ---
  {
    categorySlug: "carpenter",
    name: "Master Carpenter Inspection & Repair Visit",
    slug: "master-carpenter-inspection-repair-visit",
    description: "General woodworking repairs, misaligned cabinet doors, squeaky hinges, and minor alterations.",
    icon: "carpenter",
    basePrice: 299,
    originalPrice: 399,
    durationMin: 45,
    sortOrder: 19
  },
  {
    categorySlug: "carpenter",
    name: "Door Lock, Mortise Handle & Latch Install",
    slug: "door-lock-mortise-handle-latch-install",
    description: "Precision chiseling and mounting for main door locks, Godrej locks, tower bolts, and hydraulic door closers.",
    icon: "carpenter",
    basePrice: 249,
    originalPrice: 349,
    durationMin: 45,
    sortOrder: 20
  },
  {
    categorySlug: "carpenter",
    name: "Furniture Repair & Joint Reinforcement",
    slug: "furniture-repair-joint-reinforcement",
    description: "Restoration of shaky wooden dining tables, bed frames, wooden chairs, and drawer sliding channels.",
    icon: "carpenter",
    basePrice: 399,
    originalPrice: 550,
    durationMin: 60,
    sortOrder: 21
  },
  {
    categorySlug: "carpenter",
    name: "Bed & Modular Wardrobe Dismantling / Assembly",
    slug: "bed-wardrobe-dismantling-assembly",
    description: "Careful unbolting and reassembly of engineered wood hydraulic beds, 3-door wardrobes, and modular desks.",
    icon: "carpenter",
    basePrice: 699,
    originalPrice: 950,
    durationMin: 90,
    sortOrder: 22
  },
  {
    categorySlug: "carpenter",
    name: "Custom Woodwork & Master Carpenter (Full Day)",
    slug: "custom-woodwork-master-carpenter-full-day",
    description: "Dedicated master carpenter for custom wooden shelving, kitchen woodwork, and full-day carpentry projects.",
    icon: "carpenter",
    basePrice: 1100,
    originalPrice: 1350,
    durationMin: 480,
    sortOrder: 23
  },

  // --- MASON (RAJMISTRI) ---
  {
    categorySlug: "mason",
    name: "Master Mason / Rajmistri (Full Day - 8 Hours)",
    slug: "master-mason-rajmistri-full-day",
    description: "Experienced head mason for brick masonry, lintel casting, plastering, and architectural masonry work.",
    icon: "mason",
    basePrice: 1100,
    originalPrice: 1300,
    durationMin: 480,
    sortOrder: 24
  },
  {
    categorySlug: "mason",
    name: "Bricklaying & Wall Construction (100 Sq Ft)",
    slug: "bricklaying-wall-construction",
    description: "Precision red brick or AAC block alignment with standard cement-sand mortar and plumb check.",
    icon: "mason",
    basePrice: 1499,
    originalPrice: 1850,
    durationMin: 480,
    sortOrder: 25
  },
  {
    categorySlug: "mason",
    name: "Plastering & Cement Crack Patch Repair",
    slug: "plastering-cement-crack-patch-repair",
    description: "Smooth cement plaster application for uneven walls, peeling surfaces, water-damaged patches, and corners.",
    icon: "mason",
    basePrice: 699,
    originalPrice: 899,
    durationMin: 240,
    sortOrder: 26
  },
  {
    categorySlug: "mason",
    name: "Floor & Wall Tile Laying / Replacement",
    slug: "floor-wall-tile-laying-replacement",
    description: "Skilled tiler for vitrified floor tiles, bathroom wall tiles, granite kitchen counter edges, and epoxy grouting.",
    icon: "mason",
    basePrice: 899,
    originalPrice: 1150,
    durationMin: 240,
    sortOrder: 27
  },

  // --- PAINTER ---
  {
    categorySlug: "painter",
    name: "Master House Painter (Full Day)",
    slug: "master-house-painter-full-day",
    description: "Skilled interior and exterior wall painter with roll & brush expertise, surface sanding, and masking.",
    icon: "painting",
    basePrice: 950,
    originalPrice: 1200,
    durationMin: 480,
    sortOrder: 28
  },
  {
    categorySlug: "painter",
    name: "1 BHK Interior Wall Fresh Painting",
    slug: "1-bhk-interior-wall-fresh-painting",
    description: "Two coats of premium emulsion paint with minor putty touch-ups for 1 BHK flats and apartments.",
    icon: "painting",
    basePrice: 3499,
    originalPrice: 4200,
    durationMin: 480,
    sortOrder: 29
  },
  {
    categorySlug: "painter",
    name: "Wall Putty, Primer & Sanding (Per Room)",
    slug: "wall-putty-primer-sanding",
    description: "Full wall preparation with two coats of Birla/Asian acrylic putty and smooth orbital sanding.",
    icon: "painting",
    basePrice: 1299,
    originalPrice: 1600,
    durationMin: 480,
    sortOrder: 30
  },
  {
    categorySlug: "painter",
    name: "Waterproofing & Anti-Damp Wall Treatment",
    slug: "waterproofing-anti-damp-wall-treatment",
    description: "Chemical damp-proof barrier application to stop seepage, paint peeling, and white salt efflorescence.",
    icon: "painting",
    basePrice: 899,
    originalPrice: 1199,
    durationMin: 240,
    sortOrder: 31
  },

  // --- AC & APPLIANCES ---
  {
    categorySlug: "ac-repair",
    name: "AC Deep Jet Servicing",
    slug: "ac-deep-jet-servicing",
    description: "High-pressure foam jet coil wash, blower cleaning, drain tray flushing, and gas pressure test.",
    icon: "ac",
    basePrice: 499,
    originalPrice: 649,
    durationMin: 45,
    sortOrder: 32
  },
  {
    categorySlug: "ac-repair",
    name: "AC Refrigerant Gas Refilling",
    slug: "ac-refrigerant-gas-refilling",
    description: "Complete leak identification, vacuum purge, and 100% genuine R32/R410A gas filling.",
    icon: "ac",
    basePrice: 2099,
    originalPrice: 2500,
    durationMin: 60,
    sortOrder: 33
  },
  {
    categorySlug: "ac-repair",
    name: "Split AC Installation / Uninstallation",
    slug: "split-ac-installation-uninstallation",
    description: "Professional indoor & outdoor unit bracket mounting, copper pipe flare connection, and testing.",
    icon: "ac",
    basePrice: 1399,
    originalPrice: 1699,
    durationMin: 90,
    sortOrder: 34
  },

  // --- TANK WASH ---
  {
    categorySlug: "tank-wash",
    name: "Sintex Overhead Tank Wash (500L - 1000L)",
    slug: "sintex-overhead-tank-wash",
    description: "Mechanical sludge extraction, high-pressure rotary scrubbing, UV sanitization, and antibacterial spray.",
    icon: "tank",
    basePrice: 499,
    originalPrice: 699,
    durationMin: 60,
    sortOrder: 35
  },
  {
    categorySlug: "tank-wash",
    name: "Underground Water Reservoir Deep Wash",
    slug: "underground-water-reservoir-deep-wash",
    description: "Submersible pump dewatering, heavy algae wall scrub, bleaching powder wash, and bacterial disinfection.",
    icon: "tank",
    basePrice: 2500,
    originalPrice: 3200,
    durationMin: 150,
    sortOrder: 36
  },

  // --- DEEP CLEAN ---
  {
    categorySlug: "deep-clean",
    name: "Complete Home Deep Cleaning (2 BHK)",
    slug: "complete-home-deep-cleaning-2-bhk",
    description: "Full flat sanitization: 2 bathrooms, kitchen chimney exterior, balcony, windows, doors, and mechanized floor buffing.",
    icon: "home",
    basePrice: 2299,
    originalPrice: 2899,
    durationMin: 210,
    sortOrder: 37
  },
  {
    categorySlug: "deep-clean",
    name: "Deep Home Cleaning - 1 BHK",
    slug: "deep-home-cleaning-1-bhk",
    description: "Full 1BHK home deep cleaning including 1 bathroom, kitchen, room, balcony, and floor scrubbing.",
    icon: "home",
    basePrice: 1799,
    originalPrice: 2299,
    durationMin: 180,
    sortOrder: 38
  },

  // --- TOILET & BATH ---
  {
    categorySlug: "toilet-bath",
    name: "Bathroom Deep Cleaning",
    slug: "bathroom-deep-cleaning",
    description: "Tiles, sink, toilet, mirror, fixtures, and floor sanitization.",
    icon: "bathroom",
    basePrice: 299,
    originalPrice: 399,
    durationMin: 60,
    sortOrder: 39
  },
  {
    categorySlug: "toilet-bath",
    name: "Intense Bathroom & Toilet Descaling",
    slug: "intense-bathroom-toilet-descaling",
    description: "Deep chemical descaling of hard water stains from tiles, glass partitions, taps, and sanitaryware.",
    icon: "bathroom",
    basePrice: 399,
    originalPrice: 499,
    durationMin: 45,
    sortOrder: 40
  },
  {
    categorySlug: "toilet-bath",
    name: "Two attached toilet and bathroom cleaning",
    slug: "two-attached-toilet-bathroom-cleaning",
    description: "Combo cleaning for two attached toilets and bathrooms.",
    icon: "bathroom",
    basePrice: 1188,
    groupLabel: "Bathroom Cleaning",
    priceLabel: "1188.3",
    originalPrice: 1398,
    originalPriceLabel: "1398",
    discountLabel: "15% discount",
    durationMin: 90,
    sortOrder: 41
  },

  // --- SOFA CLEAN ---
  {
    categorySlug: "sofa-clean",
    name: "3-Seater Fabric Sofa Deep Shampoo & Extraction",
    slug: "3-seater-sofa-cleaning",
    description: "High suction foam extraction shampooing removing deep dirt, mites, and food stains.",
    icon: "sofa",
    basePrice: 599,
    originalPrice: 799,
    durationMin: 60,
    sortOrder: 42
  },

  // --- KITCHEN & APPLIANCES ---
  {
    categorySlug: "kitchen-appliances",
    name: "Kitchen Chimney Deep Degreasing",
    slug: "kitchen-chimney-deep-degreasing",
    description: "Complete baffle filter degreasing, motor exterior cleanup, and grease tray chemical soak.",
    icon: "kitchen",
    basePrice: 699,
    originalPrice: 899,
    durationMin: 60,
    sortOrder: 43
  },

  // --- AYA & HOUSEMAID ---
  {
    categorySlug: "aya-housemaid",
    name: "Monthly Full-Time / Part-Time Maid Screening",
    slug: "maid-screening-booking",
    description: "Background-checked maid matching for cooking, sweeping, mopping, and home assistance.",
    icon: "cleaning",
    basePrice: 499,
    originalPrice: 699,
    durationMin: 60,
    sortOrder: 44
  },

  // --- PEST CONTROL ---
  {
    categorySlug: "pest-control",
    name: "General Pest & Cockroach Gel Treatment",
    slug: "general-pest-cockroach-treatment",
    description: "Odorless herbal Bayer gel dots in kitchen corners and drain spray for cockroach eradication.",
    icon: "pest",
    basePrice: 699,
    originalPrice: 899,
    durationMin: 45,
    sortOrder: 45
  },

  // --- SALOON & SPA ---
  {
    categorySlug: "saloon-spa",
    name: "Men's Grooming Haircut & Beard Styling",
    slug: "mens-grooming-haircut-beard",
    description: "Hygienic doorstep haircut, beard shaping, and refreshing scalp massage.",
    icon: "salon",
    basePrice: 299,
    originalPrice: 399,
    durationMin: 45,
    sortOrder: 46
  },

  // --- SECURITY ---
  {
    categorySlug: "security",
    name: "Uniformed Security Guard (8-Hour Shift)",
    slug: "uniformed-security-guard-8-hour",
    description: "Trained, disciplined security guard for apartment gatekeeping, visitor logs, and night vigil.",
    icon: "security",
    basePrice: 850,
    originalPrice: 1000,
    durationMin: 480,
    sortOrder: 47
  }
];
