export const siteUrl = "https://maracworkers.onrender.com";
export const businessName = "Marac Workers";
export const businessPhone = "+919365123456";
export const whatsappUrl = "https://wa.me/919365123456";
export const businessAddress = {
  streetAddress: "GS Road, Christian Basti",
  addressLocality: "Guwahati",
  addressRegion: "Assam",
  postalCode: "781005",
  addressCountry: "IN"
};

export const serviceAreas = [
  "Guwahati",
  "Dispur",
  "Paltan Bazaar",
  "Beltola",
  "Six Mile",
  "Zoo Road",
  "Chandmari",
  "Ganeshguri",
  "Jalukbari",
  "Ulubari",
  "Hatigaon"
];

export const seoServices = [
  {
    slug: "toilet-bath",
    name: "Toilet & Bath Cleaning",
    title: "Toilet & Bathroom Cleaning in Guwahati",
    description: "Book attached bathroom cleaning, toilet cleaning, tile scrubbing, stain removal, and sanitisation services in Guwahati.",
    keywords: ["bathroom cleaning Guwahati", "toilet cleaning Guwahati", "washroom cleaning service Guwahati"]
  },
  {
    slug: "tank-wash",
    name: "Water Tank Cleaning",
    title: "Water Tank Cleaning in Guwahati",
    description: "Professional overhead and underground water tank cleaning in Guwahati with sludge removal, scrubbing, and bleaching treatment.",
    keywords: ["water tank cleaning Guwahati", "overhead tank wash Guwahati", "underground tank cleaning Guwahati"]
  },
  {
    slug: "ac-repair",
    name: "AC Service & Repair",
    title: "AC Service and Repair in Guwahati",
    description: "Book AC foam jet servicing, AC installation, AC gas filling, dismantling, and appliance repair support in Guwahati.",
    keywords: ["AC service Guwahati", "AC repair Guwahati", "AC gas filling Guwahati"]
  },
  {
    slug: "sofa-clean",
    name: "Sofa Cleaning",
    title: "Sofa and Carpet Cleaning in Guwahati",
    description: "Professional sofa cleaning, carpet dry wash, upholstery cleaning, and dining chair deep cleaning services in Guwahati.",
    keywords: ["sofa cleaning Guwahati", "carpet cleaning Guwahati", "upholstery cleaning Guwahati"]
  },
  {
    slug: "deep-clean",
    name: "Deep Home Cleaning",
    title: "Deep Home Cleaning in Guwahati",
    description: "Book 2 BHK, 3 BHK, house deep cleaning, room cleaning, and move-in cleaning services across Guwahati.",
    keywords: ["deep cleaning Guwahati", "home cleaning Guwahati", "house cleaning service Guwahati"]
  },
  {
    slug: "kitchen-appliances",
    name: "Kitchen & Appliance Cleaning",
    title: "Kitchen and Appliance Cleaning in Guwahati",
    description: "Kitchen chimney cleaning, fridge cleaning, gas stove cleaning, microwave cleaning, fan cleaning, and window cleaning in Guwahati.",
    keywords: ["kitchen cleaning Guwahati", "chimney cleaning Guwahati", "fridge cleaning Guwahati"]
  },
  {
    slug: "aya-housemaid",
    name: "Aya and Housemaid",
    title: "Aya and Housemaid Services in Guwahati",
    description: "Hire instant maid, housemaid, baby care, and patient care support in Guwahati with Marac Workers.",
    keywords: ["maid service Guwahati", "aya service Guwahati", "housemaid Guwahati"]
  },
  {
    slug: "pest-control",
    name: "Pest Control",
    title: "Pest Control in Guwahati",
    description: "Book pest control services in Guwahati for homes, apartments, kitchens, and commercial spaces.",
    keywords: ["pest control Guwahati", "cockroach control Guwahati", "termite control Guwahati"]
  },
  {
    slug: "painter-plumber",
    name: "Painter & Plumber",
    title: "Painter and Plumber in Guwahati",
    description: "Find painting, plumbing, carpenter, and home repair support in Guwahati with site verification and clear estimates.",
    keywords: ["painter Guwahati", "plumber Guwahati", "home repair Guwahati"]
  },
  {
    slug: "saloon-spa",
    name: "Saloon & Spa",
    title: "Salon and Spa Services in Guwahati",
    description: "At-home salon, spa, grooming, and beauty service enquiries in Guwahati through Marac Workers.",
    keywords: ["salon at home Guwahati", "spa service Guwahati", "beauty service Guwahati"]
  },
  {
    slug: "security",
    name: "Security Services",
    title: "Security Guard Services in Guwahati",
    description: "Domestic security, private security guard, corporate security, and facility manpower services in Guwahati.",
    keywords: ["security guard Guwahati", "private security Guwahati", "corporate security Guwahati"]
  }
] as const;

export type SeoServiceSlug = (typeof seoServices)[number]["slug"];

export function findSeoService(slug: string) {
  return seoServices.find((service) => service.slug === slug);
}

export const faqItems = [
  {
    question: "Which locations does Marac Workers currently serve?",
    answer: "Marac Workers currently serves Guwahati, Assam, and surrounding regions with verified skilled professionals."
  },
  {
    question: "Can I book electricians, plumbers, and home cleaning online?",
    answer: "Yes. You can browse skilled trade categories and services, add them to your request, pick an instant or scheduled time, and submit your booking."
  },
  {
    question: "Do I need to pay in advance?",
    answer: "Cash on delivery / pay after service is supported, along with secure online payments through Razorpay."
  },
  {
    question: "How do I contact Marac Workers quickly?",
    answer: "You can call or WhatsApp Marac Workers support at +91 93651 23456 or email support@maracworkers.com."
  }
] as const;
