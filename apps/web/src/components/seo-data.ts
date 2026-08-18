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
    title: "Toilet & Bathroom Cleaning in Agartala",
    description: "Book attached bathroom cleaning, toilet cleaning, tile scrubbing, stain removal, and sanitisation services in Agartala.",
    keywords: ["bathroom cleaning Agartala", "toilet cleaning Agartala", "washroom cleaning service Agartala"]
  },
  {
    slug: "tank-wash",
    name: "Water Tank Cleaning",
    title: "Water Tank Cleaning in Agartala",
    description: "Professional overhead and underground water tank cleaning in Agartala with sludge removal, scrubbing, and bleaching treatment.",
    keywords: ["water tank cleaning Agartala", "overhead tank wash Agartala", "underground tank cleaning Agartala"]
  },
  {
    slug: "ac-repair",
    name: "AC Service & Repair",
    title: "AC Service and Repair in Agartala",
    description: "Book AC foam jet servicing, AC installation, AC gas filling, dismantling, and appliance repair support in Agartala.",
    keywords: ["AC service Agartala", "AC repair Agartala", "AC gas filling Agartala"]
  },
  {
    slug: "sofa-clean",
    name: "Sofa Cleaning",
    title: "Sofa and Carpet Cleaning in Agartala",
    description: "Professional sofa cleaning, carpet dry wash, upholstery cleaning, and dining chair deep cleaning services in Agartala.",
    keywords: ["sofa cleaning Agartala", "carpet cleaning Agartala", "upholstery cleaning Agartala"]
  },
  {
    slug: "deep-clean",
    name: "Deep Home Cleaning",
    title: "Deep Home Cleaning in Agartala",
    description: "Book 2 BHK, 3 BHK, house deep cleaning, room cleaning, and move-in cleaning services across Agartala.",
    keywords: ["deep cleaning Agartala", "home cleaning Agartala", "house cleaning service Agartala"]
  },
  {
    slug: "kitchen-appliances",
    name: "Kitchen & Appliance Cleaning",
    title: "Kitchen and Appliance Cleaning in Agartala",
    description: "Kitchen chimney cleaning, fridge cleaning, gas stove cleaning, microwave cleaning, fan cleaning, and window cleaning in Agartala.",
    keywords: ["kitchen cleaning Agartala", "chimney cleaning Agartala", "fridge cleaning Agartala"]
  },
  {
    slug: "aya-housemaid",
    name: "Aya and Housemaid",
    title: "Aya and Housemaid Services in Agartala",
    description: "Hire instant maid, housemaid, baby care, and patient care support in Agartala with The Wings Group.",
    keywords: ["maid service Agartala", "aya service Agartala", "housemaid Agartala"]
  },
  {
    slug: "pest-control",
    name: "Pest Control",
    title: "Pest Control in Agartala",
    description: "Book pest control services in Agartala for homes, apartments, kitchens, and commercial spaces.",
    keywords: ["pest control Agartala", "cockroach control Agartala", "termite control Agartala"]
  },
  {
    slug: "painter-plumber",
    name: "Painter & Plumber",
    title: "Painter and Plumber in Agartala",
    description: "Find painting, plumbing, carpenter, and home repair support in Agartala with site verification and clear estimates.",
    keywords: ["painter Agartala", "plumber Agartala", "home repair Agartala"]
  },
  {
    slug: "saloon-spa",
    name: "Saloon & Spa",
    title: "Salon and Spa Services in Agartala",
    description: "At-home salon, spa, grooming, and beauty service enquiries in Agartala through The Wings Group.",
    keywords: ["salon at home Agartala", "spa service Agartala", "beauty service Agartala"]
  },
  {
    slug: "security",
    name: "Security Services",
    title: "Security Guard Services in Agartala",
    description: "Domestic security, private security guard, corporate security, and facility manpower services in Agartala.",
    keywords: ["security guard Agartala", "private security Agartala", "corporate security Agartala"]
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
