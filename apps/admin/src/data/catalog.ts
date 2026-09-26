import type { Service, ServiceCategory } from "@the-wings/types";

export const initialCategories: ServiceCategory[] = [
  { id: "electrician", name: "Electrician", slug: "electrician", sortOrder: 1, isActive: true },
  { id: "plumber", name: "Plumber", slug: "plumber", sortOrder: 2, isActive: true },
  { id: "daily-worker", name: "Daily Workers & Helpers", slug: "daily-worker", sortOrder: 3, isActive: true },
  { id: "construction", name: "Construction Worker", slug: "construction", sortOrder: 4, isActive: true },
  { id: "carpenter", name: "Carpenter", slug: "carpenter", sortOrder: 5, isActive: true },
  { id: "mason", name: "Mason (Rajmistri)", slug: "mason", sortOrder: 6, isActive: true },
  { id: "painter", name: "Painter", slug: "painter", sortOrder: 7, isActive: true },
  { id: "ac-repair", name: "AC & Appliances", slug: "ac-repair", sortOrder: 8, isActive: true },
  { id: "deep-clean", name: "Deep Clean", slug: "deep-clean", sortOrder: 9, isActive: true },
  { id: "tank-wash", name: "Tank Wash", slug: "tank-wash", sortOrder: 10, isActive: true },
  { id: "toilet-bath", name: "Toilet & Bath", slug: "toilet-bath", sortOrder: 11, isActive: true },
  { id: "sofa-clean", name: "Sofa Clean", slug: "sofa-clean", sortOrder: 12, isActive: true },
  { id: "kitchen-appliances", name: "Kitchen & Appliances", slug: "kitchen-appliances", sortOrder: 13, isActive: true },
  { id: "aya-housemaid", name: "Aya and Housemaid", slug: "aya-housemaid", sortOrder: 14, isActive: true },
  { id: "pest-control", name: "Pest Control", slug: "pest-control", sortOrder: 15, isActive: true },
  { id: "saloon-spa", name: "Saloon & Spa", slug: "saloon-spa", sortOrder: 16, isActive: true },
  { id: "security", name: "Security Guard", slug: "security", sortOrder: 17, isActive: true }
];

