import wpc from "@/assets/tex-wpc.jpg";
import polygranite from "@/assets/tex-polygranite.jpg";
import acrylic from "@/assets/tex-acrylic.jpg";
import baffles from "@/assets/tex-baffles.jpg";
import charcoal from "@/assets/tex-charcoal.jpg";
import pvc3d from "@/assets/tex-pvc3d.jpg";
import fluted from "@/assets/tex-fluted.jpg";
import mosaic from "@/assets/tex-mosaic.jpg";
import soffit from "@/assets/tex-soffit.jpg";
import importedMarble from "@/assets/imported-marble.png";
import luxuryWallCladding from "@/assets/luxury-wall-cladding.png";
import decorativeArtifacts from "@/assets/decorative-artifacts.png";
import importedSculptures from "@/assets/imported-sculptures.png";

export type Product = {
  slug: string;
  name: string;
  collection: string;
  price: number;
  unit: string;
  image: string;
  blurb: string;
  description: string;
  specs: { label: string; value: string }[];
  finishes: string[];
  badge?: string;
};

export const products: Product[] = [
  {
    slug: "wpc-panels",
    name: "WPC Panels",
    collection: "Panels",
    price: 249,
    unit: "sq.ft",
    image: wpc,
    blurb: "Wood-polymer composite louvers with a warm, tactile rhythm.",
    description:
      "Engineered from wood flour and polymer, WPC louvers deliver the warmth of timber with none of the warping. Ideal for feature walls, reception backdrops and full-height cladding.",
    specs: [
      { label: "Panel size", value: "2900 × 160 mm" },
      { label: "Thickness", value: "12 mm" },
      { label: "Core", value: "Wood-polymer composite" },
      { label: "Rating", value: "Termite & moisture resistant" },
    ],
    finishes: ["Rosewood", "Walnut", "Smoked Oak", "Graphite"],
    badge: "Bestseller",
  },
  {
    slug: "polygranites",
    name: "PolyGranites",
    collection: "Surfaces",
    price: 389,
    unit: "sq.ft",
    image: polygranite,
    blurb: "High-gloss stone-look sheets with true veining depth.",
    description:
      "PolyGranite sheets reproduce quarried marble and granite in a lightweight, seam-friendly format — mirror gloss, zero porosity, and no sealing routine.",
    specs: [
      { label: "Sheet size", value: "2440 × 1220 mm" },
      { label: "Thickness", value: "3 mm / 5 mm" },
      { label: "Finish", value: "Mirror gloss" },
      { label: "Rating", value: "Scratch & stain resistant" },
    ],
    finishes: ["Calacatta Gold", "Statuario", "Nero", "Onyx Cream"],
  },
  {
    slug: "acrylic",
    name: "Acrylic",
    collection: "Surfaces",
    price: 425,
    unit: "sq.ft",
    image: acrylic,
    blurb: "Depth-of-glass acrylic laminates for shutters and joinery.",
    description:
      "A cast acrylic top layer over a high-definition print gives an optical depth no film can match. Built for kitchen shutters, wardrobes and vanity fronts.",
    specs: [
      { label: "Sheet size", value: "2440 × 1220 mm" },
      { label: "Thickness", value: "1.5 mm" },
      { label: "Finish", value: "High gloss / matte" },
      { label: "Rating", value: "UV stable, anti-yellowing" },
    ],
    finishes: ["Pearl Cream", "Bone White", "Ink Black", "Terra"],
  },
  {
    slug: "baffles",
    name: "Baffles",
    collection: "Ceilings",
    price: 310,
    unit: "sq.ft",
    image: baffles,
    blurb: "Linear timber baffles that quiet a room and lift a ceiling.",
    description:
      "Suspended baffle systems combine acoustic absorption with a strong linear geometry. Specify mixed tones for depth or single tone for calm.",
    specs: [
      { label: "Baffle size", value: "3000 × 40 × 100 mm" },
      { label: "System", value: "Concealed carrier rail" },
      { label: "Acoustics", value: "NRC up to 0.75" },
      { label: "Rating", value: "Class B fire rated" },
    ],
    finishes: ["Natural Oak", "Teak", "Mixed Tone", "Ebony"],
  },
  {
    slug: "charcoal-panels",
    name: "Charcoal Panels",
    collection: "Panels",
    price: 265,
    unit: "sq.ft",
    image: charcoal,
    blurb: "Deep matte charring with a directional chevron grain.",
    description:
      "Inspired by shou sugi ban, these panels bring a velvet-black, light-absorbing surface to media walls, lobbies and headboards.",
    specs: [
      { label: "Panel size", value: "2400 × 300 mm" },
      { label: "Thickness", value: "9 mm" },
      { label: "Finish", value: "Deep matte" },
      { label: "Rating", value: "Low-VOC, indoor safe" },
    ],
    finishes: ["Char Black", "Ash Grey", "Burnt Umber"],
    badge: "New",
  },
  {
    slug: "pvc-3d-panels",
    name: "PVC 3D Panels",
    collection: "Panels",
    price: 199,
    unit: "sq.ft",
    image: pvc3d,
    blurb: "Faceted relief that turns light into architecture.",
    description:
      "Sculpted geometry casts a different shadow every hour of the day. Lightweight, adhesive-fixed and installable over existing surfaces.",
    specs: [
      { label: "Tile size", value: "600 × 600 mm" },
      { label: "Relief depth", value: "18 mm" },
      { label: "Fixing", value: "Adhesive" },
      { label: "Rating", value: "Waterproof, washable" },
    ],
    finishes: ["Walnut Facet", "Bone", "Sand", "Slate"],
  },
  {
    slug: "pvc-fluted-panels",
    name: "PVC Fluted Panels",
    collection: "Panels",
    price: 179,
    unit: "sq.ft",
    image: fluted,
    blurb: "Fine vertical fluting with a soft metallic shimmer.",
    description:
      "A narrow flute pitch reads almost like fabric from across a room. Available in brushed metallics and warm neutrals.",
    specs: [
      { label: "Panel size", value: "2900 × 170 mm" },
      { label: "Thickness", value: "10 mm" },
      { label: "Flute pitch", value: "12 mm" },
      { label: "Rating", value: "Moisture resistant" },
    ],
    finishes: ["Antique Gold", "Rose Brass", "Champagne", "Pewter"],
  },
  {
    slug: "pvc-panels",
    name: "PVC Panels",
    collection: "Panels",
    price: 149,
    unit: "sq.ft",
    image: soffit,
    blurb: "The quiet workhorse — flat, fast and forgiving.",
    description:
      "Flat PVC cladding for ceilings, balconies and utility spaces. Wipe-clean, humidity-proof and installed in a single day.",
    specs: [
      { label: "Panel size", value: "3000 × 250 mm" },
      { label: "Thickness", value: "8 mm" },
      { label: "Finish", value: "Woodgrain / plain" },
      { label: "Rating", value: "100% waterproof" },
    ],
    finishes: ["Honey Oak", "White Wash", "Grey Linen"],
  },
  {
    slug: "mosaic-tiles",
    name: "Mosaic Tiles",
    collection: "Tiles",
    price: 340,
    unit: "sq.ft",
    image: mosaic,
    blurb: "Chevron marble mosaics on mesh-backed sheets.",
    description:
      "Hand-set marble chevrons on a mesh backing so a complex pattern lays like a simple tile. Perfect for bath walls and niche detailing.",
    specs: [
      { label: "Sheet size", value: "305 × 305 mm" },
      { label: "Chip", value: "Chevron 15 × 75 mm" },
      { label: "Material", value: "Natural marble" },
      { label: "Rating", value: "Wet-area suitable" },
    ],
    finishes: ["Carrara", "Grey Vein", "Bianco"],
  },
  {
    slug: "soffits",
    name: "Soffits",
    collection: "Ceilings",
    price: 215,
    unit: "sq.ft",
    image: soffit,
    blurb: "Grooved soffit planks for eaves, porches and undersides.",
    description:
      "Weather-stable soffit planks with a wide groove that reads cleanly from below. Ventilated variants available on request.",
    specs: [
      { label: "Plank size", value: "3800 × 200 mm" },
      { label: "Thickness", value: "16 mm" },
      { label: "Profile", value: "Wide groove" },
      { label: "Rating", value: "Exterior grade, UV stable" },
    ],
    finishes: ["Golden Teak", "Cedar", "Driftwood"],
  },
  {
    slug: "imported-marble",
    name: "Imported Marble",
    collection: "Marble",
    price: 650,
    unit: "sq.ft",
    image: importedMarble,
    blurb: "Exquisite hand-selected Italian & Turkish natural marble slabs.",
    description:
      "Quarried from classic European veins, cut and polished for bespoke flooring, wall cladding, and feature countertops.",
    specs: [
      { label: "Slab Size", value: "3000 × 1800 mm" },
      { label: "Thickness", value: "18 mm / 20 mm" },
      { label: "Finish", value: "Polished / Honed" },
      { label: "Origin", value: "Italy & Turkey" },
    ],
    finishes: ["Calacatta White", "Statuario Extra", "Michelangelo Grey", "Botticino"],
    badge: "Exclusive",
  },
  {
    slug: "luxury-wall-cladding",
    name: "Luxury Wall Cladding",
    collection: "Cladding",
    price: 495,
    unit: "sq.ft",
    image: luxuryWallCladding,
    blurb: "Architectural acoustic louvers & metallic inlaid feature cladding.",
    description:
      "Multi-layered decorative wall cladding featuring precision brass inlays, acoustic dampen core, and wood-grained louvers.",
    specs: [
      { label: "Panel Size", value: "2900 × 200 mm" },
      { label: "Thickness", value: "15 mm" },
      { label: "Inlay", value: "Brushed Brass" },
      { label: "Rating", value: "Class A Fire & Moisture Resistant" },
    ],
    finishes: ["Royal Walnut", "Smoked Ebony", "Champagne Gold"],
    badge: "Trending",
  },
  {
    slug: "decorative-artifacts",
    name: "Decorative Artifacts",
    collection: "Artifacts",
    price: 850,
    unit: "piece",
    image: decorativeArtifacts,
    blurb: "Handcrafted ceramic, stone, and bronze accent centerpieces.",
    description:
      "Curated collection of handcrafted sculptural artifacts designed to add artistic depth to foyers, niches, and executive spaces.",
    specs: [
      { label: "Craft", value: "Hand-sculpted" },
      { label: "Material", value: "Bronze & Ceramic" },
      { label: "Finish", value: "Patina / Matte Glaze" },
      { label: "Usage", value: "Indoor Display" },
    ],
    finishes: ["Antique Bronze", "Matte Terracotta", "Sandstone White"],
  },
  {
    slug: "imported-sculptures",
    name: "Imported Sculptures",
    collection: "Sculptures",
    price: 1200,
    unit: "piece",
    image: importedSculptures,
    blurb: "Contemporary gallery-grade marble & brass statement sculptures.",
    description:
      "Limited-edition statement sculptures sourced from international artisans to elevate grand entrances and living spaces.",
    specs: [
      { label: "Material", value: "Carved Marble & Solid Brass" },
      { label: "Height", value: "600 mm - 1200 mm" },
      { label: "Edition", value: "Limited Series" },
      { label: "Rating", value: "Architectural Grade" },
    ],
    finishes: ["Nero Marquina & Gold", "Carrara & Satin Brass"],
    badge: "Limited Edition",
  },
];

export const collections = [
  "All",
  "Panels",
  "Surfaces",
  "Ceilings",
  "Tiles",
  "Marble",
  "Cladding",
  "Artifacts",
  "Sculptures",
] as const;

export function getProduct(slug: string) {
  return products.find((p) => p.slug === slug);
}

export const formatPrice = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
