import type { ServiceIconKey } from "./ServiceIcon";

export type ServiceCategoryId = "toilet" | "tank" | "ac" | "sofa" | "kitchen" | "deep" | "pest" | "painter" | "salon" | "maid" | "security";

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
  toilet: "Toilet & Bath",
  tank: "Tank Wash",
  ac: "AC & Repair",
  sofa: "Sofa Clean",
  kitchen: "Kitchen & Appliances",
  deep: "Deep Clean",
  pest: "Pest Control",
  painter: "Painter & Plumber",
  salon: "Saloon & Spa",
  maid: "Aya and Housemaid",
  security: "Security"
};

export const services: ServiceItem[] = [
  {
    id: 1,
    category: "toilet",
    iconKey: "bathroom",
    name: "Shiney Toilet Cleaning",
    description: "Deep sanitization of toilet bowl, seat, flush, and surrounding area using professional-grade products.",
    price: 399
  },
  {
    id: 2,
    category: "toilet",
    iconKey: "bathroom",
    name: "Shiney Bathroom Cleaning",
    description: "Complete bathroom cleaning including tiles, floor, sink, mirror, and fixtures.",
    price: 299
  },
  {
    id: 3,
    category: "tank",
    iconKey: "tank",
    name: "Sintex Tank Wash (500 Ltr)",
    description: "Professional overhead tank cleaning and sanitization for 500-litre Sintex tanks.",
    price: 499
  },
  {
    id: 4,
    category: "tank",
    iconKey: "tank",
    name: "Sintex Tank Wash (1000 Ltr)",
    description: "Professional overhead tank cleaning and sanitization for 1000-litre Sintex tanks.",
    price: 699
  },
  {
    id: 5,
    category: "tank",
    iconKey: "tank",
    name: "Underground Tank Wash (Small)",
    description: "Thorough cleaning and disinfection of small underground water storage tanks.",
    price: 2500
  },
  {
    id: 6,
    category: "tank",
    iconKey: "tank",
    name: "Underground Tank Wash (Medium)",
    description: "Thorough cleaning and disinfection of medium underground water storage tanks.",
    price: 3000
  },
  {
    id: 7,
    category: "tank",
    iconKey: "tank",
    name: "Underground Tank Wash (Large)",
    description: "Thorough cleaning and disinfection of large underground water storage tanks.",
    price: 3500
  },
  {
    id: 8,
    category: "ac",
    iconKey: "ac",
    name: "AC Regular Servicing",
    description: "Filter cleaning, coil wash, gas pressure check, and performance tune-up for your AC unit.",
    price: 499
  },
  {
    id: 9,
    category: "ac",
    iconKey: "ac",
    name: "AC Special Servicing incl. Window",
    description: "Complete deep-service including window AC units with detailed internal cleaning.",
    price: 899
  },
  {
    id: 10,
    category: "ac",
    iconKey: "ac",
    name: "AC Gas Filling",
    description: "Refrigerant gas refilling service for optimal cooling performance and energy efficiency.",
    price: 2099
  },
  {
    id: 11,
    category: "ac",
    iconKey: "ac",
    name: "New AC Installation",
    description: "Professional installation of new split or window AC units with proper mounting and piping.",
    price: 1399
  },
  {
    id: 12,
    category: "ac",
    iconKey: "electrician",
    name: "New Fan / Light Install",
    description: "Quick and safe installation of ceiling fans or light fixtures by our electrician.",
    price: 200
  },
  {
    id: 13,
    category: "sofa",
    iconKey: "sofa",
    name: "Sofa Cleaning (Regular)",
    description: "Deep foam cleaning and stain removal for regular-sized sofas and fabric upholstery.",
    price: 599
  },
  {
    id: 14,
    category: "sofa",
    iconKey: "sofa",
    name: "Sofa Cleaning (Large)",
    description: "Full deep cleaning for large sectional or L-shaped sofas with odor treatment.",
    price: 899
  },
  {
    id: 15,
    category: "kitchen",
    iconKey: "kitchen",
    name: "Kitchen Chimney Wash",
    description: "Complete degreasing and cleaning of kitchen chimneys, filters, mesh, and motor.",
    price: 499
  },
  {
    id: 16,
    category: "kitchen",
    iconKey: "appliance",
    name: "Fridge & Refrigerator Cleaning",
    description: "Interior and exterior cleaning of refrigerator including shelves, drawers, and seals.",
    price: 99
  },
  {
    id: 17,
    category: "deep",
    iconKey: "home",
    name: "Deep Home Cleaning - 2BHK",
    description: "2 Bathrooms & Toilets, 1 Kitchen, 2 Living Rooms, Corridor & Fan Wash included.",
    price: 2299
  },
  {
    id: 18,
    category: "deep",
    iconKey: "home",
    name: "Deep Home Cleaning - 3BHK",
    description: "2 Bathrooms & Toilets, 1 Kitchen, 3 Living Rooms, Corridor & Fan Wash included.",
    price: 2699
  }
];