export const initialServices: Service[] = [
  // --- ELECTRICIAN ---
  {
    id: "svc-elec-1",
    categoryId: "electrician",
    name: "Licensed Electrician General Visit",
    slug: "licensed-electrician-general-visit",
    description: "Doorstep diagnostic & inspection for power trips, short circuits, voltage issues, and general repairs.",
    icon: "electrician",
    basePrice: 199,
    originalPrice: 299,
    durationMin: 40,
    sortOrder: 1,
    isActive: true
  },
  {
    id: "svc-elec-2",
    categoryId: "electrician",
    name: "Switchboard & Socket Installation / Fix",
    slug: "switchboard-socket-installation-fix",
    description: "Replacement and wiring of modular switchboards, high-power 16A sockets, and isolators.",
    icon: "electrician",
    basePrice: 149,
    originalPrice: 199,
    durationMin: 30,
    sortOrder: 2,
    isActive: true
  },
  {
    id: "svc-elec-3",
    categoryId: "electrician",
    name: "Inverter & Battery Wiring Setup",
    slug: "inverter-battery-wiring-setup",
    description: "Safe installation, wiring, and load balancing for home inverters and backup batteries.",
    icon: "electrician",
    basePrice: 499,
    originalPrice: 699,
    durationMin: 60,
    sortOrder: 3,
    isActive: true
  },
  {
    id: "svc-elec-4",
    categoryId: "electrician",
    name: "Ceiling Fan / Chandelier Hanging",
    slug: "ceiling-fan-chandelier-hanging",
    description: "Secure ceiling hook installation, rod assembly, wiring, and speed regulator connection.",
    icon: "electrician",
    basePrice: 199,
    originalPrice: 299,
    durationMin: 30,
    sortOrder: 4,
    isActive: true
  },
  {
    id: "svc-elec-5",
    categoryId: "electrician",
    name: "Complete MCB / Distribution Board Repair",
    slug: "complete-mcb-distribution-board-repair",
    description: "Full circuit breaker check, phase balancing, neutral link tightening, and burnt wire replacement.",
    icon: "electrician",
    basePrice: 349,
    originalPrice: 499,
    durationMin: 45,
    sortOrder: 5,
    isActive: true
  },

  // --- PLUMBER ---
  {
    id: "svc-plumb-1",
    categoryId: "plumber",
    name: "Expert Plumber Diagnostic Visit",
    slug: "expert-plumber-diagnostic-visit",
    description: "Comprehensive inspection of internal concealed leaks, low water pressure, and pipe blockages.",
    icon: "plumber",
    basePrice: 199,
    originalPrice: 299,
    durationMin: 30,
    sortOrder: 6,
    isActive: true
  },
  {
    id: "svc-plumb-2",
    categoryId: "plumber",
    name: "Tap, Basin Mixer & Shower Fitting",
    slug: "tap-basin-mixer-shower-fitting",
    description: "Installation or leak repair for kitchen sink faucets, wall mixers, overhead showers, and health faucets.",
    icon: "plumber",
    basePrice: 249,
    originalPrice: 349,
    durationMin: 40,
    sortOrder: 7,
    isActive: true
  },
  {
    id: "svc-plumb-3",
    categoryId: "plumber",
    name: "Toilet Flush Cistern & Commode Repair",
    slug: "toilet-flush-cistern-commode-repair",
    description: "Fixing continuous water overflow, flush syphon replacement, commode re-sealing, and jet spray install.",
    icon: "plumber",
    basePrice: 399,
    originalPrice: 549,
    durationMin: 60,
    sortOrder: 8,
    isActive: true
  },
  {
    id: "svc-plumb-4",
    categoryId: "plumber",
    name: "Water Motor Pump & Pipeline Connection",
    slug: "water-motor-pump-pipeline-connection",
    description: "Submersible / monoblock motor piping, foot-valve installation, CPVC jointing, and check-valve setup.",
    icon: "plumber",
    basePrice: 599,
    originalPrice: 799,
    durationMin: 90,
    sortOrder: 9,
    isActive: true
  },
  {
    id: "svc-plumb-5",
    categoryId: "plumber",
    name: "Bathroom & Kitchen Drain Unclogging",
    slug: "bathroom-kitchen-drain-unclogging",
    description: "High-pressure mechanical snake clearing for choked floor traps, grease traps, and waste pipes.",
    icon: "plumber",
    basePrice: 349,
    originalPrice: 499,
    durationMin: 40,
    sortOrder: 10,
    isActive: true
  },

  // --- DAILY WORKERS & HELPERS ---
  {
    id: "svc-daily-1",
    categoryId: "daily-worker",
    name: "Daily Wage Helper (Half Day - 4 Hours)",
    slug: "daily-wage-helper-half-day",
    description: "Reliable helper for household chores, garden digging, sorting, moving, and general manual tasks.",
    icon: "daily_worker",
    basePrice: 450,
    originalPrice: 550,
    durationMin: 240,
    sortOrder: 11,
    isActive: true
  },
  {
    id: "svc-daily-2",
    categoryId: "daily-worker",
    name: "Daily Wage Helper (Full Day - 8 Hours)",
    slug: "daily-wage-helper-full-day",
    description: "Hardworking full-day helper for commercial warehouses, home shifting support, or property cleanup.",
    icon: "daily_worker",
    basePrice: 750,
    originalPrice: 900,
    durationMin: 480,
    sortOrder: 12,
    isActive: true
  },
  {
    id: "svc-daily-3",
    categoryId: "daily-worker",
    name: "House Shifting & Heavy Goods Loader",
    slug: "house-shifting-heavy-goods-loader",
    description: "Experienced loader for carefully carrying heavy furniture, almirahs, appliances, and luggage.",
    icon: "daily_worker",
    basePrice: 599,
    originalPrice: 799,
    durationMin: 180,
    sortOrder: 13,
    isActive: true
  },
  {
    id: "svc-daily-4",
    categoryId: "daily-worker",
    name: "Garden Soil Digging & Compound Clearing",
    slug: "garden-soil-digging-compound-clearing",
    description: "Ground leveling, heavy grass cutting, mud excavation, and debris removal helper.",
    icon: "daily_worker",
    basePrice: 499,
    originalPrice: 650,
    durationMin: 240,
    sortOrder: 14,
    isActive: true
  },

  // --- CONSTRUCTION WORKER ---
  {
    id: "svc-const-1",
    categoryId: "construction",
    name: "Construction Site Labor (Full Day)",
    slug: "construction-site-labor-full-day",
    description: "Trained site labor for shuttering support, material transport, sand/gravel carrying, and concrete mixing.",
    icon: "construction",
    basePrice: 800,
    originalPrice: 950,
    durationMin: 480,
    sortOrder: 15,
    isActive: true
  },
  {
    id: "svc-const-2",
    categoryId: "construction",
    name: "Concrete Mixing & Shuttering Assistant",
    slug: "concrete-mixing-shuttering-assistant",
    description: "Skilled handling of iron rebar ties, shuttering wood placement, and cement concrete pouring.",
    icon: "construction",
    basePrice: 850,
    originalPrice: 1000,
    durationMin: 480,
    sortOrder: 16,
    isActive: true
  },
  {
    id: "svc-const-3",
    categoryId: "construction",
    name: "Site Contractor Inspection & Estimation",
    slug: "site-contractor-inspection-estimation",
    description: "On-site civil engineer / supervisor assessment for renovation, floor addition, or structural repairs.",
    icon: "construction",
    basePrice: 499,
    originalPrice: 700,
    durationMin: 60,
    sortOrder: 17,
    isActive: true
  },
  {
    id: "svc-const-4",
    categoryId: "construction",
    name: "Demolition & Debris Removal Labor",
    slug: "demolition-debris-removal-labor",
    description: "Safe demolition of non-load-bearing partition walls, tiles, and old plaster with quick debris disposal.",
    icon: "construction",
    basePrice: 899,
    originalPrice: 1100,
    durationMin: 480,
    sortOrder: 18,
    isActive: true
  },

  // --- CARPENTER ---
  {
    id: "svc-carp-1",
    categoryId: "carpenter",
    name: "Master Carpenter Inspection & Repair Visit",
    slug: "master-carpenter-inspection-repair-visit",
    description: "General woodworking repairs, misaligned cabinet doors, squeaky hinges, and minor alterations.",
    icon: "carpenter",
    basePrice: 299,
    originalPrice: 399,
    durationMin: 45,
    sortOrder: 19,
    isActive: true
  },
  {
    id: "svc-carp-2",
    categoryId: "carpenter",
    name: "Door Lock, Mortise Handle & Latch Install",
    slug: "door-lock-mortise-handle-latch-install",
    description: "Precision chiseling and mounting for main door locks, Godrej locks, tower bolts, and hydraulic door closers.",
    icon: "carpenter",
    basePrice: 249,
    originalPrice: 349,
    durationMin: 45,
    sortOrder: 20,
    isActive: true
  },
  {
    id: "svc-carp-3",
    categoryId: "carpenter",
    name: "Furniture Repair & Joint Reinforcement",
    slug: "furniture-repair-joint-reinforcement",
    description: "Restoration of shaky wooden dining tables, bed frames, wooden chairs, and drawer sliding channels.",
    icon: "carpenter",
    basePrice: 399,
    originalPrice: 550,
    durationMin: 60,
    sortOrder: 21,
    isActive: true
  },
  {
    id: "svc-carp-4",
    categoryId: "carpenter",
    name: "Bed & Modular Wardrobe Dismantling / Assembly",
    slug: "bed-wardrobe-dismantling-assembly",
    description: "Careful unbolting and reassembly of engineered wood hydraulic beds, 3-door wardrobes, and modular desks.",
    icon: "carpenter",
    basePrice: 699,
    originalPrice: 950,
    durationMin: 90,
    sortOrder: 22,
    isActive: true
  },
  {
    id: "svc-carp-5",
    categoryId: "carpenter",
    name: "Custom Woodwork & Master Carpenter (Full Day)",
    slug: "custom-woodwork-master-carpenter-full-day",
    description: "Dedicated master carpenter for custom wooden shelving, kitchen woodwork, and full-day carpentry projects.",
    icon: "carpenter",
    basePrice: 1100,
    originalPrice: 1350,
    durationMin: 480,
    sortOrder: 23,
    isActive: true
  },

  // --- MASON (RAJMISTRI) ---
  {
    id: "svc-mas-1",
    categoryId: "mason",
    name: "Master Mason / Rajmistri (Full Day - 8 Hours)",
    slug: "master-mason-rajmistri-full-day",
    description: "Experienced head mason for brick masonry, lintel casting, plastering, and architectural masonry work.",
    icon: "mason",
    basePrice: 1100,
    originalPrice: 1300,
    durationMin: 480,
    sortOrder: 24,
    isActive: true
  },
  {
    id: "svc-mas-2",
    categoryId: "mason",
    name: "Bricklaying & Wall Construction (100 Sq Ft)",
    slug: "bricklaying-wall-construction",
    description: "Precision red brick or AAC block alignment with standard cement-sand mortar and plumb check.",
    icon: "mason",
    basePrice: 1499,
    originalPrice: 1850,
    durationMin: 480,
    sortOrder: 25,
    isActive: true
  },
  {
    id: "svc-mas-3",
    categoryId: "mason",
    name: "Plastering & Cement Crack Patch Repair",
    slug: "plastering-cement-crack-patch-repair",
    description: "Smooth cement plaster application for uneven walls, peeling surfaces, water-damaged patches, and corners.",
    icon: "mason",
    basePrice: 699,
    originalPrice: 899,
    durationMin: 240,
    sortOrder: 26,
    isActive: true
  },
  {
    id: "svc-mas-4",
    categoryId: "mason",
    name: "Floor & Wall Tile Laying / Replacement",
    slug: "floor-wall-tile-laying-replacement",
    description: "Skilled tiler for vitrified floor tiles, bathroom wall tiles, granite kitchen counter edges, and epoxy grouting.",
    icon: "mason",
    basePrice: 899,
    originalPrice: 1150,
    durationMin: 240,
    sortOrder: 27,
    isActive: true
  },

  // --- PAINTER ---
  {
    id: "svc-pnt-1",
    categoryId: "painter",
    name: "Master House Painter (Full Day)",
    slug: "master-house-painter-full-day",
    description: "Skilled interior and exterior wall painter with roll & brush expertise, surface sanding, and masking.",
    icon: "painting",
    basePrice: 950,
    originalPrice: 1200,
    durationMin: 480,
    sortOrder: 28,
    isActive: true
  },
  {
    id: "svc-pnt-2",
    categoryId: "painter",
    name: "1 BHK Interior Wall Fresh Painting",
    slug: "1-bhk-interior-wall-fresh-painting",
    description: "Two coats of premium emulsion paint with minor putty touch-ups for 1 BHK flats and apartments.",
    icon: "painting",
    basePrice: 3499,
    originalPrice: 4200,
    durationMin: 480,
    sortOrder: 29,
    isActive: true
  },
  {
    id: "svc-pnt-3",
    categoryId: "painter",
    name: "Wall Putty, Primer & Sanding (Per Room)",
    slug: "wall-putty-primer-sanding",
    description: "Full wall preparation with two coats of Birla/Asian acrylic putty and smooth orbital sanding.",
    icon: "painting",
    basePrice: 1299,
    originalPrice: 1600,
    durationMin: 480,
    sortOrder: 30,
    isActive: true
  },
  {
    id: "svc-pnt-4",
    categoryId: "painter",
    name: "Waterproofing & Anti-Damp Wall Treatment",
    slug: "waterproofing-anti-damp-wall-treatment",
    description: "Chemical damp-proof barrier application to stop seepage, paint peeling, and white salt efflorescence.",
    icon: "painting",
    basePrice: 899,
    originalPrice: 1199,
    durationMin: 240,
    sortOrder: 31,
    isActive: true
  },

  // --- AC & APPLIANCES ---
  {
    id: "svc-ac-1",
    categoryId: "ac-repair",
    name: "AC Deep Jet Servicing",
    slug: "ac-deep-jet-servicing",
    description: "High-pressure foam jet coil wash, blower cleaning, drain tray flushing, and gas pressure test.",
    icon: "ac",
    basePrice: 499,
    originalPrice: 649,
    durationMin: 45,
    sortOrder: 32,
    isActive: true
  },
  {
    id: "svc-ac-2",
    categoryId: "ac-repair",
    name: "AC Refrigerant Gas Refilling",
    slug: "ac-refrigerant-gas-refilling",
    description: "Complete leak identification, vacuum purge, and 100% genuine R32/R410A gas filling.",
    icon: "ac",
    basePrice: 2099,
    originalPrice: 2500,
    durationMin: 60,
    sortOrder: 33,
    isActive: true
  },
  {
    id: "svc-ac-3",
    categoryId: "ac-repair",
    name: "Split AC Installation / Uninstallation",
    slug: "split-ac-installation-uninstallation",
    description: "Professional indoor & outdoor unit bracket mounting, copper pipe flare connection, and testing.",
    icon: "ac",
    basePrice: 1399,
    originalPrice: 1699,
    durationMin: 90,
    sortOrder: 34,
    isActive: true
  },

  // --- TANK WASH ---
  {
    id: "svc-tank-1",
    categoryId: "tank-wash",
    name: "Sintex Overhead Tank Wash (500L - 1000L)",
    slug: "sintex-overhead-tank-wash",
    description: "Mechanical sludge extraction, high-pressure rotary scrubbing, UV sanitization, and antibacterial spray.",
    icon: "tank",
    basePrice: 499,
    originalPrice: 699,
    durationMin: 60,
    sortOrder: 35,
    isActive: true
  },
  {
    id: "svc-tank-2",
    categoryId: "tank-wash",
    name: "Underground Water Reservoir Deep Wash",
    slug: "underground-water-reservoir-deep-wash",
    description: "Submersible pump dewatering, heavy algae wall scrub, bleaching powder wash, and bacterial disinfection.",
    icon: "tank",
    basePrice: 2500,
    originalPrice: 3200,
    durationMin: 150,
    sortOrder: 36,
    isActive: true
  },

  // --- DEEP CLEAN ---
  {
    id: "svc-deep-1",
    categoryId: "deep-clean",
    name: "Complete Home Deep Cleaning (2 BHK)",
    slug: "complete-home-deep-cleaning-2-bhk",
    description: "Full flat sanitization: 2 bathrooms, kitchen chimney exterior, balcony, windows, doors, and mechanized floor buffing.",
    icon: "home",
    basePrice: 2299,
    originalPrice: 2899,
    durationMin: 210,
    sortOrder: 37,
    isActive: true
  },
  {
    id: "svc-deep-2",
    categoryId: "deep-clean",
    name: "Deep Home Cleaning - 1 BHK",
    slug: "deep-home-cleaning-1-bhk",
    description: "Full 1BHK home deep cleaning including 1 bathroom, kitchen, room, balcony, and floor scrubbing.",
    icon: "home",
    basePrice: 1799,
    originalPrice: 2299,
    durationMin: 180,
    sortOrder: 38,
    isActive: true
  },

  // --- TOILET & BATH ---
  {
    id: "svc-toilet-1",
    categoryId: "toilet-bath",
    name: "Bathroom Deep Cleaning",
    slug: "bathroom-deep-cleaning",
    description: "Tiles, sink, toilet, mirror, fixtures, and floor sanitization.",
    icon: "bathroom",
    basePrice: 299,
    originalPrice: 399,
    durationMin: 60,
    sortOrder: 39,
    isActive: true
  },
  {
    id: "svc-toilet-2",
    categoryId: "toilet-bath",
    name: "Intense Bathroom & Toilet Descaling",
    slug: "intense-bathroom-toilet-descaling",
    description: "Deep chemical descaling of hard water stains from tiles, glass partitions, taps, and sanitaryware.",
    icon: "bathroom",
    basePrice: 399,
    originalPrice: 499,
    durationMin: 45,
    sortOrder: 40,
    isActive: true
  },
  {
    id: "svc-toilet-3",
    categoryId: "toilet-bath",
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
    sortOrder: 41,
    isActive: true
  },

  // --- SOFA CLEAN ---
  {
    id: "svc-sofa-1",
    categoryId: "sofa-clean",
    name: "3-Seater Fabric Sofa Deep Shampoo & Extraction",
    slug: "3-seater-sofa-cleaning",
    description: "High suction foam extraction shampooing removing deep dirt, mites, and food stains.",
    icon: "sofa",
    basePrice: 599,
    originalPrice: 799,
    durationMin: 60,
    sortOrder: 42,
    isActive: true
  },

  // --- KITCHEN & APPLIANCES ---
  {
    id: "svc-kitch-1",
    categoryId: "kitchen-appliances",
    name: "Kitchen Chimney Deep Degreasing",
    slug: "kitchen-chimney-deep-degreasing",
    description: "Complete baffle filter degreasing, motor exterior cleanup, and grease tray chemical soak.",
    icon: "kitchen",
    basePrice: 699,
    originalPrice: 899,
    durationMin: 60,
    sortOrder: 43,
    isActive: true
  },

  // --- AYA & HOUSEMAID ---
  {
    id: "svc-maid-1",
    categoryId: "aya-housemaid",
    name: "Monthly Full-Time / Part-Time Maid Screening",
    slug: "maid-screening-booking",
    description: "Background-checked maid matching for cooking, sweeping, mopping, and home assistance.",
    icon: "cleaning",
    basePrice: 499,
    originalPrice: 699,
    durationMin: 60,
    sortOrder: 44,
    isActive: true
  },

  // --- PEST CONTROL ---
  {
    id: "svc-pest-1",
    categoryId: "pest-control",
    name: "General Pest & Cockroach Gel Treatment",
    slug: "general-pest-cockroach-treatment",
    description: "Odorless herbal Bayer gel dots in kitchen corners and drain spray for cockroach eradication.",
    icon: "pest",
    basePrice: 699,
    originalPrice: 899,
    durationMin: 45,
    sortOrder: 45,
    isActive: true
  },

  // --- SALOON & SPA ---
  {
    id: "svc-spa-1",
    categoryId: "saloon-spa",
    name: "Men's Grooming Haircut & Beard Styling",
    slug: "mens-grooming-haircut-beard",
    description: "Hygienic doorstep haircut, beard shaping, and refreshing scalp massage.",
    icon: "salon",
    basePrice: 299,
    originalPrice: 399,
    durationMin: 45,
    sortOrder: 46,
    isActive: true
  },

  // --- SECURITY ---
  {
    id: "svc-sec-1",
    categoryId: "security",
    name: "Uniformed Security Guard (8-Hour Shift)",
    slug: "uniformed-security-guard-8-hour",
    description: "Trained, disciplined security guard for apartment gatekeeping, visitor logs, and night vigil.",
    icon: "security",
    basePrice: 850,
    originalPrice: 1000,
    durationMin: 480,
    sortOrder: 47,
    isActive: true
  }
];
