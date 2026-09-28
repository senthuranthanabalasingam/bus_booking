export type Ad = { src: string; alt: string; href?: string };

// Banner images live in public/ads. Add, remove or reorder entries to change the home page carousel.
export const ads: Ad[] = [
  { src: "/ads/banner-1.svg", alt: "Summer sale – 20% off all routes", href: "/" },
  { src: "/ads/banner-2.svg", alt: "Travel Colombo to Kandy daily" },
  { src: "/ads/banner-3.svg", alt: "Advertise here" },
];