export const searchTerms = [
  "Electrician",
  "Plumber",
  "Carpenter",
  "House Painter",
  "AC Repair & Servicing",
  "Deep Home Cleaning",
  "Bathroom Cleaning",
  "Sofa Cleaning"
];

export const quickServices: Array<{ label: string; iconKey: ServiceIconKey; badge?: string; category: ServiceCategoryId }> = [
  { label: "Toilet & Bath", iconKey: "bathroom", badge: "Same Day", category: "toilet" },
  { label: "Tank Wash", iconKey: "tank", badge: "Same Day", category: "tank" },
  { label: "AC & Repair", iconKey: "ac", badge: "22 mins", category: "ac" },
  { label: "Sofa Clean", iconKey: "sofa", category: "sofa" },
  { label: "Deep Clean", iconKey: "home", category: "deep" },
  { label: "Kitchen & Appliances", iconKey: "kitchen", category: "kitchen" },
  { label: "Aya and Housemaid", iconKey: "home", category: "maid" },
  { label: "Pest Control", iconKey: "pest", category: "pest" },
  { label: "Painter & Plumber", iconKey: "painting", category: "painter" },
  { label: "Saloon & Spa", iconKey: "salon", category: "salon" },
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
  },
  {
    id: "toilet-1",
    category: "toilet",
    iconKey: "bathroom",
    groupLabel: "Toilet Cleaning",
    name: "1 toilet cleaning",
    description: "Deep sanitization of one toilet.",
    price: 399,
    imageUrl: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500&q=85&fit=crop&crop=center"
  },
  {
    id: "toilet-2",
    category: "toilet",
    iconKey: "bathroom",
    groupLabel: "Toilet Cleaning",
    name: "2 toilet cleaning",
    description: "Deep sanitization of two toilets.",
    price: 718.2,
    priceLabel: "718.2",
    originalPrice: 798,
    discountLabel: "10%",
    imageUrl: "https://images.unsplash.com/photo-1564540574859-0dfb63985953?w=500&q=85&fit=crop&crop=center"
  },
  {
    id: "toilet-3",
    category: "toilet",
    iconKey: "bathroom",
    groupLabel: "Toilet Cleaning",
    name: "3 toilet cleaning",
    description: "Deep sanitization of three toilets.",
    price: 957.6,
    priceLabel: "957.6",
    originalPrice: 1197,
    discountLabel: "20%",
    imageUrl: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500&q=85&fit=crop&crop=center"
  },
  {
    id: "bathroom-1",
    category: "toilet",
    iconKey: "bathroom",
    groupLabel: "Bathroom Cleaning",
    name: "1 bathroom cleaning",
    description: "Tiles, floor, sink, mirror, and fixtures cleaning.",
    price: 399,
    imageUrl: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?w=500&q=85&fit=crop&crop=center"
  },
  {
    id: "bathroom-2",
    category: "toilet",
    iconKey: "bathroom",
    groupLabel: "Bathroom Cleaning",
    name: "2 bathroom cleaning",
    description: "Tiles, floor, sink, mirror, and fixtures cleaning for two bathrooms.",
    price: 718.2,
    priceLabel: "718.2",
    originalPrice: 798,
    discountLabel: "10%",
    imageUrl: "https://images.unsplash.com/photo-1564540586988-aa4e53c3d799?w=500&q=85&fit=crop&crop=center"
  },
  {
    id: "bathroom-3",
    category: "toilet",
    iconKey: "bathroom",
    groupLabel: "Bathroom Cleaning",
    name: "3 bathroom cleaning",
    description: "Tiles, floor, sink, mirror, and fixtures cleaning for three bathrooms.",
    price: 957.6,
    priceLabel: "957.6",
    originalPrice: 1197,
    discountLabel: "20%",
    imageUrl: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?w=500&q=85&fit=crop&crop=center"
  }
];
